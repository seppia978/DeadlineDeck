import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import vm from "node:vm"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const source = fs.readFileSync(path.join(here, "DeadlineDeck.js"), "utf8")
const installText = fs.readFileSync(path.join(here, "INSTALL-DeadlineDeck.txt"), "utf8")

// Scriptable executes DeadlineDeck's bootstrap at the top level. Remove only
// that I/O bootstrap and the FileManager paths so the production pagination
// helper and widget builder can be exercised without Scriptable or network I/O.
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
globalThis.__deadlineDeckRowsTestAPI = {
  maxRows: typeof MAX_N_ROWS === "undefined" ? null : MAX_N_ROWS,
  mediumMaxRows: typeof MEDIUM_WIDGET_MAX_N_ROWS === "undefined" ? null : MEDIUM_WIDGET_MAX_N_ROWS,
  widgetMaxRows: typeof widgetMaxRows === "function" ? widgetMaxRows : null,
  conferenceIdentityWidth: typeof conferenceIdentityWidth === "function" ? conferenceIdentityWidth : null,
  makeWidget,
  presentInfo,
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
  constructor(tracker = { texts: [], dates: [] }) {
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
      applyOffsetStyle() {},
    }
    this.tracker.dates.push(date)
    return date
  }
  addImage() { return { centerAlignImage() {} } }
  addSpacer() {}
  centerAlignContent() {}
  layoutVertically() {}
  setPadding(...values) { this.padding = values }
}

class MockListWidget extends MockWidgetNode {
  constructor() {
    super()
    this.refreshAfterDate = null
  }
}

