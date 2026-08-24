# Changelog

All notable DeadlineDeck changes are documented here. Releases follow Semantic Versioning.

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

[1.7.2]: https://github.com/seppia978/DeadlineDeck/releases/tag/v1.7.2
[1.7.1]: https://github.com/seppia978/DeadlineDeck/releases/tag/v1.7.1
[1.7.0]: https://github.com/seppia978/DeadlineDeck/releases/tag/v1.7.0
