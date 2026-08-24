// DeadlineDeck — Academic conference deadlines for Scriptable
// Data: ai-deadlines + sec-deadlines (community-maintained source data)
// Run once inside Scriptable to choose conferences and preview the widget.
// Then add a small, medium, or large Scriptable widget and select this script.

// WIDGET ROW LIMITS — edit these two values to change the visible list length.
// The small widget uses a dedicated single-deadline layout and always shows 1.
// Large widget
const MAX_N_ROWS = 6
const MEDIUM_WIDGET_MAX_N_ROWS = 3

// APP UPDATES — set this to false to disable token-free GitHub release checks.
// Checks run at most once every six hours while Scriptable is already running.
const CHECK_FOR_APP_UPDATES = true

// DEADLINE URGENCY — warning must be greater than urgent.
const WARNING_DEADLINE_DAYS = 14
const URGENT_DEADLINE_DAYS = 7
const DEADLINE_URGENCY_COLORS = {
  warning: { light: "F59E0B", dark: "FBBF24" },
  urgent: { light: "DC2626", dark: "FB7185" },
}

// AREA BADGES — light/dark accent colors for the two-letter research tags.
const AREA_BADGE_PALETTE = {
  AI: { label: "Artificial Intelligence", light: "B7791F", dark: "F6C453" },
  ML: { label: "Machine Learning", light: "7C3AED", dark: "A78BFA" },
  CV: { label: "Computer Vision", light: "0284C7", dark: "38BDF8" },
  NL: { label: "Natural Language Processing", light: "059669", dark: "34D399" },
  SP: { label: "Speech & Signal Processing", light: "6D28D9", dark: "C4B5FD" },
  RO: { label: "Robotics", light: "D97706", dark: "FBBF24" },
  DM: { label: "Data Mining & Retrieval", light: "DB2777", dark: "F472B6" },
  KR: { label: "Knowledge Representation", light: "2563EB", dark: "60A5FA" },
  AP: { label: "AI Applications", light: "4F46E5", dark: "818CF8" },
  SC: { label: "Security", light: "DC2626", dark: "F87171" },
  PR: { label: "Privacy", light: "BE185D", dark: "F472B6" },
  CR: { label: "Cryptography", light: "0F766E", dark: "2DD4BF" },
  HC: { label: "Human–Computer Interaction", light: "C026D3", dark: "E879F9" },
  DB: { label: "Databases", light: "115E59", dark: "5EEAD4" },
  SY: { label: "Systems & Networking", light: "475569", dark: "94A3B8" },
  SE: { label: "Software Engineering", light: "65A30D", dark: "A3E635" },
  TH: { label: "Theory", light: "52525B", dark: "A1A1AA" },
  CG: { label: "Computer Graphics", light: "0891B2", dark: "22D3EE" },
  MM: { label: "Multimedia", light: "9333EA", dark: "C084FC" },
  CS: { label: "Computer Science", light: "64748B", dark: "CBD5E1" },
}

const CONFERENCE_AREA_BY_SERIES = {
  aaai: "AI", ijcai: "AI", aamas: "AI",
  iclr: "ML", icml: "ML", neurips: "ML", nips: "ML", aistats: "ML", uai: "ML", colt: "ML", mlsys: "ML", colm: "ML",
  cvpr: "CV", iccv: "CV", eccv: "CV", wacv: "CV", bmvc: "CV", accv: "CV", "3dv": "CV", miccai: "CV", icip: "CV",
  acl: "NL", emnlp: "NL", naacl: "NL", eacl: "NL", coling: "NL", conll: "NL",
  icassp: "SP", interspeech: "SP",
  icra: "RO", iros: "RO", rss: "RO", corl: "RO",
  kdd: "DM", icdm: "DM", cikm: "DM", wsdm: "DM", sigir: "DM", ecir: "DM", webconf: "DM", www: "DM",
  usenixsecurity: "SC", ieeesp: "SC", ccs: "SC", ndss: "SC", raid: "SC", acsac: "SC", esorics: "SC", eurosp: "SC", asiaccs: "SC", acns: "SC",
  pets: "PR",
  ches: "CR", crypto: "CR", eurocrypt: "CR", asiacrypt: "CR", tcc: "CR", sacrypto: "CR",
  chi: "HC", uist: "HC", cscw: "HC",
  sigmod: "DB", vldb: "DB", icde: "DB", pods: "DB",
  osdi: "SY", sosp: "SY", nsdi: "SY", sigcomm: "SY", eurosys: "SY", usenixatc: "SY", atc: "SY", mobicom: "SY", mobisys: "SY", middleware: "SY", sc: "SY",
  icse: "SE", fse: "SE", ase: "SE", issta: "SE",
  stoc: "TH", focs: "TH", soda: "TH", lics: "TH",
  siggraph: "CG", acmmm: "MM",
}

const APP_VERSION = "1.7.6"
const SETTINGS_SCHEMA_VERSION = 3
const BUILD_LABEL = "DeadlineDeck 1.7 · Leading-Aligned Rows"
const CACHE_SCHEMA_VERSION = 2
const CACHE_METADATA_VERSION = 2
const AI_DATA_URL = "https://aideadlines.nauen-it.de/data/conferences.json"
const SECURITY_DATA_URL = "https://raw.githubusercontent.com/sec-deadlines/sec-deadlines.github.io/master/_data/conferences.yml"
const UPDATE_REPOSITORY = "seppia978/DeadlineDeck"
const UPDATE_RELEASES_URL = `https://github.com/${UPDATE_REPOSITORY}/releases/latest`
const UPDATE_MANIFEST_URL = `https://github.com/${UPDATE_REPOSITORY}/releases/latest/download/latest.json`
const CACHE_MAX_AGE_MS = 4 * 60 * 60 * 1000
const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000
const UPDATE_NOTIFICATION_RETRY_MS = 24 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const WIDGET_REFRESH_INTERVAL_MS = 4 * 60 * 60 * 1000
const MILESTONE_GRACE_MS = 60 * 1000
const DEADLINE_REFRESH_PADDING_MS = 15 * 1000
const DEADLINE_ROLLOVER_DELAY_MS = MILESTONE_GRACE_MS + DEADLINE_REFRESH_PADDING_MS
const NETWORK_TIMEOUT_SECONDS = 12
const UPDATE_REQUEST_TIMEOUT_SECONDS = 8
const UPDATE_CHECK_LEASE_MS = (UPDATE_REQUEST_TIMEOUT_SECONDS + 30) * 1000
const MAX_AI_DATA_BYTES = 5 * 1024 * 1024
const MAX_SECURITY_DATA_BYTES = 256 * 1024
const MAX_RELEASE_RESPONSE_BYTES = 32 * 1024
const fm = FileManager.local()
const baseDir = fm.joinPath(fm.libraryDirectory(), "ConferenceDeadlineWidget")
const cachePath = fm.joinPath(baseDir, "conferences-v2.json")
const settingsPath = fm.joinPath(baseDir, "settings-v1.json")
const updateStatePath = fm.joinPath(baseDir, "update-state-v1.json")

// ICLR 2027 is deliberately bundled because its official dates were published
// before some community feeds were updated. 23:59:59 AoE = 11:59:59 UTC next day.
const ICLR_2027 = {
  id: "iclr2027",
  seriesKey: "iclr",
  year: 2027,
  shortname: "ICLR 2027",
  title: "International Conference on Learning Representations",
  website: "https://iclr.cc/Conferences/2027/CallForPapers",
  location: "San Francisco, CA, USA",
  timezone: "AoE",
  tags: ["ML"],
  approximate: false,
  timeline: [{
    abstractDeadline: "2026-09-19T11:59:59.000Z",
    deadline: "2026-09-26T11:59:59.000Z",
    note: "",
  }],
  bundledOverride: true,
}

// These known dates are offline fallbacks only. When either live dataset has
// the same edition, its current data wins automatically.
const USENIX_SECURITY_2027 = {
  id: "usenixsecurity2027",
  seriesKey: "usenixsecurity",
  year: 2027,
  shortname: "USENIX Security 2027",
  title: "36th USENIX Security Symposium",
  website: "https://www.usenix.org/conference/usenixsecurity27/call-for-papers",
  location: "Denver, CO, USA",
  timezone: "AoE",
  tags: ["SEC"],
  approximate: false,
  timeline: [
    {
      abstractDeadline: "2026-08-19T11:59:59.000Z",
      deadline: "2026-08-26T11:59:59.000Z",
      abstractLabel: "REG",
      roundLabel: "C1",
      note: "Cycle 1",
    },
    {
      abstractDeadline: "2027-01-20T11:59:59.000Z",
      deadline: "2027-01-27T11:59:59.000Z",
      abstractLabel: "REG",
      roundLabel: "C2",
      note: "Cycle 2",
    },
  ],
  bundledOverride: true,
}

const IEEE_SP_2027 = {
  id: "ieeesp2027",
  seriesKey: "ieeesp",
  year: 2027,
  shortname: "IEEE S&P 2027",
  title: "48th IEEE Symposium on Security and Privacy",
  website: "https://www.ieee-security.org/TC/SP2027/cfpapers.html",
  location: "Montreal, Canada",
  timezone: "AoE",
  tags: ["SEC", "PRIV"],
  approximate: false,
  timeline: [{
    abstractDeadline: "2026-11-11T11:59:59.000Z",
    deadline: "2026-11-18T11:59:59.000Z",
    abstractLabel: "ABS",
    roundLabel: "C2",
    note: "Second deadline",
  }],
  bundledOverride: true,
}

const ACM_CCS_2027 = {
  id: "ccs2027",
  seriesKey: "ccs",
  year: 2027,
  shortname: "ACM CCS 2027",
  title: "ACM Conference on Computer and Communications Security",
  website: "https://www.sigsac.org/ccs/CCS2027/",
  location: "Atlanta, GA, USA",
  timezone: "AoE",
  tags: ["SEC"],
  approximate: false,
  timeline: [],
  bundledOverride: false,
  placeholder: true,
}

const NDSS_2027 = {
  id: "ndss2027",
  seriesKey: "ndss",
  year: 2027,
  shortname: "NDSS 2027",
  title: "Network and Distributed System Security Symposium",
  website: "https://www.ndss-symposium.org/ndss2027/submissions/call-for-papers/",
  location: "Seoul, Republic of Korea",
  timezone: "AoE",
  tags: ["SEC"],
  approximate: false,
  timeline: [{
    deadline: "2026-08-20T11:59:00.000Z",
    roundLabel: "C2",
    note: "Fall Cycle",
  }],
  bundledOverride: true,
}

const BUNDLED_FALLBACKS = [
  ICLR_2027,
  USENIX_SECURITY_2027,
  IEEE_SP_2027,
  NDSS_2027,
]

// A placeholder never masks dates coming from a live feed.
const BUNDLED_PLACEHOLDERS = [ACM_CCS_2027]

// A small seed catalog keeps important venues selectable even when the live
// feed temporarily contains only editions with known dates. Live entries win.
const SEED_CONFERENCES = [
  seedConference("aaai", "AAAI", "https://aaai.org/conference/aaai/"),
  seedConference("acl", "ACL", "https://www.aclweb.org/portal/"),
  seedConference("aistats", "AISTATS", "https://aistats.org/"),
  seedConference("chi", "CHI", "https://chi.acm.org/"),
  seedConference("ccs", "ACM CCS", "https://www.sigsac.org/ccs.html"),
  seedConference("colm", "COLM", "https://colmweb.org/"),
  seedConference("corl", "CoRL", "https://www.corl.org/"),
  seedConference("cvpr", "CVPR", "https://cvpr.thecvf.com/"),
  seedConference("eccv", "ECCV", "https://eccv.ecva.net/"),
  seedConference("emnlp", "EMNLP", "https://www.aclweb.org/portal/"),
  seedConference("esorics", "ESORICS", "https://esorics.org/"),
  seedConference("eurosp", "IEEE EuroS&P", "https://www.ieee-security.org/TC/EuroSP/"),
  seedConference("iccv", "ICCV", "https://iccv.thecvf.com/"),
  seedConference("iclr", "ICLR", "https://iclr.cc/"),
  seedConference("icml", "ICML", "https://icml.cc/"),
  seedConference("ieeesp", "IEEE S&P", "https://www.ieee-security.org/TC/SP-Index.html"),
  seedConference("ijcai", "IJCAI", "https://www.ijcai.org/"),
  seedConference("kdd", "KDD", "https://kdd.org/"),
  seedConference("neurips", "NeurIPS", "https://neurips.cc/"),
  seedConference("ndss", "NDSS", "https://www.ndss-symposium.org/"),
  seedConference("pets", "PETS", "https://petsymposium.org/"),
  seedConference("raid", "RAID", "https://raid-symposium.org/"),
  seedConference("acsac", "ACSAC", "https://www.acsac.org/"),
  seedConference("rss", "RSS", "https://roboticsconference.org/"),
  seedConference("uai", "UAI", "https://www.auai.org/"),
  seedConference("usenixsecurity", "USENIX Security", "https://www.usenix.org/conferences/byname/108"),
]

