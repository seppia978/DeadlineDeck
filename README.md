# DeadlineDeck

DeadlineDeck is a Scriptable widget for tracking academic conference deadlines on iPhone and iPad. It combines AI/ML and security conference feeds, keeps a last-known-good offline cache, and highlights urgent milestones without hiding the official time zone.

## Download

Download the latest installable package:

- [DeadlineDeck.zip](https://github.com/seppia978/DeadlineDeck/releases/latest/download/DeadlineDeck.zip)
- [Latest release notes](https://github.com/seppia978/DeadlineDeck/releases/latest)

Use the release asset named `DeadlineDeck.zip`. GitHub's automatically generated “Source code” archives are repository snapshots, not the installable package.

## Features

- Small, medium, and large Scriptable widgets.
- Editable row limits: 1 deadline on small, 3 on medium, and 6 on large by default.
- AI/ML and security conferences in one searchable picker.
- Venue city, state/region, and country when announced; otherwise `Location TBD`.
- Two-letter, color-coded research-area badges such as `ML`, `CV`, `NL`, and `SC`.
- Uniform amber urgency highlighting within 14 days and uniform red highlighting within 7 days.
- Signed live offsets: `+` before a milestone and `−` briefly after it.
- Separate last-known-good caches for both data feeds plus vetted offline fallbacks.
- One local update alert for each newer stable DeadlineDeck release.

## Requirements

- iOS or iPadOS
- [Scriptable](https://scriptable.app/)
- Internet access for fresh conference data and release checks; cached and bundled data remain available offline

## Installation

1. Download and extract `DeadlineDeck.zip` in the Files app.
2. Move `DeadlineDeck.js` to `iCloud Drive/Scriptable`.
3. Open Scriptable and run `DeadlineDeck` once.
4. Choose **Select Conferences**. Each tap is saved immediately.
5. Add a Scriptable widget to the Home Screen and select the `DeadlineDeck` script.

For later pages, add equal-sized copies of the widget to a stack and set their Scriptable **Parameter** values to `1`, `2`, `3`, and so on.

## Configuration

The main user-editable constants are near the beginning of `DeadlineDeck.js`:

```js
const MAX_N_ROWS = 6
const MEDIUM_WIDGET_MAX_N_ROWS = 3
const CHECK_FOR_APP_UPDATES = true
const WARNING_DEADLINE_DAYS = 14
const URGENT_DEADLINE_DAYS = 7
```

iOS controls the exact widget-refresh time. DeadlineDeck requests refreshes at the urgency thresholds and shortly after each milestone, but a delay is still possible.

## Updates and notifications

Every public app update is a versioned [GitHub Release](https://github.com/seppia978/DeadlineDeck/releases). Previous versions remain downloadable there.

DeadlineDeck checks the small public `latest.json` release manifest at most once every six hours while Scriptable is already executing the app or a widget. The check requires no GitHub account or token and DeadlineDeck sends no analytics; the normal HTTPS request still exposes ordinary network metadata to GitHub. When a newer stable release is found, Scriptable schedules one local notification for that version. Tapping it opens the release page. DeadlineDeck never downloads or executes update code automatically.

Notification timing depends on the next iOS widget run and on Scriptable's notification permission. For a separate GitHub-native channel, choose **Watch → Custom → Releases** on this repository.

To update manually, download the new `DeadlineDeck.zip` and replace only `DeadlineDeck.js`. Conference selections and cached data are kept separately. Reapply any constants you edited in the old script.

## Data sources and accuracy

DeadlineDeck reads public data at runtime from:

- [ai-deadlines](https://github.com/tobna/ai-deadlines)
- [sec-deadlines](https://github.com/sec-deadlines/sec-deadlines.github.io)

The source projects are community-maintained and remain responsible for their respective data. DeadlineDeck does not copy full dataset dumps into this repository. Always verify the official conference website before submitting.

## Development

The test suite has no third-party runtime dependencies:

```bash
npm test
npm run package
```

`npm run package` creates `dist/DeadlineDeck.zip`, `dist/latest.json`, and checksums from an explicit allowlist. The ZIP always contains exactly:

- `DeadlineDeck.js`
- `DeadlineDeck.txt`
- `INSTALL-DeadlineDeck.txt`

On `main`, a version change in `APP_VERSION` is tested and published automatically as `vMAJOR.MINOR.PATCH`. Commits that do not change the version do not create another release.

## License

DeadlineDeck is released under the [MIT License](LICENSE).
