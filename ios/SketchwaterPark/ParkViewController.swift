import UIKit
import WebKit
import UniformTypeIdentifiers

/// Serve bundled assets on one stable origin, including fetch() audio and local fonts.
final class BundleScheme: NSObject, WKURLSchemeHandler {
    let root: URL
    init(root: URL) { self.root = root.standardizedFileURL }
    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        do {
            guard let url = urlSchemeTask.request.url, url.host == "app" else { throw CocoaError(.fileReadNoPermission) }
            let file = root.appendingPathComponent(url.path).standardizedFileURL
            guard file.path.hasPrefix(root.path + "/") else { throw CocoaError(.fileReadNoPermission) }
            let data = try Data(contentsOf: file)
            let mime = UTType(filenameExtension: file.pathExtension)?.preferredMIMEType ?? "application/octet-stream"
            let response = URLResponse(url: url, mimeType: mime, expectedContentLength: data.count, textEncodingName: ["html", "js", "css", "json", "svg"].contains(file.pathExtension) ? "utf-8" : nil)
            urlSchemeTask.didReceive(response)
            urlSchemeTask.didReceive(data)
            urlSchemeTask.didFinish()
        } catch { urlSchemeTask.didFailWithError(error) }
    }
    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}
}

final class ParkViewController: UIViewController, WKScriptMessageHandlerWithReply, WKNavigationDelegate {
    private var web: WKWebView?
    private var store: SaveStore?
    private let saveQueue = DispatchQueue(label: "SketchwaterPark.saves")
    private let rotateCover = UIView()
    private var needsLandscape = false
    override var prefersStatusBarHidden: Bool { true }
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { .landscape }
    override var preferredInterfaceOrientationForPresentation: UIInterfaceOrientation { .landscapeRight }
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.91, green: 0.89, blue: 0.84, alpha: 1)
        NotificationCenter.default.addObserver(self, selector: #selector(pause), name: UIApplication.willResignActiveNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(resume), name: UIApplication.didBecomeActiveNotification, object: nil)
        UIDevice.current.beginGeneratingDeviceOrientationNotifications()
        NotificationCenter.default.addObserver(self, selector: #selector(updateOrientation), name: UIDevice.orientationDidChangeNotification, object: nil)
        configureRotateCover()
        boot()
    }
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        updateOrientation()
    }
    private func configureRotateCover() {
        rotateCover.backgroundColor = view.backgroundColor
        rotateCover.translatesAutoresizingMaskIntoConstraints = false
        rotateCover.accessibilityViewIsModal = true
        rotateCover.isHidden = true
        view.addSubview(rotateCover)
        let icon = UIImageView(image: UIImage(systemName: "ipad.landscape"))
        icon.tintColor = UIColor(red: 0.12, green: 0.26, blue: 0.65, alpha: 1)
        icon.contentMode = .scaleAspectFit
        icon.heightAnchor.constraint(equalToConstant: 64).isActive = true
        let title = UILabel()
        title.text = "Turn your iPad sideways"
        title.font = .preferredFont(forTextStyle: .title1)
        title.adjustsFontForContentSizeCategory = true
        title.textAlignment = .center
        title.numberOfLines = 0
        title.textColor = icon.tintColor
        let detail = UILabel()
        detail.text = "Sketchwater Park plays horizontally.\nYour game is paused until you turn back."
        detail.font = .preferredFont(forTextStyle: .body)
        detail.adjustsFontForContentSizeCategory = true
        detail.textAlignment = .center
        detail.numberOfLines = 0
        detail.textColor = .darkGray
        let stack = UIStackView(arrangedSubviews: [icon, title, detail])
        stack.axis = .vertical
        stack.spacing = 20
        stack.translatesAutoresizingMaskIntoConstraints = false
        rotateCover.addSubview(stack)
        NSLayoutConstraint.activate([
            rotateCover.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            rotateCover.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            rotateCover.topAnchor.constraint(equalTo: view.topAnchor),
            rotateCover.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            stack.centerXAnchor.constraint(equalTo: rotateCover.centerXAnchor),
            stack.centerYAnchor.constraint(equalTo: rotateCover.centerYAnchor),
            stack.widthAnchor.constraint(lessThanOrEqualToConstant: 480),
            stack.leadingAnchor.constraint(greaterThanOrEqualTo: rotateCover.leadingAnchor, constant: 24),
            stack.trailingAnchor.constraint(lessThanOrEqualTo: rotateCover.trailingAnchor, constant: -24)
        ])
    }
    @objc private func updateOrientation() {
        let orientation = UIDevice.current.orientation
        // iPadOS can letterbox a landscape-only scene inside a portrait display.
        // Use physical orientation as well as the window shape to block upright play.
        var portrait = needsLandscape
        if orientation.isPortrait { portrait = true }
        else if orientation.isLandscape { portrait = false }
        else if orientation == .unknown, let screen = view.window?.screen {
            portrait = screen.bounds.height > screen.bounds.width
        }
        portrait = portrait || view.bounds.height > view.bounds.width
        let changed = needsLandscape != portrait
        needsLandscape = portrait
        rotateCover.isHidden = !portrait
        view.bringSubviewToFront(rotateCover)
        web?.isUserInteractionEnabled = !portrait
        web?.accessibilityElementsHidden = portrait
        if changed {
            if portrait { view.endEditing(true); pause() }
            else if UIApplication.shared.applicationState == .active { resume() }
        }
    }
    private func boot() {
        do {
            let support = try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
            let store = try SaveStore(directory: support.appendingPathComponent("SketchwaterPark", isDirectory: true))
            let values = try store.load()
            self.store = store
            let config = WKWebViewConfiguration()
            guard let root = Bundle.main.url(forResource: "Web", withExtension: nil),
                  let bridgeURL = Bundle.main.url(forResource: "native-bridge", withExtension: "js") else { throw CocoaError(.fileNoSuchFile) }
            config.setURLSchemeHandler(BundleScheme(root: root), forURLScheme: "sketchwater")
            config.websiteDataStore = .default()
            config.allowsInlineMediaPlayback = true
            config.mediaTypesRequiringUserActionForPlayback = []
            config.userContentController.addScriptMessageHandler(self, contentWorld: .page, name: "park")
            let seed = String(data: try JSONEncoder().encode(values), encoding: .utf8)!
            let bridge = try String(contentsOf: bridgeURL, encoding: .utf8)
            config.userContentController.addUserScript(WKUserScript(source: "window.__SKETCHWATER_SAVES__ = \(seed);\n" + bridge, injectionTime: .atDocumentStart, forMainFrameOnly: true))
            let web = WKWebView(frame: .zero, configuration: config)
            web.navigationDelegate = self
            web.isOpaque = false; web.backgroundColor = view.backgroundColor
            web.scrollView.isScrollEnabled = false
            web.scrollView.bounces = false
            web.translatesAutoresizingMaskIntoConstraints = false
            view.addSubview(web)
            NSLayoutConstraint.activate([
                web.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor),
                web.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor),
                web.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
                // Give fixed-position game controls real space above the docked keyboard.
                web.bottomAnchor.constraint(equalTo: view.keyboardLayoutGuide.topAnchor)
            ])
            self.web = web
            updateOrientation()
            web.load(URLRequest(url: URL(string: "sketchwater://app/games/splash-line/index.html")!))
        } catch {
            DispatchQueue.main.async { self.showError("Your saved park could not be opened. Its files have been kept. Close and reopen the app to try again.\n\n\(error.localizedDescription)") }
        }
    }
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage, replyHandler: @escaping (Any?, String?) -> Void) {
        guard message.frameInfo.isMainFrame, message.frameInfo.securityOrigin.protocol == "sketchwater",
              let body = message.body as? [String: Any], let action = body["action"] as? String else {
            replyHandler(nil, "Untrusted request"); return
        }
        do {
            if action == "save", let values = body["values"] as? [String: String], let store = store {
                saveQueue.async {
                    do {
                        try store.save(values)
                        let seed = String(data: try JSONEncoder().encode(values), encoding: .utf8)!
                        let bridgeURL = Bundle.main.url(forResource: "native-bridge", withExtension: "js")!
                        let bridge = try String(contentsOf: bridgeURL, encoding: .utf8)
                        DispatchQueue.main.async {
                            // Refresh hydration only after durable success and before replying.
                            let scripts = self.web?.configuration.userContentController
                            scripts?.removeAllUserScripts()
                            scripts?.addUserScript(WKUserScript(source: "window.__SKETCHWATER_SAVES__ = \(seed);\n" + bridge, injectionTime: .atDocumentStart, forMainFrameOnly: true))
                            replyHandler(true, nil)
                        }
                    } catch {
                        DispatchQueue.main.async { replyHandler(nil, error.localizedDescription) }
                    }
                }
            } else if action == "export", let json = body["json"] as? String, let bytes = json.data(using: .utf8) {
                _ = try JSONSerialization.jsonObject(with: bytes)
                let folder = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
                try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
                let file = folder.appendingPathComponent("sketchwater-park.json")
                try bytes.write(to: file, options: .atomic)
                let sheet = UIActivityViewController(activityItems: [file], applicationActivities: nil)
                sheet.popoverPresentationController?.sourceView = view
                sheet.popoverPresentationController?.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 1, height: 1)
                sheet.completionWithItemsHandler = { _, _, _, _ in try? FileManager.default.removeItem(at: folder) }
                present(sheet, animated: true)
                replyHandler(true, nil)
            } else { replyHandler(nil, "Unknown request") }
        } catch { replyHandler(nil, error.localizedDescription) }
    }
    @objc private func pause() {
        // A short background task lets the JS snapshot and acknowledged atomic write finish.
        var task = UIBackgroundTaskIdentifier.invalid
        task = UIApplication.shared.beginBackgroundTask {
            if task != .invalid { UIApplication.shared.endBackgroundTask(task); task = .invalid }
        }
        web?.callAsyncJavaScript("window.SketchwaterLifecycle?.(false); await window.SketchwaterNative?.storage.flush();", arguments: [:], in: nil, in: .page) { _ in
            if task != .invalid { UIApplication.shared.endBackgroundTask(task); task = .invalid }
        }
    }
    @objc private func resume() {
        updateOrientation()
        web?.evaluateJavaScript("window.SketchwaterLifecycle?.(\(!needsLandscape))", completionHandler: nil)
    }
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        let url = navigationAction.request.url
        decisionHandler(url?.scheme == "sketchwater" && url?.host == "app" ? .allow : .cancel)
        if navigationAction.navigationType == .linkActivated, let url = url, url.scheme == "https" {
            UIApplication.shared.open(url)
        }
    }
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        // Recreate from durable storage; never seed a restart with stale in-memory state.
        webView.configuration.userContentController.removeScriptMessageHandler(forName: "park", contentWorld: .page)
        webView.removeFromSuperview(); web = nil
        saveQueue.async { DispatchQueue.main.async { self.boot() } }
    }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        updateOrientation()
        if needsLandscape || UIApplication.shared.applicationState != .active { pause() }
        if store?.recovered == true { showError("Your previous saved park was recovered. Keep an exported backup from Settings & saves.") }
    }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { showError(error.localizedDescription) }
    private func showError(_ message: String) {
        guard presentedViewController == nil else { return }
        let alert = UIAlertController(title: "Sketchwater Park", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}