ensureDirectory()

if (config.runsInWidget) {
  const settings = loadSettings()
  const [result] = await Promise.all([
    loadConferenceData(false),
    runAutomaticUpdateCheck(),
  ])
  const widget = await makeWidget(result, settings, config.widgetFamily || "medium", parseWidgetPage(args.widgetParameter))
  Script.setWidget(widget)
} else {
  const action = String((args.queryParameters || {}).action || "")
  if (action === "deadlines") {
    const [result] = await Promise.all([
      loadConferenceData(false),
      runAutomaticUpdateCheck(),
    ])
    await presentUpcomingTable(result, loadSettings())
  } else {
    await runApp()
  }
}
Script.complete()

async function runApp() {
  let dataResult
  ;[dataResult] = await Promise.all([
    loadConferenceData(false),
    runAutomaticUpdateCheck(),
  ])

  while (true) {
    const selectedCount = loadSettings().selectedSeries.length
    const menu = new Alert()
    menu.title = "DeadlineDeck · AI + Security"
    menu.message = `${selectedCount} conference${selectedCount === 1 ? "" : "s"} selected\nData: ${sourceDescription(dataResult)}`
    menu.addAction("Select Conferences")
    menu.addAction("Preview Small Widget")
    menu.addAction("Preview Medium Widget")
    menu.addAction("Preview Large Widget")
    menu.addAction("Refresh Data Now")
    menu.addAction("Check for App Updates")
    menu.addAction("About")
    menu.addAction("All Deadlines")
    menu.addCancelAction("Done")
    const choice = await menu.presentAlert()

    if (choice === -1) return
    if (choice === 0) {
      await presentConferencePicker(dataResult.conferences)
    } else if (choice === 1) {
      const widget = await makeWidget(dataResult, loadSettings(), "small")
      await widget.presentSmall()
    } else if (choice === 2) {
      const widget = await makeWidget(dataResult, loadSettings(), "medium")
      await widget.presentMedium()
    } else if (choice === 3) {
      const widget = await makeWidget(dataResult, loadSettings(), "large")
      await widget.presentLarge()
    } else if (choice === 4) {
      dataResult = await loadConferenceData(true)
      const notice = new Alert()
      notice.title = dataResult.networkError ? "Partial Update" : "Data Updated"
      notice.message = dataResult.networkError
        ? `At least one source did not respond. DeadlineDeck is using its last available copy for that source.\n\n${dataResult.networkError}`
        : `${dataResult.conferences.length} conference editions available.`
      notice.addAction("OK")
      await notice.presentAlert()
    } else if (choice === 5) {
      await presentUpdateCheck()
    } else if (choice === 6) {
      await presentInfo(dataResult)
    } else if (choice === 7) {
      await presentUpcomingTable(dataResult, loadSettings())
    }
  }
}

async function presentConferencePicker(conferences) {
  const catalog = buildCatalog(conferences)
  const settings = loadSettings()
  const selected = new Set(settings.selectedSeries)
  let query = ""
  const table = new UITable()
  table.showSeparators = true

  const save = () => {
    settings.selectedSeries = Array.from(selected).sort()
    saveSettings(settings)
  }

  const render = () => {
    table.removeAllRows()

    const searchRow = new UITableRow()
    searchRow.height = 48
    searchRow.dismissOnSelect = false
    const searchIcon = searchRow.addImage(SFSymbol.named("magnifyingglass").image)
    searchIcon.widthWeight = 12
    const searchText = searchRow.addText(query ? `Filter: ${query}` : "Search or filter", `${selected.size} selected · tap to change filter`)
    searchText.widthWeight = 88
    searchRow.onSelect = async () => {
      const prompt = new Alert()
      prompt.title = "Filter Conferences"
      prompt.message = "Leave blank to show everything."
      prompt.addTextField("ICLR, NeurIPS, USENIX…", query)
      prompt.addAction("Apply")
      prompt.addCancelAction("Cancel")
      const result = await prompt.presentAlert()
      if (result !== -1) {
        query = prompt.textFieldValue(0).trim()
        render()
        table.reload()
      }
    }
    table.addRow(searchRow)

    const q = query.toLocaleLowerCase()
    const visible = catalog
      .filter(item => !q || item.searchText.includes(q))
      .sort((a, b) => {
        const selectedOrder = Number(selected.has(b.key)) - Number(selected.has(a.key))
        return selectedOrder || a.name.localeCompare(b.name)
      })
    for (const item of visible) {
      const row = new UITableRow()
      row.height = 76
      row.dismissOnSelect = false
      const iconName = selected.has(item.key) ? "checkmark.circle.fill" : "circle"
      const icon = row.addImage(SFSymbol.named(iconName).image)
      icon.widthWeight = 11
      const current = item.current
      const deadlineText = current.paperDate
        ? `${formatDeadlineLong(current.paperDate, current.timezone)}${current.approximate ? " · estimated" : ""}`
        : "Paper deadline TBD"
      const subtitle = `${deadlineText}\n📍 ${venueLocationText(current)}`
      const area = conferenceArea(current)
      const areaCell = row.addText(area.code)
      areaCell.widthWeight = 10
      areaCell.titleFont = Font.boldSystemFont(12)
      areaCell.titleColor = Color.dynamic(new Color(area.color), new Color(area.darkColor))
      const text = row.addText(current.shortname || item.name, subtitle)
      text.widthWeight = 79
      row.onSelect = () => {
        if (selected.has(item.key)) selected.delete(item.key)
        else selected.add(item.key)
        save()
        render()
        table.reload()
      }
      table.addRow(row)
    }

    if (!visible.length) {
      const empty = new UITableRow()
      empty.height = 70
      empty.addText("No results", "Tap the first row to change the filter")
      table.addRow(empty)
    }
  }

  render()
  await table.present(true)
  save()
}

async function presentUpcomingTable(dataResult, settings) {
  const conferences = selectedUpcoming(dataResult, settings)
  const table = new UITable()
  table.showSeparators = true

  const header = new UITableRow()
  header.isHeader = true
  header.height = 54
  header.addText("All Deadlines", `${conferences.length} selected · scroll down`)
  table.addRow(header)

  if (!conferences.length) {
    const empty = new UITableRow()
    empty.height = 72
    empty.addText("No conferences selected", "Close this view and choose Select Conferences")
    table.addRow(empty)
  }

  for (const conf of conferences) {
    const row = new UITableRow()
    row.height = 82
    row.dismissOnSelect = false
    const milestone = nextMilestone(conf)
    const round = conf.roundLabel ? ` · ${conf.roundLabel}` : ""
    const deadlineText = milestone
      ? `${milestone.label} · ${formatOfficialDeadline(milestone.date, conf.timezone)} · ${formatCountdown(milestone.date)}`
      : "Deadline not announced yet"
    const subtitle = `${deadlineText}\n📍 ${venueLocationText(conf)}`
    const area = conferenceArea(conf)
    const areaCell = row.addText(area.code)
    areaCell.widthWeight = 10
    areaCell.titleFont = Font.boldSystemFont(12)
    areaCell.titleColor = Color.dynamic(new Color(area.color), new Color(area.darkColor))
    const text = row.addText(`${conf.shortname || conf.title || "Conference"}${round}`, subtitle)
    text.widthWeight = 90
    const website = String(conf.website || "")
    if (/^https?:\/\//i.test(website)) {
      row.onSelect = () => Safari.openInApp(website, true)
    }
    table.addRow(row)
  }

  await table.present(true)
}

async function presentInfo(dataResult) {
  const alert = new Alert()
  alert.title = "About DeadlineDeck"
  alert.message = [
    BUILD_LABEL,
    "",
    `The small widget shows the next deadline, medium shows up to ${widgetMaxRows("medium")}, and large shows up to ${widgetMaxRows("large")}.`,
    "To change these limits, edit MEDIUM_WIDGET_MAX_N_ROWS and MAX_N_ROWS at the top of the script.",
    "Colored two-letter badges show the primary research area: ML, CV, NL, SP, RO, DM, SC, PR, CR, and others. SC means Security; SP means Speech & Signal Processing.",
    `Rows use a uniform amber background within ${configuredDeadlineDays(WARNING_DEADLINE_DAYS, 14)} days of the next displayed deadline and a uniform red background within ${configuredDeadlineDays(URGENT_DEADLINE_DAYS, 7)} days. Edit WARNING_DEADLINE_DAYS and URGENT_DEADLINE_DAYS at the top of the script to change these thresholds.`,
    "For later pages, stack identical widgets and set Parameter to 1, 2, 3… The header displays the page number. Tap the header to open the complete scrollable list.",
    "",
    "Each deadline includes the venue location when announced; otherwise it clearly shows Location TBD. For AoE deadlines, DeadlineDeck shows both the official date and your iPhone’s local time. Tap a row to open the conference website.",
    "The live offset uses + before a deadline and − after it. DeadlineDeck asks iOS to refresh at both urgency thresholds and shortly after every milestone; iOS controls the exact refresh time.",
    "",
    "Data updates automatically from ai-deadlines and sec-deadlines. If one source is unavailable, its last valid cache is preserved independently.",
    "",
    CHECK_FOR_APP_UPDATES
      ? "App updates are checked on the public GitHub Releases page without an account, token, or DeadlineDeck telemetry, at most once every six hours while Scriptable runs. A newer stable release schedules one local notification at the next useful run, subject to iOS permissions and refresh timing; tapping it opens the release notes and download. DeadlineDeck never downloads or installs code automatically."
      : "Automatic app-update checks are disabled by CHECK_FOR_APP_UPDATES at the top of the script. You can still use Check for App Updates from the menu.",
    `Releases: ${UPDATE_RELEASES_URL}`,
    "",
    "Known dates for ICLR, USENIX Security, IEEE S&P, and NDSS are bundled as offline fallbacks. ACM CCS 2027 stays TBD until its paper deadline is published.",
    "",
    "These datasets are community-maintained. Always verify the official conference website before submitting.",
    "",
    `Data status: ${sourceDescription(dataResult)}`,
  ].join("\n")
  alert.addAction("OK")
  await alert.presentAlert()
}

async function runAutomaticUpdateCheck() {
  if (!CHECK_FOR_APP_UPDATES) return { status: "disabled" }
  try {
    return await checkForAppUpdate(false, true)
  } catch (error) {
    // App-update failures must never prevent conference data or widgets from
    // loading. A manual check reports the same error when the user asks for it.
    return { status: "error", error: errorMessage(error) }
  }
}

async function presentUpdateCheck() {
  let result
  try {
    result = await checkForAppUpdate(true, false)
  } catch (error) {
    result = { status: "error", error: errorMessage(error) }
  }

  const alert = new Alert()
  if (result.status === "available" && result.release) {
    alert.title = "DeadlineDeck Update Available"
    alert.message = [
      `Installed: ${APP_VERSION}`,
      `Latest: ${result.release.version}`,
      result.release.notes ? `\n${result.release.notes}` : "",
      result.error ? `\nThe live check failed, so this is the last verified release.\n${result.error}` : "",
      "\nDeadlineDeck will open the GitHub release page. Updates are never installed automatically.",
    ].filter(Boolean).join("\n")
    alert.addAction("Open GitHub Release")
    alert.addAction("Download ZIP")
    alert.addCancelAction("Later")
    const choice = await alert.presentAlert()
    markUpdateAsSeen(result.release.version)
    if (choice === 0) Safari.openInApp(result.release.releaseUrl, true)
    if (choice === 1) Safari.openInApp(result.release.downloadUrl, true)
    return
  }

  if (result.status === "error" || result.status === "deferred") {
    alert.title = "Could Not Check for Updates"
    alert.message = `${result.error || "GitHub did not return a valid release manifest."}\n\nInstalled version: ${APP_VERSION}`
  } else {
    alert.title = "DeadlineDeck Is Up to Date"
    alert.message = `Installed version: ${APP_VERSION}\nLatest stable release: ${result.release ? result.release.version : APP_VERSION}`
  }
  alert.addAction("OK")
  await alert.presentAlert()
}

