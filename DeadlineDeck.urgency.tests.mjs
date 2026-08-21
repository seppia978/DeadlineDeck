import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import vm from "node:vm"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const sourcePath = path.join(here, "DeadlineDeck.js")
const source = fs.readFileSync(sourcePath, "utf8")

// DeadlineDeck bootstraps Scriptable at top level. Remove only that I/O
// bootstrap and its FileManager paths, leaving the production urgency,
// rendering, and refresh helpers intact for regression coverage.
let testableSource = source
  .replace(/^const fm = .*\n/m, "")
  .replace(/^const baseDir = .*\n/m, "")
  .replace(/^const cachePath = .*\n/m, "")
  .replace(/^const settingsPath = .*\n/m, "")
  .replace(/^const updateStatePath = .*\n/m, "")
  .replace(
    /\nensureDirectory\(\)\n\nif \(config\.runsInWidget\)[\s\S]*?\nScript\.complete\(\)\n/,
    "\n",
  )

assert.doesNotMatch(testableSource, /if \(config\.runsInWidget\)/)
assert.doesNotMatch(testableSource, /Script\.setWidget/)

testableSource += `
globalThis.__deadlineDeckUrgencyTestAPI = {
  warningDays: typeof WARNING_DEADLINE_DAYS === "undefined" ? null : WARNING_DEADLINE_DAYS,
  urgentDays: typeof URGENT_DEADLINE_DAYS === "undefined" ? null : URGENT_DEADLINE_DAYS,
  deadlineUrgency: typeof deadlineUrgency === "function" ? deadlineUrgency : null,
  urgencyBackgroundColor: typeof urgencyBackgroundColor === "function" ? urgencyBackgroundColor : null,
  addConferenceRow,
  makeWidget,
  nextWidgetRefreshDate,
  rolloverDelay: DEADLINE_ROLLOVER_DELAY_MS,
  refreshInterval: WIDGET_REFRESH_INTERVAL_MS,
}
`

const NOW_MS = Date.parse("2026-08-20T12:00:00.000Z")
const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

class FixedDate extends Date {
  constructor(...args) {
    super(...(args.length ? args : [NOW_MS]))
  }
  static now() { return NOW_MS }
}

class MockColor {
  constructor(hex, alpha = 1) {
    this.hex = String(hex)
    this.alpha = alpha
  }
  static dynamic(light, dark) {
    return { dynamic: true, light, dark }
  }
}

class MockWidgetNode {
  constructor(tracker = { texts: [], dates: [], stacks: [], images: [] }) {
    this.tracker = tracker
    this.padding = null
  }
  addStack() {
    const stack = new MockWidgetNode(this.tracker)
    this.tracker.stacks.push(stack)
    return stack
  }
  addText(value) {
    const text = {
      value: String(value),
      owner: this,
      centerAlignText() {},
    }
    this.tracker.texts.push(text)
    return text
  }
  addDate(value) {
    const date = {
      value,
      applyOffsetStyle() {},
    }
    this.tracker.dates.push(date)
    return date
  }
  addImage(image) {
    const rendered = { image, centerAlignImage() {} }
    this.tracker.images.push(rendered)
    return rendered
  }
  addSpacer() {}
  centerAlignContent() {}
  layoutVertically() {}
  setPadding(...values) { this.padding = values }
}

class MockListWidget extends MockWidgetNode {
  constructor() {
    super()
    this.refreshAfterDate = null
    this.backgroundGradient = null
    this.backgroundColor = null
  }
}

class MockLinearGradient {
  constructor() {
    this.locations = []
    this.colors = []
    this.startPoint = null
    this.endPoint = null
  }
}

class MockPoint {
  constructor(x, y) {
    this.x = x
    this.y = y
  }
}

const mockFont = () => ({})
const sandbox = {
  console,
  Date: FixedDate,
  Math,
  JSON,
  Intl,
  Map,
  Set,
  URL,
  Color: MockColor,
  Font: {
    boldSystemFont: mockFont,
    semiboldSystemFont: mockFont,
    mediumSystemFont: mockFont,
    systemFont: mockFont,
  },
  LinearGradient: MockLinearGradient,
  Point: MockPoint,
  ListWidget: MockListWidget,
  SFSymbol: { named: name => ({ image: { name } }) },
  Size: class Size { constructor(width, height) { this.width = width; this.height = height } },
  URLScheme: { forRunningScript: () => "scriptable:///run/DeadlineDeck" },
  DateFormatter: class DateFormatter {
    string(date) { return date.toISOString() }
  },
}

vm.createContext(sandbox)
vm.runInContext(testableSource, sandbox, { filename: "DeadlineDeck.js" })
const api = sandbox.__deadlineDeckUrgencyTestAPI

