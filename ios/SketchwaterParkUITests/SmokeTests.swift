import XCTest
import UIKit

final class SmokeTests: XCTestCase {
    func testLandscapeOrientation() {
        continueAfterFailure = false
        let app = XCUIApplication(bundleIdentifier: "com.ericberget.sketchwaterpark")
        XCUIDevice.shared.orientation = .portrait
        app.launch()
        let rotate = app.staticTexts["Turn your iPad sideways"]
        XCTAssertTrue(rotate.waitForExistence(timeout: 30))
        XCTAssertFalse(app.buttons["Help & saved parks"].exists, "Portrait must block interaction with the game")
        capture("Portrait play blocked")
        XCUIDevice.shared.orientation = .landscapeLeft
        let help = app.buttons["Help & saved parks"]
        XCTAssertTrue(help.waitForExistence(timeout: 90), app.debugDescription)
        assertLandscape(app)
        XCTAssertFalse(rotate.exists)
        capture("Landscape entrance after turning sideways")
        help.tap()
        XCTAssertTrue(app.staticTexts["Your saved park"].waitForExistence(timeout: 15), app.debugDescription)
        capture("Settings and saved parks")
        for orientation in [UIDeviceOrientation.landscapeRight, .landscapeLeft] {
            XCUIDevice.shared.orientation = orientation
            assertLandscape(app)
            XCTAssertFalse(rotate.exists)
            XCTAssertTrue(app.staticTexts["Your saved park"].waitForExistence(timeout: 15))
        }
        XCUIDevice.shared.orientation = .portraitUpsideDown
        XCTAssertTrue(rotate.waitForExistence(timeout: 15))
        XCTAssertFalse(app.buttons["Export backup"].exists)
        capture("Upright play paused")
        XCUIDevice.shared.press(.home)
        app.activate()
        XCTAssertTrue(rotate.waitForExistence(timeout: 15), "Backgrounding must not bypass the rotation guard")
        XCUIDevice.shared.orientation = .landscapeRight
        XCTAssertTrue(app.staticTexts["Your saved park"].waitForExistence(timeout: 15))
        XCTAssertFalse(rotate.exists)
        capture("Same screen restored in landscape")
        app.terminate()
    }
    func testRelaunch() {
        continueAfterFailure = false
        let app = XCUIApplication(bundleIdentifier: "com.ericberget.sketchwaterpark")
        XCUIDevice.shared.orientation = .landscapeLeft
        app.launch()
        XCTAssertTrue(app.buttons["Help & saved parks"].waitForExistence(timeout: 90))
        app.terminate()
        app.launch()
        XCTAssertTrue(app.buttons["Help & saved parks"].waitForExistence(timeout: 30), app.debugDescription)
        capture("Relaunched entrance")
    }