async function checkForAppUpdate(forceNetwork, notify) {
  const now = Date.now()
  const state = loadUpdateState()
  let release = state.latestRelease
  let networkError = null
  const stale = !state.lastCheckedAt || now - state.lastCheckedAt >= UPDATE_CHECK_INTERVAL_MS
  const needsNetwork = forceNetwork || stale || !release
  const leaseActive = state.checkLeaseUntil > now

  if (needsNetwork && leaseActive) {
    return {
      status: "deferred",
      release,
      error: "Another update check is already running. Try again shortly.",
    }
  } else if (needsNetwork) {
    state.checkLeaseUntil = now + UPDATE_CHECK_LEASE_MS
    saveUpdateState(state)
    try {
      const fetchedRelease = await fetchLatestReleaseManifest()
      if (release && compareSemver(fetchedRelease.version, release.version) < 0) {
        throw new Error(`GitHub release version moved backwards from ${release.version} to ${fetchedRelease.version}`)
      }
      release = fetchedRelease
      state.latestRelease = fetchedRelease
      state.lastCheckedAt = now
      state.lastError = null
    } catch (error) {
      networkError = errorMessage(error)
      state.lastCheckedAt = now
      state.lastError = networkError
    }
    state.checkLeaseUntil = 0
  }

  const available = release && compareSemver(release.version, APP_VERSION) > 0
  let notificationError = null
  if (available && notify && shouldAttemptUpdateNotification(state, release.version, now)) {
    state.lastNotificationAttemptVersion = release.version
    state.lastNotificationAttemptAt = now
    // Persist the claim before scheduling so simultaneous widget pages do not
    // all announce the same release. The deterministic notification identifier
    // is a second layer of duplicate protection.
    saveUpdateState(state)
    try {
      await scheduleUpdateNotification(release)
      state.lastNotifiedVersion = release.version
      state.lastNotificationError = null
    } catch (error) {
      notificationError = errorMessage(error)
      state.lastNotificationError = notificationError
    }
  }

  saveUpdateState(state)

  if (available) {
    return {
      status: "available",
      release,
      error: networkError,
      notificationError,
    }
  }
  if (networkError) return { status: "error", release, error: networkError }
  return { status: "current", release, error: networkError }
}

function shouldAttemptUpdateNotification(state, version, now) {
  if (state.lastNotifiedVersion && compareSemver(version, state.lastNotifiedVersion) <= 0) return false
  if (state.lastNotificationAttemptVersion !== version) return true
  return !state.lastNotificationAttemptAt || now - state.lastNotificationAttemptAt >= UPDATE_NOTIFICATION_RETRY_MS
}

async function scheduleUpdateNotification(release) {
  const notification = new Notification()
  notification.identifier = `deadlinedeck-update-${release.version.replace(/\./g, "-")}`
  notification.threadIdentifier = "DeadlineDeckUpdates"
  notification.title = `DeadlineDeck ${release.version} is available`
  notification.body = release.notes || "Tap to read the release notes and download the update."
  notification.openURL = release.releaseUrl
  notification.sound = "default"
  notification.addAction("Download ZIP", release.downloadUrl)
  await notification.schedule()
}

async function fetchLatestReleaseManifest() {
  const request = new Request(UPDATE_MANIFEST_URL)
  request.timeoutInterval = UPDATE_REQUEST_TIMEOUT_SECONDS
  request.headers = {
    Accept: "application/json",
    "User-Agent": `DeadlineDeck/${APP_VERSION}`,
  }
  const body = await request.loadString()
  const status = request.response ? Number(request.response.statusCode) : 200
  if (status < 200 || status >= 300) throw new Error(`GitHub release check returned HTTP ${status}`)
  if (!String(body || "").trim()) throw new Error("GitHub release manifest is empty")
  if (body.length > MAX_RELEASE_RESPONSE_BYTES) throw new Error("GitHub release manifest is too large")

  let payload
  try {
    payload = JSON.parse(body)
  } catch (_) {
    throw new Error("GitHub release manifest is invalid JSON")
  }
  const release = normalizeReleaseManifest(payload)
  if (!release) throw new Error("GitHub release manifest failed validation")
  return release
}

function normalizeReleaseManifest(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null
  if (Number(payload.schemaVersion) !== 1 || String(payload.product || "") !== "DeadlineDeck") return null

  const parsed = parseSemver(payload.version)
  if (!parsed) return null
  const tag = String(payload.tag || "")
  if (tag !== `v${parsed.version}`) return null

  const releaseUrl = String(payload.releaseUrl || "")
  const downloadUrl = String(payload.downloadUrl || "")
  const expectedReleaseUrl = `https://github.com/${UPDATE_REPOSITORY}/releases/tag/${tag}`
  const expectedDownloadUrl = `https://github.com/${UPDATE_REPOSITORY}/releases/download/${tag}/DeadlineDeck.zip`
  if (releaseUrl !== expectedReleaseUrl || downloadUrl !== expectedDownloadUrl) return null

  const zipSha256 = String(payload.zipSha256 || "").toLocaleLowerCase()
  if (!/^[a-f0-9]{64}$/.test(zipSha256)) return null
  const publishedAt = String(payload.publishedAt || "")
  if (!publishedAt || !Number.isFinite(Date.parse(publishedAt))) return null

  return {
    schemaVersion: 1,
    product: "DeadlineDeck",
    version: parsed.version,
    tag,
    releaseUrl,
    downloadUrl,
    zipSha256,
    publishedAt,
    notes: String(payload.notes || "").trim().slice(0, 240),
  }
}

function parseSemver(value) {
  const match = String(value || "").trim().match(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/)
  if (!match) return null
  const parts = match.slice(1).map(Number)
  if (parts.some(part => !Number.isSafeInteger(part) || part < 0 || part > 999999)) return null
  return { version: parts.join("."), parts }
}

function compareSemver(left, right) {
  const a = parseSemver(left)
  const b = parseSemver(right)
  if (!a || !b) return 0
  for (let index = 0; index < 3; index += 1) {
    if (a.parts[index] !== b.parts[index]) return a.parts[index] > b.parts[index] ? 1 : -1
  }
  return 0
}

function loadUpdateState() {
  const raw = readJSON(updateStatePath, null)
  const release = raw ? normalizeReleaseManifest(raw.latestRelease) : null
  const leaseCandidate = raw && Number.isFinite(Number(raw.checkLeaseUntil)) ? Number(raw.checkLeaseUntil) : 0
  const now = Date.now()
  const checkLeaseUntil = leaseCandidate > now && leaseCandidate <= now + UPDATE_CHECK_LEASE_MS
    ? leaseCandidate
    : 0
  return {
    schemaVersion: 1,
    lastCheckedAt: raw && Number.isFinite(Number(raw.lastCheckedAt)) ? Math.max(0, Number(raw.lastCheckedAt)) : 0,
    latestRelease: release,
    checkLeaseUntil,
    lastError: raw && raw.lastError ? String(raw.lastError).slice(0, 300) : null,
    lastNotifiedVersion: normalizedStoredVersion(raw && raw.lastNotifiedVersion),
    lastNotificationAttemptVersion: normalizedStoredVersion(raw && raw.lastNotificationAttemptVersion),
    lastNotificationAttemptAt: raw && Number.isFinite(Number(raw.lastNotificationAttemptAt))
      ? Math.max(0, Number(raw.lastNotificationAttemptAt))
      : 0,
    lastNotificationError: raw && raw.lastNotificationError ? String(raw.lastNotificationError).slice(0, 300) : null,
  }
}

function saveUpdateState(state) {
  writeJSON(updateStatePath, {
    schemaVersion: 1,
    lastCheckedAt: Number(state.lastCheckedAt || 0),
    latestRelease: state.latestRelease || null,
    checkLeaseUntil: Number(state.checkLeaseUntil || 0),
    lastError: state.lastError || null,
    lastNotifiedVersion: normalizedStoredVersion(state.lastNotifiedVersion),
    lastNotificationAttemptVersion: normalizedStoredVersion(state.lastNotificationAttemptVersion),
    lastNotificationAttemptAt: Number(state.lastNotificationAttemptAt || 0),
    lastNotificationError: state.lastNotificationError || null,
  })
}

function markUpdateAsSeen(version) {
  const parsed = parseSemver(version)
  if (!parsed) return
  const state = loadUpdateState()
  if (!state.lastNotifiedVersion || compareSemver(parsed.version, state.lastNotifiedVersion) > 0) {
    state.lastNotifiedVersion = parsed.version
  }
  saveUpdateState(state)
}

function normalizedStoredVersion(value) {
  const parsed = parseSemver(value)
  return parsed ? parsed.version : null
}

function selectedUpcoming(dataResult, settings) {
  const catalog = buildCatalog(dataResult.conferences)
  const byKey = new Map(catalog.map(item => [item.key, item]))
  return settings.selectedSeries
    .map(key => byKey.get(key))
    .filter(Boolean)
    .map(item => item.current)
    .filter(Boolean)
    .sort((a, b) => compareNullableDates(nextMilestoneDate(a), nextMilestoneDate(b)))
}

function parseWidgetPage(value) {
  const match = String(value == null ? "" : value).match(/\d+/)
  const parsed = match ? Number(match[0]) : 1
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1
}

function widgetMaxRows(family) {
  if (family === "small") return 1
  const configured = family === "large" ? MAX_N_ROWS : MEDIUM_WIDGET_MAX_N_ROWS
  const fallback = family === "large" ? 6 : 3
  const parsed = Math.floor(Number(configured))
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : fallback
}

function deadlineUrgency(conference, nowValue) {
  const suppliedNow = nowValue instanceof Date ? nowValue.getTime() : Number(nowValue)
  const now = Number.isFinite(suppliedNow) ? suppliedNow : Date.now()
  const milestone = nextMilestone(conference, now)
  if (!milestone) return "normal"

  const remainingMs = milestone.date.getTime() - now
  const urgentMs = configuredDeadlineDays(URGENT_DEADLINE_DAYS, 7) * DAY_MS
  const warningMs = configuredDeadlineDays(WARNING_DEADLINE_DAYS, 14) * DAY_MS
  if (remainingMs <= urgentMs) return "urgent"
  if (remainingMs <= warningMs) return "warning"
  return "normal"
}

