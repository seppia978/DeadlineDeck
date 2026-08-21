# Changelog

All notable DeadlineDeck changes are documented here. Releases follow Semantic Versioning.

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

[1.7.0]: https://github.com/seppia978/DeadlineDeck/releases/tag/v1.7.0