async function test(name, fn) {
  try {
    await fn()
    console.log(`ok - ${name}`)
  } catch (error) {
    console.error(`not ok - ${name}`)
    throw error
  }
}

function displayConference(deadline, overrides = {}) {
  return {
    id: "testconf2026",
    seriesKey: "testconf",
    year: 2026,
    shortname: "TestConf 2026",
    title: "Test Conference",
    website: "https://example.test/testconf",
    location: "Test City, TS, USA",
    timezone: "UTC",
    tags: ["CS"],
    paperDate: deadline == null ? null : new FixedDate(deadline),
    abstractDate: null,
    ...overrides,
  }
}

function sourceConference(deadline, overrides = {}) {
  const id = overrides.id || "testconf2026"
  const seriesKey = overrides.seriesKey || "testconf"
  return {
    id,
    seriesKey,
    year: 2026,
    shortname: overrides.shortname || "TestConf 2026",
    title: overrides.title || "Test Conference",
    website: overrides.website || `https://example.test/${seriesKey}`,
    location: "Test City, TS, USA",
    timezone: "UTC",
    tags: ["CS"],
    timeline: deadline == null ? [] : [{ deadline: new FixedDate(deadline).toISOString() }],
  }
}

function colorSignature(value) {
  if (!value) return ""
  if (value.dynamic) return `dynamic(${colorSignature(value.light)},${colorSignature(value.dark)})`
  if (value.hex != null) return `${String(value.hex).toUpperCase()}@${value.alpha}`
  return String(value)
}

function backgroundSignature(node) {
  const color = colorSignature(node && node.backgroundColor)
  const gradient = node && node.backgroundGradient
  const gradientColors = gradient && Array.isArray(gradient.colors)
    ? gradient.colors.map(colorSignature).join("|")
    : ""
  return [color, gradientColors].filter(Boolean).join("::")
}

function renderedConferenceRow(deadline, family) {
  const root = new MockWidgetNode()
  const conference = displayConference(deadline)
  api.addConferenceRow(root, conference, family)
  const row = root.tracker.stacks.find(stack => stack.url === conference.website)
  assert.ok(row, `expected a ${family} conference row`)
  return row
}

async function smallWidget(deadline) {
  return api.makeWidget(
    { conferences: [sourceConference(deadline)], networkError: null },
    { selectedSeries: ["testconf"] },
    "small",
    1,
  )
}

await test("the warning and urgent windows are editable top-level day constants", () => {
  assert.equal(api.warningDays, 14)
  assert.equal(api.urgentDays, 7)
  assert.match(source, /^const WARNING_DEADLINE_DAYS\s*=\s*14\s*$/m)
  assert.match(source, /^const URGENT_DEADLINE_DAYS\s*=\s*7\s*$/m)

  const fileManagerBinding = source.indexOf("const fm = FileManager.local()")
  assert.ok(source.indexOf("const WARNING_DEADLINE_DAYS") < fileManagerBinding)
  assert.ok(source.indexOf("const URGENT_DEADLINE_DAYS") < fileManagerBinding)
})

await test("deadlineUrgency classifies TBD, warning, urgent, and grace-window milestones", () => {
  assert.equal(typeof api.deadlineUrgency, "function", "expected deadlineUrgency(conference, nowValue)")

  assert.equal(api.deadlineUrgency(displayConference(null), NOW_MS), "normal", "TBD remains neutral")
  assert.equal(api.deadlineUrgency(displayConference(NOW_MS + 14 * DAY_MS + 1), NOW_MS), "normal")
  assert.equal(api.deadlineUrgency(displayConference(NOW_MS + 14 * DAY_MS), NOW_MS), "warning")
  assert.equal(api.deadlineUrgency(displayConference(NOW_MS + 7 * DAY_MS + 1), NOW_MS), "warning")
  assert.equal(api.deadlineUrgency(displayConference(NOW_MS + 7 * DAY_MS), NOW_MS), "urgent")
  assert.equal(api.deadlineUrgency(displayConference(NOW_MS + 30 * 60 * 1000), NOW_MS), "urgent")
  assert.equal(api.deadlineUrgency(displayConference(NOW_MS - 30 * 1000), NOW_MS), "urgent", "just-expired deadlines retain their red tint during rollover grace")
  assert.equal(api.deadlineUrgency(displayConference(NOW_MS - 61 * 1000), NOW_MS), "normal", "the tint clears after the milestone grace window")
})