let latestAlert = null
class MockAlert {
  constructor() {
    this.title = ""
    this.message = ""
    latestAlert = this
  }
  addAction() {}
  async presentAlert() { return 0 }
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
  Alert: MockAlert,
  Color: MockColor,
  Device: { screenSize: () => ({ width: 393, height: 852 }) },
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
const api = sandbox.__deadlineDeckRowsTestAPI

async function test(name, fn) {
  try {
    await fn()
    console.log(`ok - ${name}`)
  } catch (error) {
    console.error(`not ok - ${name}`)
    throw error
  }
}

function sourceConference(index) {
  return {
    id: `conference${index}2099`,
    seriesKey: `conference${index}`,
    year: 2099,
    shortname: `Conference ${index}`,
    title: `Conference ${index}`,
    website: "https://example.test/",
    location: "Test City, TS, USA",
    timezone: "UTC",
    timeline: [{ deadline: `2099-12-${String(index).padStart(2, "0")}T23:59:59.000Z` }],
  }
}

function widgetFixture(count = 8) {
  const conferences = Array.from({ length: count }, (_, index) => sourceConference(index + 1))
  return {
    dataResult: { conferences, networkError: null, fetchedAt: 0 },
    settings: { selectedSeries: conferences.map(item => item.seriesKey) },
  }
}

function renderedConferenceNames(widget) {
  return widget.tracker.texts
    .map(item => item.value)
    .filter(value => /^Conference \d+$/.test(value))
}

await test("the user-facing row limits are editable constants at the beginning of the script", () => {
  assert.equal(api.maxRows, 6, "MAX_N_ROWS must configure six rows in the large widget")
  assert.equal(api.mediumMaxRows, 3, "the medium widget must have its own editable row limit")
  assert.match(source, /^const MAX_N_ROWS\s*=\s*6\s*$/m)
  assert.match(source, /^const MEDIUM_WIDGET_MAX_N_ROWS\s*=\s*3\s*$/m)

  const fileManagerBinding = source.indexOf("const fm = FileManager.local()")
  assert.ok(source.indexOf("const MAX_N_ROWS") < fileManagerBinding)
  assert.ok(source.indexOf("const MEDIUM_WIDGET_MAX_N_ROWS") < fileManagerBinding)
})

await test("one helper maps widget families to their effective row limits", () => {
  assert.equal(typeof api.widgetMaxRows, "function")
  assert.equal(api.widgetMaxRows("small"), 1, "small has a dedicated one-deadline layout")
  assert.equal(api.widgetMaxRows("accessoryRectangular"), 1, "Lock Screen rectangular shows one readable deadline")
  assert.equal(api.widgetMaxRows("medium"), 3)
  assert.equal(api.widgetMaxRows("large"), 6)
})

await test("Lock Screen rectangular uses a dedicated single-deadline layout", async () => {
  const { dataResult, settings } = widgetFixture()
  const accessory = await api.makeWidget(dataResult, settings, "accessoryRectangular", 1)
  assert.deepEqual(accessory.padding, [2, 4, 2, 4])
  assert.equal(accessory.addAccessoryWidgetBackground, true)
  assert.equal(renderedConferenceNames(accessory).length, 1)
  assert.equal(accessory.tracker.dates.length, 1, "the Lock Screen countdown remains live")
  assert.ok(accessory.tracker.texts.some(item => item.value === "PAPER"))
  assert.ok(accessory.tracker.texts.some(item => /local$/.test(item.value)))
  assert.ok(!accessory.tracker.texts.some(item => item.value === "UPCOMING DEADLINES"))
})

await test("makeWidget obtains its page size from the helper instead of hardcoded family values", () => {
  const makeWidgetSource = source.slice(
    source.indexOf("async function makeWidget"),
    source.indexOf("function addHeader"),
  )
  assert.match(makeWidgetSource, /const pageSize\s*=\s*widgetMaxRows\(family\)/)
  assert.doesNotMatch(makeWidgetSource, /const pageSize\s*=\s*family/)
})

await test("conference identity does not compete with a duplicated milestone label", () => {
  const rowSource = source.slice(
    source.indexOf("function addConferenceRow"),
    source.indexOf("function addEmptyState"),
  )
  assert.match(rowSource, /const identity\s*=\s*top\.addStack\(\)/)
  assert.match(rowSource, /identity\.size\s*=\s*new Size\(conferenceIdentityWidth\(\), 0\)/)
  assert.doesNotMatch(rowSource, /identity\.size\s*=\s*new Size\(0,/)
  assert.match(rowSource, /addConferenceAreaBadge\(identity, conf, family\)/)
  assert.match(rowSource, /const name\s*=\s*identity\.addText/)
  assert.match(rowSource, /name\.minimumScaleFactor\s*=\s*0\.75\s*\n\s*(?:\/\/[^\n]*\n\s*)?identity\.addSpacer\(\)/)
  assert.doesNotMatch(rowSource, /top\.addSpacer\(\)\s*\n\s*top\.addSpacer\(6\)/)
  assert.match(rowSource, /top\.addSpacer\(6\)[\s\S]*?top\.addSpacer\(\)\s*\n\s*row\.addSpacer\(1\)/)
  assert.match(rowSource, /const timing\s*=\s*top\.addStack\(\)/)
  assert.match(rowSource, /timing\.addDate\(milestone\.date\)/)
  assert.doesNotMatch(rowSource, /const milestoneLabel/)
  assert.match(rowSource, /detail\s*=\s*`\$\{milestone\.label\}/)
  assert.doesNotMatch(rowSource, /top\.addDate\(milestone\.date\)/)
})

await test("conference identity width adapts to the logical screen width", () => {
  assert.equal(api.conferenceIdentityWidth({ width: 393, height: 852 }), 220, "iPhone 15 Pro keeps the validated width")
  assert.equal(api.conferenceIdentityWidth({ width: 375, height: 812 }), 210, "narrower iPhones receive a smaller identity column")
  assert.equal(api.conferenceIdentityWidth({ width: 430, height: 932 }), 220, "Pro Max devices respect the upper bound")
  assert.equal(api.conferenceIdentityWidth({ width: 320, height: 568 }), 180, "very narrow legacy screens respect the lower bound")
  assert.equal(api.conferenceIdentityWidth({ width: 768, height: 1024 }), 220, "iPads do not enlarge the timing offset unnecessarily")
})

await test("a large widget renders six conferences per page", async () => {
  const { dataResult, settings } = widgetFixture()
  const firstPage = await api.makeWidget(dataResult, settings, "large", 1)
  const secondPage = await api.makeWidget(dataResult, settings, "large", 2)
  assert.equal(renderedConferenceNames(firstPage).length, 6)
  assert.equal(renderedConferenceNames(secondPage).length, 2)
  assert.ok(firstPage.tracker.texts.some(item => item.value === "1/2"))
  assert.ok(secondPage.tracker.texts.some(item => item.value === "2/2"))
})

await test("medium and small widget pagination retain their intended sizes", async () => {
  const { dataResult, settings } = widgetFixture()
  const medium = await api.makeWidget(dataResult, settings, "medium", 1)
  const small = await api.makeWidget(dataResult, settings, "small", 1)
  assert.equal(renderedConferenceNames(medium).length, 3)
  assert.equal(renderedConferenceNames(small).length, 1)
})

await test("About and installation instructions describe the configured 1/3/6 layout", async () => {
  await api.presentInfo({ networkError: null, fetchedAt: 0 })
  assert.match(latestAlert.message, /small widget shows (?:the next deadline|1 deadline)/i)
  assert.match(latestAlert.message, /medium shows (?:up to )?3/i)
  assert.match(latestAlert.message, /large shows (?:up to )?6/i)
  assert.match(installText, /small widget shows 1 deadline, medium shows 3, and large shows 6/i)
})

console.log("All DeadlineDeck row-limit regression tests passed.")