function configuredDeadlineDays(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

function urgencyBackgroundColor(level, strong) {
  const style = DEADLINE_URGENCY_COLORS[level]
  if (!style) return null

  const lightAlpha = strong ? (level === "urgent" ? 0.42 : 0.38) : (level === "urgent" ? 0.22 : 0.18)
  const darkAlpha = strong ? (level === "urgent" ? 0.47 : 0.42) : (level === "urgent" ? 0.28 : 0.23)
  return Color.dynamic(
    new Color(style.light, lightAlpha),
    new Color(style.dark, darkAlpha)
  )
}

function applyDeadlineUrgencyBackground(row, conference) {
  const level = deadlineUrgency(conference)
  const background = urgencyBackgroundColor(level, false)
  if (!background) return level
  row.backgroundColor = background
  row.cornerRadius = 6
  if (typeof row.setPadding === "function") row.setPadding(0, 3, 0, 3)
  return level
}

function applySmallWidgetUrgencyBackground(widget, conference) {
  const level = deadlineUrgency(conference)
  const background = urgencyBackgroundColor(level, true)
  if (!background) return level
  widget.backgroundColor = background
  return level
}

function applyDefaultWidgetBackground(widget) {
  const gradient = new LinearGradient()
  gradient.locations = [0, 1]
  gradient.colors = [
    Color.dynamic(new Color("F8FAFF"), new Color("121827")),
    Color.dynamic(new Color("EEF3FF"), new Color("0B1020")),
  ]
  widget.backgroundGradient = gradient
}

function conferenceArea(conference) {
  const conf = conference || {}
  const series = canonicalSeriesKey(conf.seriesKey || deriveSeriesKey(conf.id, conf.shortname))
  let code = CONFERENCE_AREA_BY_SERIES[series] || ""

  if (!code) {
    for (const tag of mergeConferenceTags(conf.tags)) {
      code = areaCodeForSourceTag(tag)
      if (code) break
    }
  }

  if (!code) code = areaCodeFromConferenceText(conf)
  if (!code && /sec-deadlines/i.test(String(conf.dataSrc || ""))) code = "SC"
  if (!AREA_BADGE_PALETTE[code]) code = "CS"

  const style = AREA_BADGE_PALETTE[code]
  return {
    code,
    label: style.label,
    color: style.light,
    darkColor: style.dark,
  }
}

function areaCodeForSourceTag(tag) {
  const key = String(tag || "").toUpperCase().replace(/[^A-Z0-9]+/g, "")
  const mappings = {
    AI: "AI", ARTIFICIALINTELLIGENCE: "AI",
    ML: "ML", MACHINELEARNING: "ML",
    CV: "CV", COMPUTERVISION: "CV",
    NLP: "NL", NL: "NL", NATURALLANGUAGEPROCESSING: "NL",
    SP: "SP", SPEECH: "SP", SPEECHPROCESSING: "SP", SIGNALPROCESSING: "SP",
    RO: "RO", ROBOTICS: "RO",
    DM: "DM", DATAMINING: "DM", IR: "DM", INFORMATIONRETRIEVAL: "DM",
    KR: "KR", KNOWLEDGEREPRESENTATION: "KR",
    AP: "AP", APPLICATIONS: "AP",
    SEC: "SC", SECURITY: "SC", SC: "SC", CYBERSECURITY: "SC",
    PRIV: "PR", PRIVACY: "PR", PR: "PR",
    CRYPTO: "CR", CRYPTOGRAPHY: "CR", CR: "CR",
    HCI: "HC", HC: "HC", HUMANCOMPUTERINTERACTION: "HC",
    CG: "CG", GRAPHICS: "CG", COMPUTERGRAPHICS: "CG",
    DB: "DB", DATABASE: "DB", DATABASES: "DB",
    SY: "SY", SYSTEMS: "SY", NETWORKING: "SY",
    SE: "SE", SOFTWAREENGINEERING: "SE",
    TH: "TH", THEORY: "TH",
    MM: "MM", MULTIMEDIA: "MM",
    CS: "CS", COMPUTERSCIENCE: "CS",
  }
  return mappings[key] || ""
}

function areaCodeFromConferenceText(conference) {
  const text = `${conference.id || ""} ${conference.shortname || ""} ${conference.title || ""}`.toLocaleLowerCase()
  if (/cryptograph|\bcrypto\b/.test(text)) return "CR"
  if (/\bprivacy\b/.test(text)) return "PR"
  if (/secur|cyber/.test(text)) return "SC"
  if (/computer vision|visual recognition|image processing/.test(text)) return "CV"
  if (/natural language|computational linguistics|\blanguage\b/.test(text)) return "NL"
  if (/machine learning|learning representations|neural information processing/.test(text)) return "ML"
  if (/robot/.test(text)) return "RO"
  if (/speech|acoustic|signal processing/.test(text)) return "SP"
  if (/data mining|information retrieval|web search/.test(text)) return "DM"
  if (/human.?computer|human.?machine|interaction design/.test(text)) return "HC"
  if (/database/.test(text)) return "DB"
  if (/software engineering|software testing/.test(text)) return "SE"
  if (/operating systems|distributed systems|computer systems|networking/.test(text)) return "SY"
  if (/computer graphics|visualization/.test(text)) return "CG"
  if (/multimedia/.test(text)) return "MM"
  if (/artificial intelligence/.test(text)) return "AI"
  return ""
}

function addConferenceAreaBadge(parent, conference, family) {
  const area = conferenceArea(conference)
  const badge = parent.addStack()
  badge.centerAlignContent()
  if (typeof badge.setPadding === "function") badge.setPadding(1, 4, 1, 4)
  badge.cornerRadius = 4
  badge.backgroundColor = Color.dynamic(
    new Color(area.color, 0.24),
    new Color(area.darkColor, 0.30)
  )
  const code = badge.addText(area.code)
  code.font = Font.boldSystemFont(family === "large" ? 8 : 7)
  code.textColor = Color.dynamic(new Color(area.color), new Color(area.darkColor))
  code.lineLimit = 1
  return badge
}

function runningScriptURL(action) {
  const base = URLScheme.forRunningScript()
  const separator = base.includes("?") ? "&" : "?"
  return `${base}${separator}action=${encodeURIComponent(action)}`
}

async function makeWidget(dataResult, settings, family, requestedPage) {
  const widget = new ListWidget()
  widget.setPadding(12, 14, 10, 14)
  const sortedUpcoming = selectedUpcoming(dataResult, settings)
  widget.refreshAfterDate = nextWidgetRefreshDate(sortedUpcoming)
  const pageSize = widgetMaxRows(family)
  const totalPages = Math.max(1, Math.ceil(sortedUpcoming.length / pageSize))
  const page = Math.min(Math.max(1, requestedPage || 1), totalPages)
  const start = (page - 1) * pageSize
  const upcoming = sortedUpcoming.slice(start, start + pageSize)

  if (family === "small") {
    const level = applySmallWidgetUrgencyBackground(widget, upcoming[0] || null)
    if (level === "normal") applyDefaultWidgetBackground(widget)
    addSmallWidget(widget, dataResult, settings, upcoming[0] || null, page, totalPages)
    return widget
  }

  applyDefaultWidgetBackground(widget)
  addHeader(widget, dataResult, upcoming.length, page, totalPages)

  if (!settings.selectedSeries.length) {
    addEmptyState(widget, "No conferences selected", "Open DeadlineDeck and choose Select Conferences.")
    return widget
  }
  if (!upcoming.length) {
    addEmptyState(widget, "Data unavailable", "Open DeadlineDeck to refresh data or change your selection.")
    return widget
  }

  widget.addSpacer(family === "large" ? 6 : 3)
  for (let i = 0; i < upcoming.length; i++) {
    addConferenceRow(widget, upcoming[i], family)
    if (i < upcoming.length - 1) {
      widget.addSpacer(family === "large" ? 3 : 1)
      const divider = widget.addStack()
      divider.size = new Size(0, 0.5)
      divider.backgroundColor = separatorColor()
      widget.addSpacer(family === "large" ? 3 : 1)
    }
  }

  return widget
}

function addHeader(widget, dataResult, shownCount, page, totalPages) {
  const header = widget.addStack()
  header.url = runningScriptURL("deadlines")
  header.centerAlignContent()
  const icon = header.addImage(SFSymbol.named("calendar.badge.clock").image)
  icon.imageSize = new Size(16, 16)
  icon.tintColor = accentColor()
  header.addSpacer(6)
  const title = header.addText("UPCOMING DEADLINES")
  title.font = Font.boldSystemFont(12)
  title.textColor = primaryColor()
  title.lineLimit = 1
  header.addSpacer()
  const status = totalPages > 1 ? `${page}/${totalPages}` : dataResult.networkError ? "CACHE" : shownCount ? "AUTO" : "SELECT"
  const statusText = header.addText(status)
  statusText.font = Font.semiboldSystemFont(8)
  statusText.textColor = dataResult.networkError ? new Color("E08B36") : secondaryColor()
}

function addConferenceRow(widget, conf, family) {
  const row = widget.addStack()
  row.layoutVertically()
  row.url = safeURL(conf.website)
  applyDeadlineUrgencyBackground(row, conf)

  const top = row.addStack()
  top.centerAlignContent()

  // Keep identity and timing separate. PAPER/ABS already begins the detail line
  // below, so repeating it here only steals width from long conference names.
  const identity = top.addStack()
  identity.centerAlignContent()
  // Positive width is intentional: unlike zero/automatic sizing, it gives the
  // name the unused trailing room that Scriptable does not redistribute.
  identity.size = new Size(220, 0)
  addConferenceAreaBadge(identity, conf, family)
  identity.addSpacer(5)
  const roundSuffix = conf.roundLabel ? ` · ${conf.roundLabel}` : ""
  const name = identity.addText(`${conf.shortname || conf.title || "Conference"}${roundSuffix}`)
  name.font = Font.boldSystemFont(family === "large" ? 13 : 11)
  name.textColor = primaryColor()
  name.lineLimit = 1
  name.minimumScaleFactor = 0.75
  // Short names stay pinned to the same leading edge as long names.
  identity.addSpacer()

  // Keep a readable gap before the timing column. The flexible spacer belongs
  // after timing so the whole identity/timing group remains leading-aligned.
  top.addSpacer(6)
  const timing = top.addStack()
  timing.centerAlignContent()
  const milestone = nextMilestone(conf)
  if (milestone) {
    const countdown = timing.addDate(milestone.date)
    countdown.applyOffsetStyle()
    countdown.font = Font.semiboldSystemFont(family === "large" ? 11 : 9)
    countdown.textColor = accentColor()
    countdown.lineLimit = 1
    countdown.minimumScaleFactor = 0.65
  } else {
    const countdown = timing.addText("TBD")
    countdown.font = Font.semiboldSystemFont(family === "large" ? 11 : 9)
    countdown.textColor = new Color("E08B36")
    countdown.lineLimit = 1
  }
  top.addSpacer()

  row.addSpacer(1)
  const bottom = row.addStack()
  bottom.centerAlignContent()
  if (milestone) {
    let detail
    if (family === "large") {
      detail = `${milestone.label} ${formatOfficialDeadline(milestone.date, conf.timezone)}`
      if (isAoETimezone(conf.timezone)) detail += ` · Local: ${formatDeadlineCompact(milestone.date)}`
      if (conf.paperDate && conf.paperDate.getTime() !== milestone.date.getTime()) {
        detail += ` · Paper ${formatDeadlineShort(conf.paperDate, conf.timezone)}`
      }
    } else {
      detail = `${milestone.label} ${formatDeadlineShort(milestone.date, conf.timezone)} · 📍 ${venueLocationText(conf)}`
    }
    const deadline = bottom.addText(`${conf.approximate ? "~ " : ""}${detail}`)
    deadline.font = Font.mediumSystemFont(family === "large" ? 9 : 8)
    deadline.textColor = secondaryColor()
    deadline.lineLimit = 1
    deadline.minimumScaleFactor = family === "large" ? 0.55 : 0.6
  } else {
    const locationSuffix = family === "large" ? "" : ` · 📍 ${venueLocationText(conf)}`
    const tbd = bottom.addText(`Deadline not announced yet${locationSuffix}`)
    tbd.font = Font.systemFont(family === "large" ? 9 : 8)
    tbd.textColor = secondaryColor()
    tbd.lineLimit = 1
    tbd.minimumScaleFactor = 0.6
  }
  bottom.addSpacer()
  if (conf.bundledOverride) {
    const verified = bottom.addImage(SFSymbol.named("checkmark.seal.fill").image)
    verified.imageSize = new Size(10, 10)
    verified.tintColor = accentColor()
  }

  if (family === "large") {
    row.addSpacer(1)
    const venueLine = row.addStack()
    venueLine.centerAlignContent()
    const venue = venueLine.addText(`📍 ${venueLocationText(conf)}`)
    venue.font = Font.systemFont(8)
    venue.textColor = tertiaryColor()
    venue.lineLimit = 1
    venue.minimumScaleFactor = 0.62
    venueLine.addSpacer()
  }
}

function addEmptyState(widget, titleValue, detailValue) {
  widget.addSpacer()
  const symbol = widget.addImage(SFSymbol.named("slider.horizontal.3").image)
  symbol.imageSize = new Size(28, 28)
  symbol.tintColor = accentColor()
  symbol.centerAlignImage()
  widget.addSpacer(8)
  const title = widget.addText(titleValue)
  title.font = Font.boldSystemFont(14)
  title.textColor = primaryColor()
  title.centerAlignText()
  const detail = widget.addText(detailValue)
  detail.font = Font.systemFont(10)
  detail.textColor = secondaryColor()
  detail.centerAlignText()
  detail.lineLimit = 2
  widget.url = URLScheme.forRunningScript()
  widget.addSpacer()
}

function addSmallWidget(widget, dataResult, settings, conf, page, totalPages) {
  const header = widget.addStack()
  header.centerAlignContent()
  const icon = header.addImage(SFSymbol.named("calendar.badge.clock").image)
  icon.imageSize = new Size(13, 13)
  icon.tintColor = accentColor()
  header.addSpacer(5)
  const build = header.addText("DEADLINEDECK")
  build.font = Font.boldSystemFont(9)
  build.textColor = accentColor()
  build.lineLimit = 1
  header.addSpacer()
  const statusValue = totalPages > 1 ? `${page}/${totalPages}` : dataResult.networkError ? "CACHE" : "AUTO"
  const status = header.addText(statusValue)
  status.font = Font.semiboldSystemFont(8)
  status.textColor = dataResult.networkError ? new Color("E08B36") : tertiaryColor()
  status.lineLimit = 1

  if (!settings.selectedSeries.length) {
    addSmallEmptyContent(widget, "Select conferences", "Tap to configure")
    widget.url = URLScheme.forRunningScript()
    return
  }
  if (!conf) {
    addSmallEmptyContent(widget, "Data unavailable", "Tap to refresh")
    widget.url = URLScheme.forRunningScript()
    return
  }

  widget.addSpacer(10)
  const nameRow = widget.addStack()
  nameRow.centerAlignContent()
  addConferenceAreaBadge(nameRow, conf, "small")
  nameRow.addSpacer(5)
  const roundSuffix = conf.roundLabel ? ` · ${conf.roundLabel}` : ""
  const name = nameRow.addText(`${conf.shortname || conf.title || "Conference"}${roundSuffix}`)
  name.font = Font.boldSystemFont(14)
  name.textColor = primaryColor()
  name.lineLimit = 2
  name.minimumScaleFactor = 0.72

  const milestone = nextMilestone(conf)
  widget.addSpacer(7)
  if (milestone) {
    const kind = widget.addText(`${milestone.label} DEADLINE`)
    kind.font = Font.semiboldSystemFont(8)
    kind.textColor = secondaryColor()
    kind.lineLimit = 1

    const countdown = widget.addDate(milestone.date)
    countdown.applyOffsetStyle()
    countdown.font = Font.boldSystemFont(20)
    countdown.textColor = accentColor()
    countdown.lineLimit = 1
    countdown.minimumScaleFactor = 0.7

    const date = widget.addText(formatOfficialDeadline(milestone.date, conf.timezone))
    date.font = Font.mediumSystemFont(9)
    date.textColor = tertiaryColor()
    date.lineLimit = 1
    date.minimumScaleFactor = 0.68
  } else {
    const tbd = widget.addText("DEADLINE TBD")
    tbd.font = Font.boldSystemFont(18)
    tbd.textColor = new Color("E08B36")
    tbd.lineLimit = 1
    const detail = widget.addText("Not announced yet")
    detail.font = Font.systemFont(9)
    detail.textColor = tertiaryColor()
    detail.lineLimit = 1
  }

  widget.addSpacer(3)
  const venue = widget.addText(`📍 ${venueLocationText(conf)}`)
  venue.font = Font.systemFont(8)
  venue.textColor = tertiaryColor()
  venue.lineLimit = 1
  venue.minimumScaleFactor = 0.62

  widget.addSpacer()
  widget.url = runningScriptURL("deadlines")
}

function addSmallEmptyContent(widget, titleValue, detailValue) {
  widget.addSpacer()
  const title = widget.addText(titleValue)
  title.font = Font.boldSystemFont(13)
  title.textColor = primaryColor()
  title.centerAlignText()
  title.lineLimit = 2
  const detail = widget.addText(detailValue)
  detail.font = Font.systemFont(9)
  detail.textColor = secondaryColor()
  detail.centerAlignText()
  detail.lineLimit = 1
  widget.addSpacer()
}

async function loadConferenceData(forceNetwork) {
  const cached = readJSON(cachePath, null)
  const cacheValid = cached && Number(cached.schemaVersion) === CACHE_SCHEMA_VERSION
  const metadataCurrent = cacheValid && Number(cached.metadataSchemaVersion) === CACHE_METADATA_VERSION
  let aiConferences = cacheValid && Array.isArray(cached.aiConferences) ? cached.aiConferences : []
  let securityConferences = cacheValid && Array.isArray(cached.securityConferences) ? cached.securityConferences : []
  let aiFetchedAt = cacheValid ? Number(cached.aiFetchedAt || 0) : 0
  let securityFetchedAt = cacheValid ? Number(cached.securityFetchedAt || 0) : 0
  let aiCheckedAt = cacheValid ? Number(cached.aiCheckedAt || aiFetchedAt || 0) : 0
  let securityCheckedAt = cacheValid ? Number(cached.securityCheckedAt || securityFetchedAt || 0) : 0
  const now = Date.now()
  const aiFresh = metadataCurrent && aiCheckedAt > 0 && now - aiCheckedAt < CACHE_MAX_AGE_MS
  const securityFresh = metadataCurrent && securityCheckedAt > 0 && now - securityCheckedAt < CACHE_MAX_AGE_MS

  if (!forceNetwork && aiFresh && securityFresh) {
    return makeDataResult(
      aiConferences,
      securityConferences,
      aiFetchedAt,
      securityFetchedAt,
      "cache",
      cached.lastNetworkError || null
    )
  }

  const errors = []
  let fetchedAny = false
  if (forceNetwork || !aiFresh) {
    aiCheckedAt = Date.now()
    try {
      aiConferences = await fetchAIConferenceData()
      aiFetchedAt = Date.now()
      fetchedAny = true
    } catch (error) {
      errors.push(`ai-deadlines: ${errorMessage(error)}`)
    }
  }

  if (forceNetwork || !securityFresh) {
    securityCheckedAt = Date.now()
    try {
      securityConferences = await fetchSecurityConferenceData()
      securityFetchedAt = Date.now()
      fetchedAny = true
    } catch (error) {
      errors.push(`sec-deadlines: ${errorMessage(error)}`)
    }
  }

  const envelope = {
    schemaVersion: CACHE_SCHEMA_VERSION,
    metadataSchemaVersion: CACHE_METADATA_VERSION,
    aiFetchedAt,
    securityFetchedAt,
    aiCheckedAt,
    securityCheckedAt,
    aiConferences,
    securityConferences,
    lastNetworkError: errors.length ? errors.join("\n") : null,
  }
  // Failed downloads never replace conference arrays; only the attempt time is
  // recorded so a broken endpoint is not hammered on every widget rendering.
  writeJSON(cachePath, envelope)

  return makeDataResult(
    aiConferences,
    securityConferences,
    aiFetchedAt,
    securityFetchedAt,
    fetchedAny ? "network" : (aiConferences.length || securityConferences.length ? "cache" : "bundled"),
    envelope.lastNetworkError
  )
}

function makeDataResult(aiConferences, securityConferences, aiFetchedAt, securityFetchedAt, source, networkError) {
  const timestamps = [aiFetchedAt, securityFetchedAt].filter(value => Number(value) > 0)
  return {
    conferences: mergeBundledFallbacks([...(aiConferences || []), ...(securityConferences || [])]),
    fetchedAt: timestamps.length ? Math.min(...timestamps) : 0,
    source,
    networkError: networkError || null,
  }
}

async function fetchAIConferenceData() {
  const body = await requestText(AI_DATA_URL, "application/json", MAX_AI_DATA_BYTES)
  let payload
  try {
    payload = JSON.parse(body)
  } catch (_) {
    throw new Error("invalid JSON")
  }
  const normalized = normalizePayload(payload)
  if (normalized.length < 3) throw new Error("empty or invalid conference list")
  return normalized
}

async function fetchSecurityConferenceData() {
  const body = await requestText(SECURITY_DATA_URL, "text/plain", MAX_SECURITY_DATA_BYTES)
  const normalized = normalizeSecurityYAML(body)
  const known = new Set(normalized.map(item => canonicalSeriesKey(item.seriesKey)))
  if (normalized.length < 10 || !known.has("ieeesp") || !known.has("usenixsecurity") || !known.has("ndss")) {
    throw new Error("incomplete or invalid YAML")
  }
  return normalized
}

async function requestText(url, accept, maxBytes) {
  const request = new Request(url)
  request.timeoutInterval = NETWORK_TIMEOUT_SECONDS
  request.headers = { Accept: accept }
  const body = await request.loadString()
  const status = request.response ? Number(request.response.statusCode) : 200
  if (status < 200 || status >= 300) throw new Error(`HTTP ${status}`)
  if (!String(body || "").trim()) throw new Error("empty response")
  if (Number(maxBytes) > 0 && body.length > Number(maxBytes)) throw new Error("response is too large")
  return body
}

function errorMessage(error) {
  const text = String(error && error.message ? error.message : error || "unknown error")
  return text.replace(/^Error:\s*/, "")
}

function normalizePayload(payload) {
  const source = extractConferenceArray(payload)
  const output = []

  for (const raw of source) {
    if (!raw || typeof raw !== "object") continue
    const id = String(raw.id || raw.key || "").trim().toLocaleLowerCase()
    const shortname = String(raw.shortname || raw.shortName || raw.name || raw.title || id).trim()
    if (!id && !shortname) continue
    const year = extractYear(raw.year || id || shortname)
    const finalId = id || `${slug(shortname)}${year || ""}`
    const timelineSource = Array.isArray(raw.timeline)
      ? raw.timeline
      : [{
          deadline: raw.deadline || raw.paperDeadline || raw.paper_deadline,
          abstractDeadline: raw.abstractDeadline || raw.abstract_deadline,
          note: raw.note,
        }]
    const timeline = []
    for (const item of timelineSource) {
      if (!item || typeof item !== "object") continue
      const paper = parseDeadline(item.deadline || item.paperDeadline || item.paper_deadline, raw.timezone)
      const abstract = parseDeadline(item.abstractDeadline || item.abstract_deadline, raw.timezone)
      if (!paper && !abstract && !item.note) continue
      timeline.push({
        deadline: paper ? paper.toISOString() : null,
        abstractDeadline: abstract ? abstract.toISOString() : null,
        abstractLabel: String(item.abstractLabel || "ABS").toUpperCase(),
        roundLabel: String(item.roundLabel || ""),
        note: String(item.note || ""),
      })
    }
    // The live endpoint promises a paper deadline. Reject malformed rows so a
    // broken response can never replace a known-good cache.
    if (!timeline.some(item => item.deadline)) continue
    output.push({
      id: finalId,
      seriesKey: deriveSeriesKey(finalId, shortname),
      year,
      shortname,
      title: String(raw.title || shortname),
      website: String(raw.website || raw.link || ""),
      location: normalizeVenueLocation(raw.location) || normalizeVenueLocation(raw.place),
      timezone: String(raw.timezone || ""),
      tags: mergeConferenceTags(raw.tags, raw.sub),
      dataSrc: String(raw.dataSrc || "ai-deadlines"),
      approximate: Boolean(raw.isApproximateDeadline || raw.approximate),
      conferenceStartDate: raw.conferenceStartDate || raw.start || null,
      timeline,
    })
  }
  return output
}

const DEFAULT_SEC_DEADLINES_TIMEZONE = "Etc/GMT+12" // AoE / UTC-12

/**
 * Parse sec-deadlines' constrained YAML format.
 *
 * @param {string} source YAML source.
 * @param {{strict?: boolean}} [options]
 * @returns {{records: Array<object>, warnings: Array<object>}}
 */
function parseSecDeadlinesYaml(source, options) {
  const opts = options || {}
  const warnings = []
  const records = []
  const text = String(source == null ? "" : source).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n")
  const lines = text.split("\n")
  let current = null
  let pendingListKey = null
  let pendingListIndent = -1

  const warn = (code, message, line) => {
    const warning = { code, message, line: line == null ? null : line }
    warnings.push(warning)
    if (opts.strict) throw new Error(`${message}${line ? ` (line ${line})` : ""}`)
  }

  const finishCurrent = () => {
    if (current) records.push(current)
    current = null
    pendingListKey = null
    pendingListIndent = -1
  }

  for (let index = 0; index < lines.length; index++) {
    const lineNumber = index + 1
    let rawLine = lines[index]
    if (!rawLine.trim() || rawLine.trim() === "---" || rawLine.trim() === "...") continue

    if (/^\t+/.test(rawLine)) {
      warn("TAB_INDENT", "Tab indentation is not supported; treating each tab as two spaces", lineNumber)
      rawLine = rawLine.replace(/^\t+/, match => "  ".repeat(match.length))
    }

    const indent = countLeadingSpaces(rawLine)
    const uncommented = stripYamlComment(rawLine.slice(indent)).trimEnd()
    if (!uncommented.trim()) continue
    const content = uncommented.trimStart()

    // Each repository record begins with a non-indented `- name: ...`.
    if (indent === 0 && /^-(?:\s|$)/.test(content)) {
      finishCurrent()
      current = {}
      const remainder = content.slice(1).trim()
      if (remainder) {
        const mapping = parseMappingLine(remainder)
        if (!mapping) {
          warn("BAD_RECORD_START", "Expected a key/value pair after top-level '-'", lineNumber)
        } else {
          setParsedField(current, mapping, lineNumber, warn)
        }
      }
      continue
    }

    if (!current) {
      warn("ORPHAN_CONTENT", "Ignoring content outside a top-level conference record", lineNumber)
      continue
    }

    // An indented dash belongs to the most recently opened block list.
    // YAML permits an "indentless sequence" where the dash is aligned with
    // the mapping key (`deadline:\n  - ...` and `deadline:\n- ...` relative
    // to that mapping level are both legal), hence >= rather than >.
    if (indent >= pendingListIndent && /^-(?:\s|$)/.test(content)) {
      if (!pendingListKey) {
        warn("ORPHAN_LIST_ITEM", "Ignoring list item without a preceding list key", lineNumber)
        continue
      }
      if (!Array.isArray(current[pendingListKey])) current[pendingListKey] = []
      const scalarText = content.slice(1).trim()
      current[pendingListKey].push(parseYamlScalar(scalarText, warnings, lineNumber))
      continue
    }

    const mapping = parseMappingLine(content)
    if (!mapping) {
      warn("UNSUPPORTED_LINE", "Ignoring unsupported YAML syntax", lineNumber)
      continue
    }
    pendingListKey = null
    pendingListIndent = -1
    if (mapping.valueText === "") {
      if (Object.prototype.hasOwnProperty.call(current, mapping.key)) {
        warn("DUPLICATE_KEY", `Duplicate key '${mapping.key}'`, lineNumber)
      }
      current[mapping.key] = []
      pendingListKey = mapping.key
      pendingListIndent = indent
    } else {
      setParsedField(current, mapping, lineNumber, warn)
    }
  }

  finishCurrent()
  return { records, warnings }
}

function setParsedField(target, mapping, lineNumber, warn) {
  if (Object.prototype.hasOwnProperty.call(target, mapping.key)) {
    warn("DUPLICATE_KEY", `Duplicate key '${mapping.key}'`, lineNumber)
  }
  target[mapping.key] = parseYamlScalar(mapping.valueText, null, lineNumber)
}

function parseMappingLine(content) {
  const colon = findUnquotedColon(content)
  if (colon < 1) return null
  const key = content.slice(0, colon).trim()
  if (!/^[A-Za-z_][A-Za-z0-9_-]*$/.test(key)) return null
  return { key, valueText: content.slice(colon + 1).trim() }
}

function findUnquotedColon(text) {
  let quote = null
  let escaped = false
  let flowDepth = 0
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (quote === '"') {
      if (escaped) escaped = false
      else if (char === "\\") escaped = true
      else if (char === '"') quote = null
      continue
    }
    if (quote === "'") {
      if (char === "'" && text[i + 1] === "'") i++
      else if (char === "'") quote = null
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      continue
    }
    if (char === "[" || char === "{") flowDepth++
    else if (char === "]" || char === "}") flowDepth--
    else if (char === ":" && flowDepth === 0) return i
  }
  return -1
}

