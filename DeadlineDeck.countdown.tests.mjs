import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import vm from "node:vm"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const sourcePath = path.join(here, "DeadlineDeck.js")
const source = fs.readFileSync(sourcePath, "utf8")

// DeadlineDeck bootstraps Scriptable at top level. Keep the production helper
// functions intact while removing only that I/O bootstrap and its paths.
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
globalThis.__deadlineDeckCountdownTestAPI = {
  addConferenceRow,
  addSmallWidget,
  makeWidget,
  rolloverDelay: DEADLINE_ROLLOVER_DELAY_MS,
  refreshInterval: WIDGET_REFRESH_INTERVAL_MS,
}
`

const NOW_MS = Date.parse("2026-08-20T12:00:00.000Z")
class FixedDate extends Date {
  constructor(...args) {
    super(...(args.length ? args : [NOW_MS]))
  }
  static now() { return NOW_MS }
}

class MockColor {
  constructor(hex) { this.hex = hex }
  static dynamic(light) { return light }
}

class MockWidgetNode {
  constructor(tracker = { dates: [], texts: [] }) {
    this.tracker = tracker
  }
  addStack() { return new MockWidgetNode(this.tracker) }
  addText(value) {
    const text = {
      value: String(value),
      centerAlignText() {},
    }
    this.tracker.texts.push(text)
    return text
  }
  addDate(value) {
    const date = {
      value,
      styles: [],
      applyDateStyle() { this.styles.push("date") },
      applyOffsetStyle() { this.styles.push("offset") },
      applyRelativeStyle() { this.styles.push("relative") },
      applyTimeStyle() { this.styles.push("time") },
      applyTimerStyle() { this.styles.push("timer") },
    }
    this.tracker.dates.push(date)
    return date
  }
  addImage() { return { centerAlignImage() {} } }
  addSpacer() {}
  centerAlignContent() {}
  layoutVertically() {}
  setPadding() {}
}

class MockListWidget extends MockWidgetNode {
  constructor() {
    super()
    this.refreshAfterDate = null
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
  LinearGradient: class LinearGradient {},
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
const api = sandbox.__deadlineDeckCountdownTestAPI

async function test(name, fn) {
  try {
    await fn()
    console.log(`ok - ${name}`)
  } catch (error) {
    console.error(`not ok - ${name}`)
    throw error
  }
}

function displayConference(deadline) {
  return {
    id: "testconf2026",
    seriesKey: "testconf",
    year: 2026,
    shortname: "TestConf 2026",
    title: "Test Conference",
    website: "https://example.test/",
    location: "Test City, TS, USA",
    timezone: "UTC",
    paperDate: new FixedDate(deadline),
    abstractDate: null,
  }
}

function sourceConference(deadline) {
  return {
    id: "testconf2026",
    seriesKey: "testconf",
    year: 2026,
    shortname: "TestConf 2026",
    title: "Test Conference",
    website: "https://example.test/",
    location: "Test City, TS, USA",
    timezone: "UTC",
    timeline: [{ deadline: new FixedDate(deadline).toISOString() }],
  }
}

function assertLiveOffsetOnly(dateElement) {
  assert.ok(dateElement, "expected the widget to render a WidgetDate")
  assert.deepEqual(
    dateElement.styles,
    ["offset"],
    "the live countdown must use offset style (+ before, − after), not an unsigned relative date",
  )
}

await test("medium/large rows use a signed live offset", () => {
  const root = new MockWidgetNode()
  api.addConferenceRow(root, displayConference(NOW_MS + 30 * 60 * 1000), "medium")
  assert.equal(root.tracker.dates.length, 1)
  assertLiveOffsetOnly(root.tracker.dates[0])
})

await test("small widgets use the same signed live offset", () => {
  const root = new MockWidgetNode()
  api.addSmallWidget(
    root,
    { networkError: null },
    { selectedSeries: ["testconf"] },
    displayConference(NOW_MS + 30 * 60 * 1000),
    1,
    1,
  )
  assert.equal(root.tracker.dates.length, 1)
  assertLiveOffsetOnly(root.tracker.dates[0])
})

await test("a just-expired milestone still renders as a negative live offset", () => {
  const root = new MockWidgetNode()
  api.addConferenceRow(root, displayConference(NOW_MS - 30 * 1000), "medium")
  assert.equal(root.tracker.dates.length, 1)
  assertLiveOffsetOnly(root.tracker.dates[0])
  assert.ok(root.tracker.dates[0].value.getTime() < NOW_MS)
})

await test("widget refresh is requested 75 seconds after the nearest selected deadline", async () => {
  const deadline = NOW_MS + 30 * 60 * 1000
  const widget = await api.makeWidget(
    { conferences: [sourceConference(deadline)], networkError: null },
    { selectedSeries: ["testconf"] },
    "small",
    1,
  )
  assert.equal(api.rolloverDelay, 75 * 1000)
  assert.equal(widget.refreshAfterDate.getTime(), deadline + api.rolloverDelay)
})

await test("the normal four-hour refresh remains the upper bound", async () => {
  const deadline = NOW_MS + 8 * 60 * 60 * 1000
  const widget = await api.makeWidget(
    { conferences: [sourceConference(deadline)], networkError: null },
    { selectedSeries: ["testconf"] },
    "small",
    1,
  )
  assert.equal(widget.refreshAfterDate.getTime(), NOW_MS + api.refreshInterval)
})

await test("the nearest selected milestone controls refresh even when another page is displayed", async () => {
  const firstDeadline = NOW_MS + 20 * 60 * 1000
  const secondDeadline = NOW_MS + 90 * 60 * 1000
  const first = sourceConference(firstDeadline)
  const second = {
    ...sourceConference(secondDeadline),
    id: "laterconf2026",
    seriesKey: "laterconf",
    shortname: "LaterConf 2026",
  }
  const widget = await api.makeWidget(
    { conferences: [first, second], networkError: null },
    { selectedSeries: ["testconf", "laterconf"] },
    "small",
    2,
  )
  assert.equal(widget.refreshAfterDate.getTime(), firstDeadline + api.rolloverDelay)
})

await test("a milestone inside the one-minute grace window still gets its rollover refresh", async () => {
  const deadline = NOW_MS - 30 * 1000
  const widget = await api.makeWidget(
    { conferences: [sourceConference(deadline)], networkError: null },
    { selectedSeries: ["testconf"] },
    "small",
    1,
  )
  assert.equal(widget.refreshAfterDate.getTime(), deadline + api.rolloverDelay)
  assert.ok(widget.refreshAfterDate.getTime() > NOW_MS)
})

console.log("All DeadlineDeck countdown/rollover regression tests passed.")