await test("medium and large rows receive uniform warning and urgent backgrounds", () => {
  for (const family of ["medium", "large"]) {
    const neutral = renderedConferenceRow(NOW_MS + 20 * DAY_MS, family)
    const warning = renderedConferenceRow(NOW_MS + 10 * DAY_MS, family)
    const urgent = renderedConferenceRow(NOW_MS + 3 * DAY_MS, family)
    const tbd = renderedConferenceRow(null, family)

    assert.equal(backgroundSignature(neutral), "", `${family} neutral rows keep the normal background`)
    assert.equal(backgroundSignature(tbd), "", `${family} TBD rows keep the normal background`)
    assert.ok(backgroundSignature(warning), `${family} warning rows need a uniform amber background`)
    assert.ok(backgroundSignature(urgent), `${family} urgent rows need a uniform red background`)
    assert.notEqual(backgroundSignature(warning), backgroundSignature(urgent))
    assert.ok(warning.backgroundColor, `${family} warning rows use a flat tint`)
    assert.ok(urgent.backgroundColor, `${family} urgent rows use a flat tint`)
    assert.equal(warning.backgroundGradient, undefined, `${family} warning rows do not use a gradient`)
    assert.equal(urgent.backgroundGradient, undefined, `${family} urgent rows do not use a gradient`)
    assert.ok(Number(warning.cornerRadius) > 0, `${family} warning tint should have rounded corners`)
    assert.ok(Number(urgent.cornerRadius) > 0, `${family} urgent tint should have rounded corners`)
    assert.deepEqual(warning.padding && [warning.padding[0], warning.padding[2]], [0, 0])
    assert.deepEqual(urgent.padding && [urgent.padding[0], urgent.padding[2]], [0, 0])
  }
})

await test("the small widget covers the whole card with a uniform urgency background", async () => {
  const neutral = await smallWidget(NOW_MS + 20 * DAY_MS)
  const warning = await smallWidget(NOW_MS + 10 * DAY_MS)
  const urgent = await smallWidget(NOW_MS + 3 * DAY_MS)

  const neutralBackground = backgroundSignature(neutral)
  const warningBackground = backgroundSignature(warning)
  const urgentBackground = backgroundSignature(urgent)
  assert.ok(neutralBackground, "the small widget keeps its normal base gradient")
  assert.ok(warningBackground, "the small warning widget needs a tinted background")
  assert.ok(urgentBackground, "the small urgent widget needs a tinted background")
  assert.notEqual(warningBackground, neutralBackground)
  assert.notEqual(urgentBackground, neutralBackground)
  assert.notEqual(urgentBackground, warningBackground)
  assert.equal(warning.backgroundGradient, null, "small warning widgets do not install the base gradient")
  assert.equal(urgent.backgroundGradient, null, "small urgent widgets do not install the base gradient")
  assert.ok(warning.backgroundColor, "small warning widgets use a flat tint")
  assert.ok(urgent.backgroundColor, "small urgent widgets use a flat tint")
})

await test("uniform colors remain amber for warning and red for urgent", () => {
  const warning = api.urgencyBackgroundColor("warning", false)
  const urgent = api.urgencyBackgroundColor("urgent", false)
  assert.ok(warning)
  assert.ok(urgent)
  assert.match(colorSignature(warning), /F59E0B/i)
  assert.match(colorSignature(warning), /FBBF24/i)
  assert.match(colorSignature(urgent), /DC2626/i)
  assert.match(colorSignature(urgent), /FB7185/i)
  assert.equal(api.urgencyBackgroundColor("normal", false), null)
  assert.doesNotMatch(source, /urgencyBandGradient|bandCount/)
})

await test("refresh scheduling catches the exact future 14-day warning crossing", () => {
  const deadline = NOW_MS + 14 * DAY_MS + 2 * HOUR_MS
  const refresh = api.nextWidgetRefreshDate([displayConference(deadline)], NOW_MS)
  assert.equal(refresh.getTime(), deadline - 14 * DAY_MS)
})

await test("refresh scheduling catches the exact future 7-day urgent crossing", () => {
  const deadline = NOW_MS + 7 * DAY_MS + 90 * 60 * 1000
  const refresh = api.nextWidgetRefreshDate([displayConference(deadline)], NOW_MS)
  assert.equal(refresh.getTime(), deadline - 7 * DAY_MS)
})

await test("normal four-hour refresh and deadline rollover behavior remain intact", () => {
  const farDeadline = NOW_MS + 30 * DAY_MS
  assert.equal(
    api.nextWidgetRefreshDate([displayConference(farDeadline)], NOW_MS).getTime(),
    NOW_MS + api.refreshInterval,
  )

  const nearDeadline = NOW_MS + 30 * 60 * 1000
  assert.equal(
    api.nextWidgetRefreshDate([displayConference(nearDeadline)], NOW_MS).getTime(),
    nearDeadline + api.rolloverDelay,
  )

  const justExpired = NOW_MS - 30 * 1000
  assert.equal(
    api.nextWidgetRefreshDate([displayConference(justExpired)], NOW_MS).getTime(),
    justExpired + api.rolloverDelay,
  )
})

console.log("All DeadlineDeck urgency regression tests passed.")