function stripYamlComment(text) {
  let quote = null
  let escaped = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (quote === '"') {
      if (escaped) escaped = false
      else if (char === "\\") escaped = true
      else if (char === '"') quote = null
      continue
    }
    if (quote === "'") {
      if (char === "'" && text[i + 1] === "'") i++
      else if (char === "'") quote = null
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      continue
    }
    // In YAML, '#' starts a comment when separated from a plain scalar.
    if (char === "#" && (i === 0 || /\s/.test(text[i - 1]))) return text.slice(0, i)
  }
  return text
}

function parseYamlScalar(valueText, warnings, lineNumber) {
  const text = String(valueText == null ? "" : valueText).trim()
  if (text === "") return ""
  if (text[0] === "[" && text[text.length - 1] === "]") {
    const inner = text.slice(1, -1).trim()
    if (!inner) return []
    return splitFlowItems(inner).map(item => parseYamlScalar(item, warnings, lineNumber))
  }
  if (text[0] === '"' && text[text.length - 1] === '"') {
    try {
      return JSON.parse(text)
    } catch (_) {
      if (warnings) warnings.push({ code: "BAD_DOUBLE_QUOTE", message: "Invalid double-quoted scalar", line: lineNumber })
      return text.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\")
    }
  }
  if (text[0] === "'" && text[text.length - 1] === "'") {
    return text.slice(1, -1).replace(/''/g, "'")
  }
  if (/^(?:null|~)$/i.test(text)) return null
  if (/^(?:true|false)$/i.test(text)) return text.toLocaleLowerCase() === "true"
  if (/^-?(?:0|[1-9]\d*)$/.test(text)) return Number(text)
  return text
}

