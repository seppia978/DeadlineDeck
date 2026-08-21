import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import vm from "node:vm"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const sourcePath = path.join(here, "DeadlineDeck.js")
const source = fs.readFileSync(sourcePath, "utf8")

// DeadlineDeck starts Scriptable at the top level. Remove only that bootstrap
// and its FileManager paths, leaving the real classification and render helpers
// intact for regression coverage.
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
globalThis.__deadlineDeckAreaTestAPI = {
  conferenceArea: typeof conferenceArea === "function" ? conferenceArea : null,
  normalizePayload,
  normalizeSecDeadlineRecords,
  toDisplayCandidate,
  addConferenceRow,
  addSmallWidget,
}
`

class MockColor {
  constructor(hex, alpha = 1) {
    this.hex = hex
    this.alpha = alpha
  }
  static dynamic(light) { return light }
}

class MockNode {
  constructor(tracker = { texts: [], dates: [], stacks: [], images: [] }) {
    this.tracker = tracker
  }
  addStack() {
    const stack = new MockNode(this.tracker)
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
  setPadding() {}
}

const mockFont = () => ({})
const sandbox = {
  console,
  Date,
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
  SFSymbol: { named: name => ({ image: { name } }) },
  Size: class Size { constructor(width, height) { this.width = width; this.height = height } },
  URLScheme: { forRunningScript: () => "scriptable:///run/DeadlineDeck" },
  DateFormatter: class DateFormatter {
    string(date) { return date.toISOString() }
  },
}

vm.createContext(sandbox)
vm.runInContext(testableSource, sandbox, { filename: "DeadlineDeck.js" })
const api = sandbox.__deadlineDeckAreaTestAPI

function test(name, fn) {
  try {
    fn()
    console.log(`ok - ${name}`)
  } catch (error) {
    console.error(`not ok - ${name}`)
    throw error
  }
}

function area(conf) {
  assert.equal(typeof api.conferenceArea, "function", "expected a conferenceArea(conf) classifier")
  const result = api.conferenceArea(conf)
  assert.ok(result && typeof result === "object", "expected area metadata")
  assert.match(String(result.code || ""), /^[A-Z]{2}$/, "area code must contain exactly two letters")
  assert.ok(String(result.label || "").trim(), "area must have an accessible label")
  assert.ok(colorKey(result.color), "area must have a visible color")
  return result
}

function colorKey(value) {
  if (!value) return ""
  if (typeof value === "string") return value.toUpperCase()
  return String(value.hex || value.value || value.name || "").toUpperCase()
}

function displayConference(overrides = {}) {
  return {
    id: "usenixsecurity2099",
    seriesKey: "usenixsecurity",
    year: 2099,
    shortname: "USENIX Security 2099",
    title: "USENIX Security Symposium",
    website: "https://example.test/",
    location: "Test City, TS, USA",
    timezone: "UTC",
    tags: ["SC"],
    paperDate: new Date("2099-12-01T23:59:59.000Z"),
    abstractDate: null,
    ...overrides,
  }
}

function renderedBadge(tracker, expectedCode) {
  const badge = tracker.texts.find(item => item.value === expectedCode)
  assert.ok(badge, `expected the ${expectedCode} area badge to be rendered`)
  // Both a colored glyph and a pill with a colored background are valid.
  const visibleColor = colorKey(badge.textColor) || colorKey(badge.owner.backgroundColor)
  assert.ok(visibleColor, `expected the ${expectedCode} badge to have a visible color`)
  return { badge, visibleColor }
}

test("known conference series map to stable two-letter research areas", () => {
  const cases = [
    ["usenixsecurity", "USENIX Security", "SC", "Security"],
    ["iclr", "ICLR", "ML", "Machine Learning"],
    ["cvpr", "CVPR", "CV", "Computer Vision"],
    ["acl", "ACL", "NL", "Natural Language Processing"],
    ["rss", "Robotics: Science and Systems", "RO", "Robotics"],
    ["kdd", "KDD", "DM", "Data Mining"],
  ]

  for (const [seriesKey, title, expectedCode, expectedLabel] of cases) {
    const result = area({ seriesKey, shortname: `${title} 2099`, title, tags: [] })
    assert.equal(result.code, expectedCode)
    assert.match(result.label, new RegExp(expectedLabel, "i"))
  }
})

test("area colors visually distinguish security, machine learning, and vision", () => {
  const areas = [
    area({ seriesKey: "usenixsecurity", title: "Security", tags: [] }),
    area({ seriesKey: "iclr", title: "Learning Representations", tags: [] }),
    area({ seriesKey: "cvpr", title: "Computer Vision", tags: [] }),
  ]
  assert.equal(new Set(areas.map(item => colorKey(item.color))).size, areas.length)
})

test("metadata and title provide fallbacks for conference series not in the built-in map", () => {
  const taggedSecurity = area({
    seriesKey: "newprivacyvenue",
    title: "New Privacy Research Conference",
    tags: ["security", "privacy"],
  })
  assert.equal(taggedSecurity.code, "SC")

  const titledVision = area({
    seriesKey: "newvisionvenue",
    title: "International Conference on Computer Vision Systems",
    tags: [],
  })
  assert.equal(titledVision.code, "CV")
})

test("the source tag SP is reserved for speech/signal processing rather than security", () => {
  const result = area({
    seriesKey: "newaudio",
    title: "Speech and Signal Processing Conference",
    tags: ["SP"],
  })
  assert.equal(result.code, "SP")
  assert.match(result.label, /(speech|signal)/i)
})

test("AI payload normalization combines tags with legacy sub values and deduplicates them", () => {
  const normalized = api.normalizePayload([{
    id: "newvision2099",
    shortname: "New Vision 2099",
    title: "New Research Conference",
    timezone: "UTC",
    tags: ["CONF", "CV", "AI"],
    sub: ["cv", "ML", "AI"],
    timeline: [{ deadline: "2099-12-01T23:59:59.000Z" }],
  }])

  assert.equal(normalized.length, 1)
  assert.deepEqual(Array.from(normalized[0].tags), ["CONF", "CV", "AI", "ML"])
  assert.equal(area(normalized[0]).code, "CV")
})

test("sec-deadlines tags survive normalization and display-candidate conversion", () => {
  const normalized = api.normalizeSecDeadlineRecords([{
    name: "New Security Venue",
    description: "Research Conference",
    year: 2099,
    link: "https://example.test/security",
    deadline: ["2099-12-01 23:59"],
    timezone: "UTC",
    tags: ["CONF", "ASTAR", "CORE-A", "SEC", "PRIV"],
  }], { endOfMinute: true })

  assert.equal(normalized.conferences.length, 1)
  const edition = normalized.conferences[0]
  assert.deepEqual(Array.from(edition.tags), ["CONF", "ASTAR", "CORE-A", "SEC", "PRIV"])
  const display = api.toDisplayCandidate(edition, edition.timeline[0])
  assert.deepEqual(Array.from(display.tags), ["CONF", "ASTAR", "CORE-A", "SEC", "PRIV"])
  assert.equal(area(display).code, "SC")
})

test("ranking and venue-kind metadata tags do not become research areas", () => {
  const metadataTags = ["CONF", "JRN", "WORKSHOP", "ASTAR", "TOP4", "CORE-A"]
  const security = area({
    seriesKey: "unmappedvenue",
    title: "Generic Research Meeting",
    tags: [...metadataTags, "SEC", "PRIV"],
  })
  assert.equal(security.code, "SC")

  const artificialIntelligence = area({
    seriesKey: "unmappedai",
    title: "Generic Research Meeting",
    tags: ["CONF", "AI"],
  })
  assert.equal(artificialIntelligence.code, "AI", "AI is a real area tag, not metadata")

  const unknown = area({
    seriesKey: "unmappedgeneric",
    title: "Generic Research Meeting",
    tags: metadataTags,
  })
  assert.equal(unknown.code, "CS")
})

test("medium and large deadline rows render a colored area badge", () => {
  for (const family of ["medium", "large"]) {
    const root = new MockNode()
    api.addConferenceRow(root, displayConference(), family)
    renderedBadge(root.tracker, "SC")
  }
})

test("the small widget renders the same colored area badge", () => {
  const root = new MockNode()
  api.addSmallWidget(
    root,
    { networkError: null },
    { selectedSeries: ["usenixsecurity"] },
    displayConference(),
    1,
    1,
  )
  renderedBadge(root.tracker, "SC")
})

test("the bundled fallback seal remains independent from the area badge", () => {
  const live = new MockNode()
  api.addConferenceRow(live, displayConference({ bundledOverride: false }), "large")
  renderedBadge(live.tracker, "SC")
  assert.equal(live.tracker.images.filter(item => item.image && item.image.name === "checkmark.seal.fill").length, 0)

  const bundled = new MockNode()
  api.addConferenceRow(bundled, displayConference({ bundledOverride: true }), "large")
  renderedBadge(bundled.tracker, "SC")
  assert.equal(bundled.tracker.images.filter(item => item.image && item.image.name === "checkmark.seal.fill").length, 1)
})

console.log("All DeadlineDeck area badge regression tests passed.")