    /// Uses an opened ride in the dedicated QA park to exercise the longer report.
    func testReviewActionsStayVisible() {
        continueAfterFailure = false
        let app = XCUIApplication(bundleIdentifier: "com.ericberget.sketchwaterpark")
        XCUIDevice.shared.orientation = .landscapeLeft
        app.launch()
        XCTAssertTrue(app.buttons["Back to my park"].waitForExistence(timeout: 90))
        app.buttons["Back to my park"].tap()
        XCTAssertTrue(app.buttons["Park journal"].waitForExistence(timeout: 30))
        app.buttons["Park journal"].tap()
        app.buttons["My rides"].tap()
        app.buttons["Redesign"].firstMatch.tap()
        let testRun = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Test run")).firstMatch
        XCTAssertTrue(testRun.waitForExistence(timeout: 15))
        testRun.tap()
        let nameAndOpen = app.buttons["Name it & open it"]
        XCTAssertTrue(nameAndOpen.waitForExistence(timeout: 90))
        assertVisible(nameAndOpen, in: app)
        XCTAssertTrue(app.staticTexts["Next: name your ride and open it in your park."].exists)
        let lou = app.images["Lou approves with a thumbs-up and a tiny smirk"]
        XCTAssertTrue(lou.exists)
        let louBefore = lou.frame
        XCTAssertGreaterThan(louBefore.height, 0)
        XCTAssertGreaterThanOrEqual(louBefore.minY, app.webViews.firstMatch.frame.minY)
        capture("Review next step visible without scrolling")

        // Scroll only the report body; the next action must stay in the same place.
        let before = nameAndOpen.frame
        let origin = app.coordinate(withNormalizedOffset: .zero)
        let start = origin.withOffset(CGVector(dx: before.midX, dy: before.minY - 45))
        let end = origin.withOffset(CGVector(dx: before.midX, dy: app.webViews.firstMatch.frame.minY + 180))
        start.press(forDuration: 0.1, thenDragTo: end)
        assertVisible(nameAndOpen, in: app)
        XCTAssertEqual(nameAndOpen.frame.minY, before.minY, accuracy: 2)
        capture("Review details scroll above fixed actions")

        nameAndOpen.tap()
        let field = app.textFields.firstMatch
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 30))
        assertVisible(field, in: app)
        assertVisible(app.buttons["Open it in the park!"], in: app)
        // The naming screen selects its suggested name automatically.
        app.typeText("Review Screen QA")
        capture("Review name and confirmation above keyboard")
        app.buttons["Open it in the park!"].tap()
        XCTAssertTrue(app.buttons["Park journal"].waitForExistence(timeout: 30))
        app.buttons["Park journal"].tap()
        app.buttons["My rides"].tap()
        XCTAssertTrue(app.staticTexts["Review Screen QA"].waitForExistence(timeout: 15))

        // A failed test must make its repair action just as discoverable.
        app.buttons["Redesign"].firstMatch.tap()
        XCTAssertTrue(testRun.waitForExistence(timeout: 15))
        app.buttons["Clear"].tap()
        app.buttons["Sure?"].tap()
        draw(app, from: CGPoint(x: 236, y: 380), to: CGPoint(x: 360, y: 470))
        testRun.tap()
        let fix = app.buttons["Fix it"]
        XCTAssertTrue(fix.waitForExistence(timeout: 90))
        assertVisible(fix, in: app)
        let retryLou = app.images["Lou checks his clipboard"]
        XCTAssertTrue(retryLou.exists)
        XCTAssertEqual(retryLou.frame.minY, louBefore.minY, accuracy: 2,
                       "A new report must reset to its top instead of reusing the old scroll position")
        capture("Failed inspection keeps repair action visible")
        fix.tap()
        XCTAssertTrue(testRun.waitForExistence(timeout: 15))
        app.terminate()
    }

    /// Run on the dedicated Splashline Play Save QA simulator with a fresh app container.
    func testFullPlayAndSave() {
        continueAfterFailure = false
        let app = XCUIApplication(bundleIdentifier: "com.ericberget.sketchwaterpark")
        XCUIDevice.shared.orientation = .landscapeLeft
        app.launch()
        XCTAssertTrue(app.buttons["Create my park"].waitForExistence(timeout: 90), app.debugDescription)
        if app.buttons["Turn sound off"].exists { app.buttons["Turn sound off"].tap() }
        let parkName = app.textFields.firstMatch
        parkName.tap()
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 30), app.debugDescription)
        let nameVisible = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            let keyboardTop = app.keyboards.firstMatch.frame.minY
            return parkName.frame.maxY < keyboardTop && app.buttons["Create my park"].frame.maxY < keyboardTop
        }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [nameVisible], timeout: 10), .completed,
                       "The keyboard must not cover the name or confirmation button")
        app.typeText("Simulator Save QA")
        capture("Name entry above keyboard")
        app.buttons["Create my park"].tap()
        let testRun = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Test run")).firstMatch
        XCTAssertTrue(testRun.waitForExistence(timeout: 30), app.debugDescription)
        XCTAssertTrue(app.buttons["Turn sound on"].exists)
        capture("01 New park workshop")

        // Real pointer drags on the notebook, with a partial draft saved first.
        draw(app, from: CGPoint(x: 236, y: 380), to: CGPoint(x: 360, y: 470))
        draw(app, from: CGPoint(x: 360, y: 470), to: CGPoint(x: 480, y: 540))
        XCTAssertTrue(app.buttons["Undo"].isEnabled)
        capture("02 Unfinished slide")
        XCUIDevice.shared.orientation = .portrait
        XCTAssertTrue(app.staticTexts["Turn your iPad sideways"].waitForExistence(timeout: 15))
        XCTAssertFalse(app.buttons["Undo"].exists)
        XCUIDevice.shared.orientation = .landscapeLeft
        XCTAssertTrue(testRun.waitForExistence(timeout: 15))
        XCTAssertTrue(app.buttons["Undo"].isEnabled, "Turning sideways resumes the same drawing")
        XCUIDevice.shared.press(.home)
        app.activate()
        XCTAssertTrue(testRun.waitForExistence(timeout: 30))
        app.terminate()
        app.launch()
        XCTAssertTrue(app.buttons["Back to my park"].waitForExistence(timeout: 30), app.debugDescription)
        XCTAssertTrue(app.staticTexts["Simulator Save QA"].exists)
        XCTAssertTrue(app.buttons["Turn sound on"].exists, "Sound preference persists")
        app.buttons["Back to my park"].tap()
        XCTAssertTrue(testRun.waitForExistence(timeout: 30))
        XCTAssertTrue(app.buttons["Undo"].isEnabled, "The partial drawing survived relaunch")
        capture("03 Restored draft")

        draw(app, from: CGPoint(x: 480, y: 540), to: CGPoint(x: 600, y: 600))
        draw(app, from: CGPoint(x: 600, y: 600), to: CGPoint(x: 700, y: 630))
        draw(app, from: CGPoint(x: 700, y: 630), to: CGPoint(x: 800, y: 646))
        testRun.tap()
        let nameAndOpen = app.buttons["Name it & open it"]
        XCTAssertTrue(nameAndOpen.waitForExistence(timeout: 90), app.debugDescription)
        assertVisible(nameAndOpen, in: app)
        capture("04 Approved slide")
        nameAndOpen.tap()
        let rideField = app.textFields.firstMatch
        XCTAssertTrue(rideField.waitForExistence(timeout: 10))
        let rideName = rideField.value as? String ?? ""
        XCTAssertFalse(rideName.isEmpty)
        app.buttons["Open it in the park!"].tap()
        let firstRide = app.buttons["Ride my slide"]
        XCTAssertTrue(firstRide.waitForExistence(timeout: 20), app.debugDescription)
        capture("05 Grand opening")
        firstRide.tap()
        XCTAssertTrue(app.buttons["Send it"].waitForExistence(timeout: 15))
        app.buttons["Send it"].tap()
        XCTAssertTrue(app.buttons["Ride again"].waitForExistence(timeout: 120), app.debugDescription)
        capture("06 Finished first-person ride")
        app.buttons["Back to the park"].tap()
        XCTAssertTrue(app.buttons["Park journal"].waitForExistence(timeout: 15))
        app.buttons["Park journal"].tap()
        app.buttons["My rides"].tap()
        XCTAssertTrue(app.staticTexts[rideName].waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["Ride it"].exists)
        capture("07 Ride in journal")

        XCUIDevice.shared.press(.home)
        app.activate()
        XCTAssertTrue(app.staticTexts[rideName].waitForExistence(timeout: 30))
        app.terminate()
        app.launch()
        XCTAssertTrue(app.buttons["Back to my park"].waitForExistence(timeout: 30))
        XCTAssertTrue(app.staticTexts["Simulator Save QA"].exists)
        XCTAssertTrue(app.buttons["Turn sound on"].exists)
        app.buttons["Back to my park"].tap()
        XCTAssertTrue(app.buttons["Park journal"].waitForExistence(timeout: 30))
        app.buttons["Park journal"].tap()
        app.buttons["My rides"].tap()
        XCTAssertTrue(app.staticTexts[rideName].waitForExistence(timeout: 10), "Opened ride survived relaunch")
        app.buttons["Redesign"].tap()
        XCTAssertTrue(testRun.waitForExistence(timeout: 15))
        XCTAssertTrue(app.buttons["Undo"].isEnabled, "Opened slide geometry survived relaunch")
        capture("08 Restored ride geometry")

        app.buttons["← Park"].tap()
        app.buttons["Park journal"].tap()
        app.buttons["Settings & saves"].tap()
        app.buttons["New park"].tap()
        XCTAssertTrue(app.staticTexts["Start a new park?"].waitForExistence(timeout: 10))
        app.buttons["Keep backup & start new park"].tap()
        XCTAssertTrue(app.buttons["Create my park"].waitForExistence(timeout: 30), app.debugDescription)
        app.buttons["Help & saved parks"].tap()
        app.buttons["Restore previous park"].tap()
        app.buttons["Open this park"].tap()
        XCTAssertTrue(app.buttons["Back to my park"].waitForExistence(timeout: 30))
        XCTAssertTrue(app.staticTexts["Simulator Save QA"].exists, "Previous park restored after starting over")
        app.buttons["Back to my park"].tap()
        app.buttons["Park journal"].tap()
        app.buttons["My rides"].tap()
        XCTAssertTrue(app.staticTexts[rideName].waitForExistence(timeout: 15), "Backup includes the opened ride")
        capture("09 Restored previous park")
        app.terminate()
    }

    private func draw(_ app: XCUIApplication, from start: CGPoint, to end: CGPoint) {
        let web = app.webViews.firstMatch
        let frame = web.frame
        // The game fits a 1200 × 720 notebook plus its 46-point binding inside the web view.
        let scale = min((frame.width - 68) / 1246, (frame.height - 68) / 720)
        let left = frame.minX + (frame.width - 1246 * scale) / 2 + 46 * scale
        let top = frame.minY + (frame.height - 720 * scale) / 2
        let origin = app.coordinate(withNormalizedOffset: .zero)
        let a = origin.withOffset(CGVector(dx: left + start.x * scale, dy: top + start.y * scale))
        let b = origin.withOffset(CGVector(dx: left + end.x * scale, dy: top + end.y * scale))
        a.press(forDuration: 0.15, thenDragTo: b, withVelocity: XCUIGestureVelocity(rawValue: 130), thenHoldForDuration: 0.1)
    }

    private func assertLandscape(_ app: XCUIApplication) {
        let landscape = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            let frame = app.webViews.firstMatch.frame
            return frame.width > frame.height && frame.height > 0
        }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [landscape], timeout: 15), .completed,
                       "The game must keep a horizontal play area")
    }

    private func assertVisible(_ element: XCUIElement, in app: XCUIApplication) {
        let visible = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            guard element.exists && element.isHittable else { return false }
            let frame = element.frame, web = app.webViews.firstMatch.frame
            let bottom = app.keyboards.firstMatch.exists ? min(web.maxY, app.keyboards.firstMatch.frame.minY) : web.maxY
            return frame.minX >= web.minX && frame.maxX <= web.maxX && frame.minY >= web.minY && frame.maxY <= bottom
        }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [visible], timeout: 15), .completed,
                       "The next step must be fully visible without scrolling, including above the keyboard")
    }

    private func capture(_ name: String) {
        let shot = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        shot.name = name
        shot.lifetime = .keepAlways
        add(shot)
    }
}