function splitFlowItems(text) {
  const parts = []
  let start = 0
  let quote = null
  let escaped = false
  let depth = 0
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (quote === '"') {
      if (escaped) escaped = false
      else if (char === "\\") escaped = true
      else if (char === '"') quote = null
      continue
    }
    if (quote === "'") {
      if (char === "'" && text[i + 1] === "'") i++
      else if (char === "'") quote = null
      continue
    }
    if (char === '"' || char === "'") quote = char
    else if (char === "[" || char === "{") depth++
    else if (char === "]" || char === "}") depth--
    else if (char === "," && depth === 0) {
      parts.push(text.slice(start, i).trim())
      start = i + 1
    }
  }
  parts.push(text.slice(start).trim())
  return parts
}

function countLeadingSpaces(text) {
  const match = String(text).match(/^ */)
  return match ? match[0].length : 0
}

/**
 * Normalize parsed sec-deadlines records to the widget's conference schema.
 *
 * @param {Array<object>} records
 * @param {{defaultTimezone?: string, strict?: boolean, endOfMinute?: boolean}} [options]
 * @returns {{conferences: Array<object>, warnings: Array<object>}}
 */
function normalizeSecDeadlineRecords(records, options) {
  const opts = options || {}
  const warnings = []
  const conferences = []
  const defaultTimezone = String(opts.defaultTimezone || DEFAULT_SEC_DEADLINES_TIMEZONE)
  const usedIds = new Set()

  const warn = (code, message, recordIndex, value) => {
    const warning = { code, message, recordIndex, value: value == null ? null : value }
    warnings.push(warning)
    if (opts.strict) throw new Error(`${message} (record ${recordIndex + 1})`)
  }

  for (let index = 0; index < records.length; index++) {
    const raw = records[index]
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      warn("BAD_RECORD", "Conference record is not an object", index)
      continue
    }

    const name = cleanString(raw.name)
    const year = Number(raw.year)
    const link = cleanString(raw.link)
    if (!name) {
      warn("MISSING_NAME", "Conference is missing required 'name'", index)
      continue
    }
    if (!Number.isInteger(year) || year < 1900 || year > 2200) {
      warn("BAD_YEAR", `Conference '${name}' has an invalid year`, index, raw.year)
      continue
    }
    if (!link) warn("MISSING_LINK", `Conference '${name}' is missing required 'link'`, index)

    const rawDeadlines = Array.isArray(raw.deadline)
      ? raw.deadline
      : raw.deadline == null || raw.deadline === ""
        ? []
        : [raw.deadline]
    if (!Array.isArray(raw.deadline)) {
      warn("DEADLINE_NOT_LIST", `Conference '${name}' deadline should be a YAML list`, index, raw.deadline)
    }

    const timezone = cleanString(raw.timezone) || defaultTimezone
    const timeline = []
    for (let deadlineIndex = 0; deadlineIndex < rawDeadlines.length; deadlineIndex++) {
      const template = cleanString(rawDeadlines[deadlineIndex])
      if (!template) {
        warn("EMPTY_DEADLINE", `Conference '${name}' has an empty deadline`, index)
        continue
      }
      const expanded = expandSecDeadlineTemplate(template, year)
      if (!expanded.length) {
        warn("BAD_TEMPLATE", `Conference '${name}' has an unsupported deadline template`, index, template)
        continue
      }
      for (const deadlineText of expanded) {
        const parsed = parseSecDeadlineDate(deadlineText, timezone, opts)
        if (!parsed.date) {
          warn("BAD_DEADLINE", `Could not parse '${deadlineText}' for '${name}': ${parsed.error}`, index, deadlineText)
          continue
        }
        timeline.push({
          abstractDeadline: null,
          deadline: parsed.date.toISOString(),
          abstractLabel: "ABS",
          roundLabel: "",
          note: cleanString(raw.comment || raw.note),
          sourceDeadline: template,
          sourceDeadlineIndex: deadlineIndex,
        })
      }
    }

    timeline.sort((a, b) => Date.parse(a.deadline) - Date.parse(b.deadline))
    if (!timeline.length) {
      warn("NO_VALID_DEADLINE", `Conference '${name}' has no valid deadlines`, index)
      continue
    }

    const seriesKey = deriveSecSeriesKey(name, raw.description, raw.dblp)
    let id = `${seriesKey}${year}`
    if (usedIds.has(id)) {
      let suffix = 2
      while (usedIds.has(`${id}-${suffix}`)) suffix++
      warn("DUPLICATE_ID", `Duplicate normalized id '${id}', adding suffix`, index)
      id = `${id}-${suffix}`
    }
    usedIds.add(id)

    conferences.push({
      id,
      seriesKey,
      year,
      shortname: `${stripTrailingYear(name)} ${year}`,
      title: cleanString(raw.description) || name,
      website: link,
      timezone,
      approximate: false,
      conferenceStartDate: null,
      conferenceDateText: cleanString(raw.date) || null,
      location: normalizeVenueLocation(raw.place),
      tags: mergeConferenceTags(raw.tags),
      dblp: cleanString(raw.dblp) || null,
      comment: cleanString(raw.comment || raw.note) || null,
      dataSrc: "sec-deadlines",
      timeline,
    })
  }

  return { conferences, warnings }
}

/** Parse and normalize in one call. */
function parseAndNormalizeSecDeadlinesYaml(source, options) {
  const parsed = parseSecDeadlinesYaml(source, options)
  const normalized = normalizeSecDeadlineRecords(parsed.records, options)
  return {
    records: parsed.records,
    conferences: normalized.conferences,
    warnings: parsed.warnings.concat(normalized.warnings),
  }
}

/**
 * Expand sec-deadlines rolling tokens:
 *   %y = conference year
 *   %Y = year before the conference
 *   %m = legacy monthly template (01..12)
 */
function expandSecDeadlineTemplate(template, conferenceYear) {
  const text = String(template || "")
    .replace(/%Y/g, String(conferenceYear - 1))
    .replace(/%y/g, String(conferenceYear))
  if (/%(?!m)/.test(text)) return []
  if (!/%m/.test(text)) return [text]
  const expanded = []
  for (let month = 1; month <= 12; month++) {
    expanded.push(text.replace(/%m/g, String(month).padStart(2, "0")))
  }
  return expanded
}

