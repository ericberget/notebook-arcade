# Sketchwater Park for iPad

The simplest package for this game is a small Swift app containing the existing HTML/Canvas game in WKWebView. The game has no framework or server dependency, so a native rewrite or Capacitor would add maintenance without preserving it better. This app keeps the current notebook art, simulation, ride designs, unlocks, drafts, sound, and version-2 park JSON format. The existing uncommitted double-tap fix (`touch-action: manipulation` on buttons and back links) is included.

## Current build: 0.1.0 (1)

Open `SketchwaterPark.xcodeproj` in Xcode. The shared scheme is `SketchwaterPark`. The target supports iPads on iPadOS 16 or newer and both landscape orientations. Portrait gameplay is excluded in both the app metadata and its root view controller. `UIRequiresFullScreen` requests compatibility behavior on iPad; newer windowing modes may scale a landscape scene into a portrait display. A native “Turn your iPad sideways” screen therefore also checks device orientation and window shape, blocks game interaction and accessibility, pauses the simulation/audio, and saves the current draft until the player turns sideways. Returning from the background cannot bypass it. See [Apple’s orientation and compatibility notes](https://developer.apple.com/documentation/BundleResources/Information-Property-List/UIRequiresFullScreen). The proposed bundle identifier is `com.ericberget.sketchwaterpark`; confirm availability in your Apple account before registering it, and keep it unchanged once you distribute builds to preserve the app's save container.

The build automatically runs `../scripts/prepare-ipad.py`, copying the current game and local dependencies into `SketchwaterPark/Web`. That generated directory is ignored by Git. Python 3 comes with the installed Apple command-line tools. No npm install, CocoaPods, server, or runtime internet connection is needed. Run `python3 scripts/prepare-ipad.py` from the repository root to prepare it manually. The icon uses the supplied blue waterslide artwork, preserved at `ios/Artwork/appicon-sketchwaterpark.png`. Regenerate the ten opaque PNG sizes, including the 1024 × 1024 App Store icon, with `python3 scripts/make-ipad-icons.py`. The script resizes the supplied art without redrawing it.

## Saving and transfer

The app hydrates a synchronous JavaScript storage adapter before game startup. Writes travel through a serial native queue into an atomic Application Support file, and the game shows success only after the native reply. It keeps both the game's primary/backup/previous-park slots and a previous native archive. Duplicate writes do not rotate away the archive backup. A failed write can be retried; unreadable native archives stop startup rather than silently resetting progress. Saves are eligible for normal device backups and persist through app updates. Deleting the app deletes its local container: keep an exported copy before doing that.

Browser saves cannot be read directly from the app sandbox. In the existing browser game, choose Help & saved parks → Export backup (or Park journal → Settings & saves → Export backup), then save the JSON to Files. In the iPad app, choose Import backup, select that file, review the park name and ride count, then choose Open this park. The current app park becomes the previous-park backup. Export inside the app uses Apple's share sheet, including Save to Files. This is manual transfer, not cloud synchronization. Never change or clear the browser's existing storage to migrate.

Imports and new parks wait for the native write before reloading, and prevent pagehide from overwriting the replacement with the old park. Backgrounding ends active gestures, preserves drafts, flushes pending changes, suspends audio, and resets elapsed time when returning. Web-process termination rebuilds the view from the last durable save. Progress since the last acknowledged save can still be lost during an abrupt OS termination.

## Touch, rides, and offline operation

Inspection reports open at the top with all of Lou visible, resetting any previous scroll position. The report scrolls above a fixed footer containing the next-step instruction, action buttons, and naming controls. Approved rides prominently offer “Name it & open it”; failed rides prominently offer “Fix it.” The naming field and open button remain above the docked keyboard.

Existing pointer input supports fingers and Pencil. Tablet controls compensate for notebook scaling to target at least 44 CSS pixels, including while the keyboard is open. The web view follows the native keyboard layout guide; name fields and confirmation buttons remain above the keyboard. Focused controls stay in their existing layout tree so resizing cannot dismiss the keyboard. Both camera modes, drag-to-look, all 29 designs, and ride timing remain intact. Native canvas resolution is capped at 1.5 times game coordinates to reduce fill work on Retina iPads. Rendering stops doing scene work while backgrounded; ride physics are unchanged. Native persistence runs off the UI thread. Real frame rates and thermal behavior remain unmeasured until a physical iPad run.

Artwork, desk texture, audio, and all three used fonts are bundled, including Rubik Distressed and its license. A stable custom URL scheme serves local files, including audio fetches. Content policy prevents remote runtime dependencies. The optional author link deliberately opens Safari; it is not required to play. There are no analytics, ads, accounts, or server calls in the native package.

## TestFlight handoff

1. Install a current App Store-supported Xcode and open it once to install iOS platform support. Xcode 26.6 Universal is now installed on this Intel Mac. The complete unsigned iPad simulator and physical-device builds passed on October 18, 2026; physical-device signing and testing remain pending. Apple's minimum upload requirement effective April 28, 2026 is the iOS/iPadOS 26 SDK or later: https://developer.apple.com/news/?id=ueeok6yw . The deployment target (iPadOS 16) is independent of the SDK used to build.
2. Sign into Xcode with your Apple Developer Program account. In the app target's Signing & Capabilities, select your team and confirm the bundle identifier. No team, credentials, or signing certificates have been invented or embedded.
3. Select an iPad simulator and build. Then connect your actual iPad, select it, run the app, and complete the device checks below. Swift code was typechecked against the iOS 26.5 SDK and the complete simulator app compiled successfully. The simulator play/save checks below have passed; physical-device checks remain required.
4. Create the matching iOS app in App Store Connect (display name Sketchwater Park, language English, matching bundle ID; choose a unique SKU). Confirm the privacy answers, age rating, export-compliance answers, contact information, and app icon. The current code collects no data and includes a no-collection privacy manifest.
5. Select Any iOS Device, choose Product → Archive, then Organizer → Distribute App → App Store Connect → Upload. Increase the build number for every subsequent upload.
6. After processing, open TestFlight in App Store Connect, add testing instructions and an internal tester with account access, and enable the build. External testers require the applicable beta review. Install through TestFlight on the iPad. Apple guide: https://help.apple.com/xcode/mac/current/en.lproj/dev2539d985f.html .

No signed archive has been created or uploaded. The remaining dependencies are your developer team/App Store Connect setup and physical-device verification.

## Required device checks before sharing a beta

- Airplane mode from a cold launch: verify notebook lettering, Lou artwork, desk, all sounds, drawing, testing, and first-person rides.
- Import an exported established park with several rides, purchases, and an unfinished drawing. Compare names, tickets, unlocks, styles, and drafts. Export again and reopen that copy.
- Draw using finger and Pencil; rapidly tap confirmations; test multi-touch, cancelled gestures, both landscape directions, and attempts to rotate upright. Confirm the game retains a horizontal play area and the keyboard never hides the name confirmation. Check windowed behavior on the actual iPadOS version.
- Run representative loop, drop, launch, and long Grand Tour rides in both camera modes. Check sustained responsiveness, drag-to-look, splash sounds, replay, and return to park. Record the iPad model, iPadOS, and observed frame rates using Xcode's profiling tools.
- Background mid-drawing and mid-ride, lock/unlock, and return. After the saved indicator confirms, force-quit and reopen; verify the latest park. Check an app update over an existing TestFlight build without uninstalling.
- Test Files import, cancelled import, malformed JSON, future save versions, new-park backup, and previous-park restore. Ensure import/new-park remains in place after restart.
- Simulate disk-write failure and WebKit process termination with Xcode. Verify truthful saving status, retry, recovery, and no silent new park on unreadable saves.

## Checks run locally

From the repository root:

```sh
python3 scripts/prepare-ipad.py
for test in tests/splash-line-*.cjs; do node "$test" || exit; done
swiftc -parse ios/SketchwaterPark/*.swift
swiftc ios/SketchwaterPark/SaveStore.swift tests/ipad-save-store.swift -o /tmp/sketchwater-save-tests
/tmp/sketchwater-save-tests
plutil -lint ios/SketchwaterPark.xcodeproj/project.pbxproj ios/SketchwaterPark/Info.plist ios/SketchwaterPark/PrivacyInfo.xcprivacy
```

The gameplay suites pass for all 29 slide kits, camera behavior, attractions, surf, progression, purchases, migration, and recovery. Native bridge tests cover hydration, drafts, ordered acknowledgments, failed writes/retries, exports, and replacement-save reload protection. Compiled Foundation tests cover real file writes, duplicate-write backup retention, corruption recovery, and blocked startup when both archives are corrupt. Browser preview is a smoke test only, not iPad/WKWebView certification.

## Simulator UI checks — October 18, 2026

The play/save, orientation, and relaunch `SmokeTests` passed on an isolated iPad (A16), iOS 26.5 simulator: three tests, zero failures in 270 seconds. `testFullPlayAndSave` uses real keyboard input and pointer drags to verify:

- Naming a new park with the name field and confirmation above the keyboard.
- Drawing two sections, rotating upright and back without losing the drawing, backgrounding, closing the app, and reopening the unfinished slide.
- Continuing the drawing, testing and approving it, naming/opening the ride, completing the first-person ride, and returning to the journal.
- Closing/reopening again, retaining the park name and muted preference, finding the ride, and reopening its geometry for editing.
- Starting a new park with a retained backup, restoring the old park, and finding its ride again.

The test exposed and fixed two keyboard problems: viewport changes could reparent the focused input and dismiss the keyboard, and the keyboard could cover the name field. Regression checks now cover both behaviors. Native save tests also passed for atomic writes, duplicate-write backup retention, damaged-primary recovery, and fail-closed startup. JavaScript checks passed for the native bridge, drafts, write failures/retries, ordered saves, replacement/reload protection, progression, and all 29 ride/camera simulations.

The orientation test exposed iPadOS compatibility letterboxing: declaring landscape alone still allowed a playable horizontal scene while the device was held upright. The native orientation guard now blocks that case. `SmokeTests/testLandscapeOrientation` passed for portrait launch, both horizontal directions, upside-down portrait, background/return while upright, and returning to the same settings screen after rotating sideways. The test asserts game controls are unavailable behind the prompt. Inspection of the saved archive confirmed the named park, its opened ride with five drawing strokes and 46 trajectory frames, completed first ride, editing draft, muted preference, and all three save slots.

The full flow requires a fresh app container on a dedicated test simulator. It deliberately does not erase existing player data. Run the complete suite (play/save, rotation, and relaunch) with a fresh simulator UUID from the repository root:

```sh
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild \
  -project ios/SketchwaterPark.xcodeproj -scheme SketchwaterPark \
  -destination 'platform=iOS Simulator,id=<fresh-test-simulator-uuid>' \
  -parallel-testing-enabled NO \
  -only-testing:SketchwaterParkUITests/SmokeTests \
  CODE_SIGNING_ALLOWED=NO ONLY_ACTIVE_ARCH=YES test
```

Final result bundle on this Mac: `/tmp/splashline-final-play-save-6.xcresult`; log: `/tmp/splashline-final-play-save-6.log`; screenshots: `/tmp/splashline-final-play-save-6-shots`. Physical-device performance, Pencil input, audible playback, Files/share-sheet transfers, and TestFlight updates still require device testing. The simulator test intentionally mutes sound.

The review-screen follow-up `testReviewActionsStayVisible` also passed: one test, zero failures in 85 seconds. On an existing opened ride, it verifies the main action is fully visible before any scrolling, stays in the same place while details scroll, and leads to a name field and confirmation above the keyboard. It renames and opens the ride, verifies the new name in the journal, then deliberately draws a failing slide and confirms that “Fix it” is visible and Lou returns to the same opening position instead of inheriting the old report's scroll. Standalone runs require an opened ride without a conflicting unfinished draft in the isolated QA park; the full suite creates that setup. Result bundle: `/tmp/splashline-review-footer-3.xcresult`; screenshots: `/tmp/splashline-review-footer-3-shots`.
