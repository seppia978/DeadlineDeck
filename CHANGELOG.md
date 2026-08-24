# Changelog

All notable DeadlineDeck changes are documented here. Releases follow Semantic Versioning.

## [1.7.7] - 2026-08-24

### Fixed

- Replaced the fixed conference-identity width with a clamped value derived from the device's logical short screen side.
- Preserved the validated 220-point layout on iPhone 15 Pro while reducing the column on narrower iPhones and capping it on larger devices.

## [1.7.6] - 2026-08-24

### Fixed

- Pinned short conference names to the leading edge of the fixed identity column.
- Moved flexible trailing space after the countdown so badges, names, and timing columns align consistently across rows.

## [1.7.5] - 2026-08-24

### Fixed

- Assigned the conference-identity block a positive 220-point width in medium and large rows.
- Prevented Scriptable's automatic stack sizing from truncating the USENIX cycle label while leaving unused space after the countdown.

## [1.7.4] - 2026-08-24

### Fixed

- Removed the duplicated PAPER/ABS label from the top line of medium and large rows.
- Kept the milestone label in the detail line while freeing enough width for USENIX Security 2027 and its cycle suffix.

## [1.7.3] - 2026-08-24

### Fixed

- Forced the top line of each medium and large row to span the full available width.
- Removed the unused trailing space that could still truncate USENIX after the 1.7.2 column split.

## [1.7.2] - 2026-08-24

### Fixed

- Split each conference row into a flexible identity column and a compact trailing timing column.
- Conference names such as USENIX now use all space remaining before the milestone and countdown instead of truncating prematurely.

## [1.7.1] - 2026-08-21

### Changed

- Replaced the alternating diagonal urgency bands with uniform amber and red backgrounds.
- Kept the 14-day warning and 7-day urgent thresholds, refresh timing, and row layout unchanged.

## [1.7.0] - 2026-08-21

First public GitHub release.

### Added

- Stable GitHub Release downloads with checksums and a machine-readable `latest.json` manifest.
- Token-free app-update checks and one Scriptable notification per newer stable release.
- Manual **Check for App Updates** action; no automatic code installation.
- Configurable 1/3/6 widget layouts.
- Venue locations across the picker, deadline list, and all widget families.
- Color-coded two-letter research-area badges.
- Amber urgency highlighting within 14 days and red highlighting within 7 days.
- Refresh requests at urgency crossings and shortly after deadline rollover.

### Changed

- Signed live deadline offsets use `+` before and `−` after a milestone.
- Conference-source caches remain independent so one failed feed cannot erase the other.

[1.7.7]: https://github.com/seppia978/DeadlineDeck/releases/tag/v1.7.7
[1.7.6]: https://github.com/seppia978/DeadlineDeck/releases/tag/v1.7.6
[1.7.5]: https://github.com/seppia978/DeadlineDeck/releases/tag/v1.7.5
[1.7.4]: https://github.com/seppia978/DeadlineDeck/releases/tag/v1.7.4
[1.7.3]: https://github.com/seppia978/DeadlineDeck/releases/tag/v1.7.3
[1.7.2]: https://github.com/seppia978/DeadlineDeck/releases/tag/v1.7.2
[1.7.1]: https://github.com/seppia978/DeadlineDeck/releases/tag/v1.7.1
[1.7.0]: https://github.com/seppia978/DeadlineDeck/releases/tag/v1.7.0