/**
 * Convert a sec-deadlines local wall-clock string to an absolute Date.
 *
 * If minute precision is used, it defaults to the end of that minute. The
 * repository's documented exact-hour convention is also honored: `12:00`
 * means the instant immediately before 12:00, i.e. 11:59:59 local time.
 */
function parseSecDeadlineDate(value, timezone, options) {
  const opts = options || {}
  const text = String(value || "").trim()
  if (!text) return { date: null, error: "empty date" }

  // Accept already-offset ISO timestamps, although the repository normally
  // stores a separate timezone field.
  if (/[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})$/i.test(text)) {
    const direct = new Date(text.replace(" ", "T"))
    return isNaN(direct.getTime()) ? { date: null, error: "invalid ISO timestamp" } : { date: direct, error: null }
  }

  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/)
  if (!match) return { date: null, error: "expected YYYY-MM-DD HH:mm[:ss]" }
  const parts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: match[4] == null ? 23 : Number(match[4]),
    minute: match[5] == null ? 59 : Number(match[5]),
    second: match[6] == null ? (opts.endOfMinute === false ? 0 : 59) : Number(match[6]),
  }
  if (!validWallClockParts(parts)) return { date: null, error: "invalid calendar date or time" }

  // sec-deadlines treats an exact hour as an exclusive boundary.
  const exactHourBoundary = match[4] != null && parts.minute === 0 && (match[6] == null || parts.second === 0)
  if (exactHourBoundary) parts.second = 0

  const zone = String(timezone || DEFAULT_SEC_DEADLINES_TIMEZONE).trim()
  let date
  const fixedOffset = fixedTimezoneOffsetMinutes(zone)
  if (fixedOffset !== null) {
    date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - fixedOffset * 60000)
  } else {
    const converted = ianaWallClockToDate(parts, zone)
    if (!converted.date) return converted
    date = converted.date
  }
  if (exactHourBoundary) date = new Date(date.getTime() - 1000)
  return { date, error: null }
}

/** UTC offset in minutes, or null when an IANA database lookup is required. */
function fixedTimezoneOffsetMinutes(timezone) {
  const zone = String(timezone || "").trim()
  if (/^(?:AoE|Anywhere on Earth)$/i.test(zone)) return -12 * 60
  if (/^(?:UTC|GMT|Etc\/UTC|Etc\/GMT)$/i.test(zone)) return 0

  // IANA's Etc/GMT signs are intentionally inverted: Etc/GMT+8 = UTC-8.
  let match = zone.match(/^Etc\/GMT([+-])(\d{1,2})(?::?(\d{2}))?$/i)
  if (match) {
    const amount = Number(match[2]) * 60 + Number(match[3] || 0)
    return match[1] === "+" ? -amount : amount
  }

  // Friendly UTC/GMT offsets use the conventional sign.
  match = zone.match(/^(?:UTC|GMT)([+-])(\d{1,2})(?::?(\d{2}))?$/i)
  if (match) {
    const amount = Number(match[2]) * 60 + Number(match[3] || 0)
    return match[1] === "+" ? amount : -amount
  }
  return null
}

function ianaWallClockToDate(parts, timezone) {
  if (typeof Intl === "undefined" || typeof Intl.DateTimeFormat !== "function") {
    return { date: null, error: `Intl.DateTimeFormat unavailable for IANA timezone '${timezone}'` }
  }
  let formatter
  try {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
  } catch (_) {
    return { date: null, error: `unsupported IANA timezone '${timezone}'` }
  }

  const desiredUTCShape = wallClockShapeAsUTC(parts)
  let guess = desiredUTCShape
  for (let iteration = 0; iteration < 5; iteration++) {
    const observed = formatToWallClockParts(formatter, new Date(guess))
    if (!observed) return { date: null, error: `could not format timezone '${timezone}'` }
    const delta = desiredUTCShape - wallClockShapeAsUTC(observed)
    guess += delta
    if (delta === 0) break
  }

  const result = new Date(guess)
  const finalParts = formatToWallClockParts(formatter, result)
  if (!sameWallClock(parts, finalParts)) {
    return { date: null, error: `nonexistent or ambiguous wall-clock time in '${timezone}'` }
  }
  return { date: result, error: null }
}

function formatToWallClockParts(formatter, date) {
  const values = {}
  for (const part of formatter.formatToParts(date)) {
    if (/^(year|month|day|hour|minute|second)$/.test(part.type)) values[part.type] = Number(part.value)
  }
  if (![values.year, values.month, values.day, values.hour, values.minute, values.second].every(Number.isFinite)) return null
  // A few older engines emit 24:00 despite hourCycle:h23.
  if (values.hour === 24) values.hour = 0
  return values
}

function wallClockShapeAsUTC(parts) {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
}

function sameWallClock(a, b) {
  return Boolean(b) && a.year === b.year && a.month === b.month && a.day === b.day &&
    a.hour === b.hour && a.minute === b.minute && a.second === b.second
}

function validWallClockParts(parts) {
  if (!Number.isInteger(parts.year) || parts.year < 1900 || parts.year > 2200) return false
  if (!Number.isInteger(parts.month) || parts.month < 1 || parts.month > 12) return false
  if (!Number.isInteger(parts.day) || parts.day < 1 || parts.day > 31) return false
  if (!Number.isInteger(parts.hour) || parts.hour < 0 || parts.hour > 23) return false
  if (!Number.isInteger(parts.minute) || parts.minute < 0 || parts.minute > 59) return false
  if (!Number.isInteger(parts.second) || parts.second < 0 || parts.second > 59) return false
  const probe = new Date(Date.UTC(parts.year, parts.month - 1, parts.day))
  return probe.getUTCFullYear() === parts.year && probe.getUTCMonth() === parts.month - 1 && probe.getUTCDate() === parts.day
}

function deriveSecSeriesKey(name, description, dblp) {
  const nameKey = slugSec(name)
  const detailKey = slugSec(`${name || ""} ${description || ""} ${dblp || ""}`)
  if (/usenixsecurity/.test(detailKey)) return "usenixsecurity"
  if (/spoakland|ieeesymposiumonsecurityandprivacy|ieeesecurityandprivacy/.test(detailKey)) return "ieeesp"
  if (/euros|europeansymposiumonsecurityandprivacy/.test(detailKey) && /privacy/.test(detailKey)) return "eurosp"
  if (/asiaccs|asiaconferenceoncomputerandcommunicationssecurity/.test(detailKey)) return "asiaccs"
  if (nameKey === "sac" && /selectedareasincryptography|sacrypt/.test(detailKey)) return "sacrypto"
  if (nameKey === "sac" && /appliedcomputing|sigapp/.test(detailKey)) return "sac"
  if (nameKey === "spoakland" || nameKey === "ieeesp") return "ieeesp"
  return nameKey || "conference"
}

function slugSec(value) {
  return String(value || "").toLocaleLowerCase().replace(/[^a-z0-9]+/g, "")
}

function stripTrailingYear(value) {
  return String(value || "").replace(/\s*[([]?(?:19|20)\d{2}[)\]]?\s*$/, "").trim()
}

function cleanString(value) {
  return value == null ? "" : String(value).trim()
}

function normalizeVenueLocation(value) {
  const location = cleanString(value).replace(/\s+/g, " ")
  if (!location || /^(?:tbd|tba|to be announced|unknown|n\/?a|-)$/i.test(location)) return null
  return location
}

function venueLocationText(conference) {
  return normalizeVenueLocation(conference && conference.location) || "Location TBD"
}

function normalizeStringArray(value) {
  const list = Array.isArray(value) ? value : value == null || value === "" ? [] : [value]
  return list.map(item => cleanString(item)).filter(Boolean)
}

function mergeConferenceTags(...sources) {
  const tags = []
  const seen = new Set()
  for (const source of sources) {
    for (const rawTag of normalizeStringArray(source)) {
      const tag = cleanString(rawTag)
      const key = tag.toLocaleUpperCase()
      if (!tag || seen.has(key)) continue
      seen.add(key)
      tags.push(tag)
    }
  }
  return tags
}

function normalizeSecurityYAML(source) {
  const parsed = parseAndNormalizeSecDeadlinesYaml(source, { endOfMinute: true })
  if (parsed.records.length < 10) return []
  return parsed.conferences.map(enrichSecurityConference)
}

function enrichSecurityConference(conference) {
  const copy = Object.assign({}, conference)
  const timeline = Array.isArray(conference.timeline)
    ? conference.timeline.map(item => Object.assign({}, item))
    : []
  const comment = String(conference.comment || "")
  const derivesOneWeekAbstract = /^Abstract registration required \(1 week before deadline AoE\)\.?$/i.test(comment.trim())
  for (let index = 0; index < timeline.length; index++) {
    const item = timeline[index]
    if (timeline.length > 1) item.roundLabel = `C${index + 1}`
    if (derivesOneWeekAbstract && item.deadline) {
      const paper = new Date(item.deadline)
      if (!isNaN(paper.getTime())) item.abstractDeadline = new Date(paper.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      item.abstractLabel = copy.seriesKey === "usenixsecurity" ? "REG" : "ABS"
      item.abstractDerivedFromComment = true
    }
  }
  copy.shortname = securityDisplayName(copy.seriesKey, copy.shortname, copy.year)
  copy.timeline = timeline
  return copy
}

function securityDisplayName(seriesKey, original, year) {
  const names = {
    ieeesp: "IEEE S&P",
    usenixsecurity: "USENIX Security",
    ccs: "ACM CCS",
    eurosp: "IEEE EuroS&P",
    asiaccs: "ACM AsiaCCS",
  }
  const base = names[seriesKey] || stripTrailingYear(original)
  return `${base} ${year}`.trim()
}

function extractConferenceArray(payload) {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== "object") return []
  if (Array.isArray(payload.conferences)) return payload.conferences
  if (Array.isArray(payload.data)) return payload.data
  if (payload.data && typeof payload.data === "object") return Object.values(payload.data)
  return Object.values(payload).filter(value => value && typeof value === "object" && !Array.isArray(value))
}

function mergeBundledFallbacks(conferences) {
  const merged = Array.isArray(conferences) ? conferences.map(item => Object.assign({}, item)) : []
  const editionIndexes = new Map(merged.map((item, index) => [editionKey(item), index]))
  const mergeFallback = fallback => {
    const key = editionKey(fallback)
    if (!editionIndexes.has(key)) {
      editionIndexes.set(key, merged.length)
      merged.push(Object.assign({}, fallback))
      return
    }
    // Live deadlines always win. A bundled venue may only fill metadata that
    // the live edition has not published yet.
    const index = editionIndexes.get(key)
    if (!normalizeVenueLocation(merged[index].location) && normalizeVenueLocation(fallback.location)) {
      merged[index] = Object.assign({}, merged[index], { location: normalizeVenueLocation(fallback.location) })
    }
    if (!mergeConferenceTags(merged[index].tags).length && mergeConferenceTags(fallback.tags).length) {
      merged[index] = Object.assign({}, merged[index], { tags: mergeConferenceTags(fallback.tags) })
    }
  }
  for (const fallback of BUNDLED_FALLBACKS) {
    mergeFallback(fallback)
  }
  for (const placeholder of BUNDLED_PLACEHOLDERS) {
    mergeFallback(placeholder)
  }
  // Keep a yearless seed even when dated editions exist. Once their last
  // deadline passes, the selector can correctly fall back to “TBD”.
  const ids = new Set(merged.map(item => String(item.id || "")))
  for (const seed of SEED_CONFERENCES) {
    if (!ids.has(seed.id)) merged.push(seed)
  }
  return merged
}

function editionKey(conference) {
  const key = canonicalSeriesKey(conference.seriesKey || deriveSeriesKey(conference.id, conference.shortname))
  const year = conference.year || extractYear(conference.id || conference.shortname)
  return `${key}|${year || ""}`
}

function seedConference(seriesKey, shortname, website) {
  return {
    id: `${seriesKey}-seed`,
    seriesKey,
    year: null,
    shortname,
    title: shortname,
    website,
    location: null,
    timezone: "",
    approximate: false,
    tags: CONFERENCE_AREA_BY_SERIES[seriesKey] ? [CONFERENCE_AREA_BY_SERIES[seriesKey]] : [],
    timeline: [],
    seed: true,
  }
}

function buildCatalog(conferences) {
  const groups = new Map()
  for (const conf of conferences) {
    const key = canonicalSeriesKey(conf.seriesKey || deriveSeriesKey(conf.id, conf.shortname))
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(conf)
  }

  const now = Date.now()
  const catalog = []
  for (const [key, editions] of groups.entries()) {
    const candidates = []
    for (const edition of editions) {
      if (!edition.timeline || !edition.timeline.length) {
        candidates.push(toDisplayCandidate(edition, null))
        continue
      }
      for (const timeline of edition.timeline) candidates.push(toDisplayCandidate(edition, timeline))
    }
    const upcoming = candidates
      .filter(c => nextMilestoneDate(c, now))
      .sort((a, b) => nextMilestoneDate(a, now) - nextMilestoneDate(b, now))
    let current = upcoming[0]
    if (!current) {
      const tbd = candidates
        .filter(c => !c.paperDate)
        .sort((a, b) => (b.year || 0) - (a.year || 0))
      current = tbd[0]
    }
    if (!current) {
      const latestEdition = editions.slice().sort((a, b) => (b.year || 0) - (a.year || 0))[0]
      current = toDisplayCandidate(latestEdition, null)
    }
    const name = stripYear(current.shortname || current.title || key)
    const area = conferenceArea(current)
    catalog.push({
      key,
      name,
      current,
      searchText: `${key} ${name} ${current.shortname || ""} ${current.title || ""} ${current.location || ""} ${(current.tags || []).join(" ")} ${area.code} ${area.label}`.toLocaleLowerCase(),
    })
  }
  return catalog.sort((a, b) => a.name.localeCompare(b.name))
}

function toDisplayCandidate(edition, timeline) {
  return {
    id: edition.id,
    seriesKey: edition.seriesKey,
    year: edition.year,
    shortname: edition.shortname,
    title: edition.title,
    website: edition.website,
    location: normalizeVenueLocation(edition.location),
    tags: mergeConferenceTags(edition.tags),
    dataSrc: String(edition.dataSrc || ""),
    approximate: Boolean(edition.approximate),
    bundledOverride: Boolean(edition.bundledOverride),
    timezone: String(edition.timezone || ""),
    abstractLabel: timeline ? String(timeline.abstractLabel || "ABS").toUpperCase() : "ABS",
    roundLabel: timeline ? String(timeline.roundLabel || "") : "",
    note: timeline ? timeline.note : "",
    paperDate: timeline ? parseDeadline(timeline.deadline, edition.timezone) : null,
    abstractDate: timeline ? parseDeadline(timeline.abstractDeadline, edition.timezone) : null,
  }
}

function parseDeadline(value, timezone) {
  if (!value || /^(tbd|none|null)$/i.test(String(value).trim())) return null
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value
  const text = String(value).trim()
  if (/^\d{4}-\d\d-\d\d$/.test(text)) {
    const suffix = /^aoe$/i.test(String(timezone || "")) ? "T23:59:59-12:00" : "T23:59:59Z"
    const result = new Date(text + suffix)
    return isNaN(result.getTime()) ? null : result
  }
  if (!/(Z|[+-]\d\d:?\d\d)$/i.test(text)) {
    const match = text.match(/^(\d{4})-(\d\d)-(\d\d)[T ](\d\d):(\d\d)(?::(\d\d))?/)
    if (match) {
      const offset = timezoneOffsetMinutes(timezone)
      if (offset !== null) {
        const utc = Date.UTC(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +(match[6] || 0)) - offset * 60000
        return new Date(utc)
      }
    }
  }
  const result = new Date(text)
  return isNaN(result.getTime()) ? null : result
}

function timezoneOffsetMinutes(timezone) {
  const value = String(timezone || "").trim()
  if (/^(AoE|Anywhere on Earth)$/i.test(value)) return -12 * 60
  if (/^(UTC|GMT)$/i.test(value)) return 0
  const match = value.match(/^(?:UTC|GMT)([+-])(\d{1,2})(?::?(\d{2}))?$/i)
  if (!match) return null
  const minutes = Number(match[2]) * 60 + Number(match[3] || 0)
  return match[1] === "+" ? minutes : -minutes
}

function deriveSeriesKey(id, shortname) {
  const fromId = String(id || "")
    .toLocaleLowerCase()
    .replace(/-\d+$/, "")
    .replace(/(?:19|20)\d{2}$/, "")
    .replace(/[^a-z0-9]+/g, "")
  if (fromId) return canonicalSeriesKey(fromId)
  return canonicalSeriesKey(stripYear(shortname || "conference"))
}

function canonicalSeriesKey(value) {
  const key = slug(value)
  if (["usenixsec", "usenixsecurity", "usenixsecuritysymposium"].includes(key)) return "usenixsecurity"
  if (["ieeesp", "ieeesecurityprivacy", "ieeesecurityandprivacy", "oakland"].includes(key)) return "ieeesp"
  return key
}

function extractYear(value) {
  const match = String(value || "").match(/(?:19|20)\d{2}/)
  return match ? Number(match[0]) : null
}

function stripYear(value) {
  return String(value || "").replace(/\s*[([]?(?:19|20)\d{2}[)\]]?\s*$/, "").trim()
}

function slug(value) {
  return String(value || "").toLocaleLowerCase().replace(/[^a-z0-9]+/g, "") || "conference"
}

function compareNullableDates(a, b) {
  if (a && b) return a - b
  if (a) return -1
  if (b) return 1
  return 0
}

function nextMilestone(conf, now) {
  const threshold = (now === undefined ? Date.now() : now) - MILESTONE_GRACE_MS
  const abstractDate = conf && conf.abstractDate instanceof Date ? conf.abstractDate : null
  const paperDate = conf && conf.paperDate instanceof Date ? conf.paperDate : null
  if (abstractDate && abstractDate.getTime() >= threshold && (!paperDate || abstractDate <= paperDate)) {
    return { date: abstractDate, label: String(conf.abstractLabel || "ABS").toUpperCase() }
  }
  if (paperDate && paperDate.getTime() >= threshold) return { date: paperDate, label: "PAPER" }
  if (abstractDate && abstractDate.getTime() >= threshold) return { date: abstractDate, label: "ABS" }
  return null
}

function secondaryDeadlineLabel(conf, longForm) {
  return String(conf.abstractLabel || "ABS").toUpperCase() === "REG"
    ? (longForm ? "Registration" : "Reg")
    : (longForm ? "Abstract" : "Abs")
}

function nextMilestoneDate(conf, now) {
  const milestone = nextMilestone(conf, now)
  return milestone ? milestone.date : null
}

function nextWidgetRefreshDate(conferences, nowValue) {
  const suppliedNow = nowValue instanceof Date ? nowValue.getTime() : Number(nowValue)
  const now = Number.isFinite(suppliedNow) ? suppliedNow : Date.now()
  let refreshAt = now + WIDGET_REFRESH_INTERVAL_MS
  const warningMs = configuredDeadlineDays(WARNING_DEADLINE_DAYS, 14) * DAY_MS
  const urgentMs = configuredDeadlineDays(URGENT_DEADLINE_DAYS, 7) * DAY_MS
  for (const conference of conferences || []) {
    const milestone = nextMilestone(conference, now)
    if (!milestone) continue
    for (const thresholdMs of [warningMs, urgentMs]) {
      const transitionAt = milestone.date.getTime() - thresholdMs
      if (transitionAt > now && transitionAt < refreshAt) refreshAt = transitionAt
    }
    const rolloverAt = milestone.date.getTime() + DEADLINE_ROLLOVER_DELAY_MS
    if (rolloverAt > now && rolloverAt < refreshAt) refreshAt = rolloverAt
  }
  return new Date(refreshAt)
}

function formatDeadlineCompact(date) {
  const formatter = new DateFormatter()
  formatter.locale = "en_GB"
  formatter.dateFormat = "d MMM, HH:mm"
  return formatter.string(date)
}

function formatDeadlineLong(date, timezone) {
  if (isAoETimezone(timezone)) {
    return `Paper ${formatAoE(date)} · Local: ${formatDeadlineCompact(date)}`
  }
  return `Paper · Local: ${formatDeadlineCompact(date)}`
}

function formatOfficialDeadline(date, timezone) {
  return isAoETimezone(timezone) ? formatAoE(date) : `${formatDeadlineCompact(date)} local`
}

function formatDeadlineShort(date, timezone) {
  if (isAoETimezone(timezone)) {
    const shifted = new Date(date.getTime() - 12 * 60 * 60 * 1000)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${shifted.getUTCDate()} ${months[shifted.getUTCMonth()]} AoE`
  }
  const formatter = new DateFormatter()
  formatter.locale = "en_GB"
  formatter.dateFormat = "d MMM"
  return `${formatter.string(date)} local`
}

function formatAoE(date) {
  const shifted = new Date(date.getTime() - 12 * 60 * 60 * 1000)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const day = shifted.getUTCDate()
  const month = months[shifted.getUTCMonth()]
  const hours = String(shifted.getUTCHours()).padStart(2, "0")
  const minutes = String(shifted.getUTCMinutes()).padStart(2, "0")
  return `${day} ${month}, ${hours}:${minutes} AoE`
}

function isAoETimezone(timezone) {
  return /^(AoE|Anywhere on Earth|Etc\/GMT\+12|UTC-12(?::?00)?|GMT-12(?::?00)?)$/i.test(String(timezone || "").trim())
}

function formatCountdown(date) {
  const milliseconds = date.getTime() - Date.now()
  if (milliseconds <= 0) return "expired"
  const hours = Math.floor(milliseconds / 3600000)
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  if (hours < 1) return "< 1h"
  if (days === 0) return `${hours}h`
  if (days === 1) return remainingHours ? `1d ${remainingHours}h` : "tomorrow"
  if (days < 14 && remainingHours) return `${days}d ${remainingHours}h`
  return `${days}d`
}

function sourceDescription(result) {
  if (result.networkError) return result.fetchedAt ? `partial cache · ${formatUpdateDate(result.fetchedAt)}` : "bundled data only"
  return result.fetchedAt ? `updated ${formatUpdateDate(result.fetchedAt)}` : "bundled data"
}

function formatUpdateDate(timestamp) {
  const formatter = new DateFormatter()
  formatter.locale = "en_GB"
  formatter.dateFormat = "d MMM, HH:mm"
  return formatter.string(new Date(timestamp))
}

function safeURL(value) {
  const text = String(value || "")
  return /^https?:\/\//i.test(text) ? text : AI_DATA_URL
}

function loadSettings() {
  const value = readJSON(settingsPath, null)
  if (!value || !Array.isArray(value.selectedSeries)) return { version: SETTINGS_SCHEMA_VERSION, selectedSeries: [] }
  return { version: SETTINGS_SCHEMA_VERSION, selectedSeries: value.selectedSeries.map(String) }
}

function saveSettings(settings) {
  writeJSON(settingsPath, { version: SETTINGS_SCHEMA_VERSION, selectedSeries: settings.selectedSeries })
}

function ensureDirectory() {
  if (!fm.fileExists(baseDir)) fm.createDirectory(baseDir, true)
}

function readJSON(path, fallback) {
  try {
    if (!fm.fileExists(path)) return fallback
    return JSON.parse(fm.readString(path))
  } catch (_) {
    return fallback
  }
}

function writeJSON(path, value) {
  ensureDirectory()
  fm.writeString(path, JSON.stringify(value))
}

function accentColor() {
  return Color.dynamic(new Color("365FD9"), new Color("86A7FF"))
}

function primaryColor() {
  return Color.dynamic(new Color("121827"), new Color("F5F7FF"))
}

function secondaryColor() {
  return Color.dynamic(new Color("4F5B73"), new Color("B9C2D9"))
}

function tertiaryColor() {
  return Color.dynamic(new Color("7E899E"), new Color("808AA0"))
}

function separatorColor() {
  return Color.dynamic(new Color("DCE3F2"), new Color("293247"))
}
