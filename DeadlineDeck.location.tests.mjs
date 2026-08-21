import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import vm from "node:vm"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const sourcePath = path.join(here, "DeadlineDeck.js")
const source = fs.readFileSync(sourcePath, "utf8")
const installText = fs.readFileSync(path.join(here, "INSTALL-DeadlineDeck.txt"), "utf8")

// Scriptable executes DeadlineDeck's bootstrap at the top level. Remove only
// that bootstrap and the FileManager bindings so the real production helpers
// can be exercised in a side-effect-free Node VM.
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
globalThis.__deadlineDeckTestAPI = {
  normalizePayload,
  parseAndNormalizeSecDeadlinesYaml,
  mergeBundledFallbacks,
  toDisplayCandidate,
  normalizeVenueLocation,
  buildCatalog,
  loadConferenceData,
  addConferenceRow,
  addSmallWidget,
  presentConferencePicker,
  presentUpcomingTable,
  cacheSchemaVersion: CACHE_SCHEMA_VERSION,
  cacheMetadataVersion: CACHE_METADATA_VERSION,
}
`

class MockColor {
  constructor(hex) { this.hex = hex }
  static dynamic(light) { return light }
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
const api = sandbox.__deadlineDeckTestAPI

function test(name, fn) {
  try {
    fn()
    console.log(`ok - ${name}`)
  } catch (error) {
    console.error(`not ok - ${name}`)
    throw error
  }
}

class MockNode {
  constructor(texts) { this.texts = texts }
  addStack() { return new MockNode(this.texts) }
  addText(value) {
    const text = {
      value: String(value),
      centerAlignText() {},
    }
    this.texts.push(text.value)
    return text
  }
  addDate() {
    const date = { applyRelativeStyle() {} }
    this.texts.push("[relative date]")
    return date
  }
  addImage() { return {} }
  addSpacer() {}
  centerAlignContent() {}
  layoutVertically() {}
}

const futureDeadline = "2099-12-01T23:59:59.000Z"

test("venue normalization trims whitespace and recognizes unknown values", () => {
  assert.equal(api.normalizeVenueLocation("  Austin,   TX, USA  "), "Austin, TX, USA")
  assert.equal(api.normalizeVenueLocation("TBA"), null)
  assert.equal(api.normalizeVenueLocation("Virtual"), "Virtual")
})

test("AI JSON normalization preserves the source venue", () => {
  const normalized = api.normalizePayload([{
    id: "venueconf2099",
    shortname: "VenueConf 2099",
    year: 2099,
    location: "Austin, TX, USA",
    timezone: "AoE",
    timeline: [{ deadline: futureDeadline }],
  }])
  assert.equal(normalized.length, 1)
  assert.equal(normalized[0].location, "Austin, TX, USA")
})

test("sec-deadlines YAML normalization preserves place as location", () => {
  const yaml = `
- name: USENIX Security
  description: USENIX Security Symposium
  year: 2099
  link: https://example.test/usenix
  deadline:
    - 2098-08-26 23:59
  timezone: AoE
  place: Denver, CO, USA
`
  const result = api.parseAndNormalizeSecDeadlinesYaml(yaml, { endOfMinute: true })
  assert.equal(result.conferences.length, 1)
  assert.equal(result.conferences[0].location, "Denver, CO, USA")
})

test("bundled metadata fills a missing live location without replacing live dates", () => {
  const liveDeadline = "2099-08-26T11:59:59.000Z"
  const live = {
    id: "usenixsecurity2027-live",
    seriesKey: "usenixsecurity",
    year: 2027,
    shortname: "USENIX Security 2027",
    website: "https://live.example.test/",
    timezone: "AoE",
    location: null,
    timeline: [{ deadline: liveDeadline }],
  }
  const merged = api.mergeBundledFallbacks([live])
  const edition = merged.find(item => item.seriesKey === "usenixsecurity" && item.year === 2027)
  assert.ok(edition)
  assert.equal(edition.location, "Denver, CO, USA")
  assert.equal(edition.website, "https://live.example.test/")
  assert.equal(edition.timeline[0].deadline, liveDeadline)
})

test("bundled metadata never overwrites a live location", () => {
  const live = {
    id: "usenixsecurity2027-live",
    seriesKey: "usenixsecurity",
    year: 2027,
    shortname: "USENIX Security 2027",
    website: "https://live.example.test/",
    timezone: "AoE",
    location: "Live City, ZZ, USA",
    timeline: [{ deadline: futureDeadline }],
  }
  const merged = api.mergeBundledFallbacks([live])
  const edition = merged.find(item => item.seriesKey === "usenixsecurity" && item.year === 2027)
  assert.equal(edition.location, "Live City, ZZ, USA")
})

test("display candidates retain location metadata", () => {
  const display = api.toDisplayCandidate({
    id: "venueconf2099",
    seriesKey: "venueconf",
    year: 2099,
    shortname: "VenueConf 2099",
    title: "VenueConf",
    website: "https://example.test/",
    timezone: "AoE",
    location: "Austin, TX, USA",
  }, { deadline: futureDeadline })
  assert.equal(display.location, "Austin, TX, USA")
})

test("venue text participates in conference search", () => {
  const catalog = api.buildCatalog([{
    id: "venueconf2099",
    seriesKey: "venueconf",
    year: 2099,
    shortname: "VenueConf 2099",
    title: "VenueConf",
    website: "https://example.test/",
    timezone: "AoE",
    location: "Austin, TX, USA",
    timeline: [{ deadline: futureDeadline }],
  }])
  assert.equal(catalog.length, 1)
  assert.match(catalog[0].searchText, /austin, tx, usa/)
})

test("display metadata invalidates old caches without changing cache schema v2", () => {
  assert.equal(api.cacheSchemaVersion, 2)
  assert.equal(api.cacheMetadataVersion, 2)
  const loader = api.loadConferenceData.toString()
  assert.match(loader, /metadataSchemaVersion\)\s*===\s*CACHE_METADATA_VERSION/)
  assert.match(loader, /aiFresh\s*=\s*metadataCurrent\s*&&/)
  assert.match(loader, /securityFresh\s*=\s*metadataCurrent\s*&&/)
  assert.match(loader, /metadataSchemaVersion:\s*CACHE_METADATA_VERSION/)
})

test("both in-app deadline lists include venue metadata", () => {
  assert.match(api.presentConferencePicker.toString(), /venueLocationText/)
  assert.match(api.presentUpcomingTable.toString(), /venueLocationText/)
})

test("medium/large rows render the venue", () => {
  const texts = []
  api.addConferenceRow(new MockNode(texts), {
    shortname: "VenueConf 2099",
    website: "https://example.test/",
    timezone: "AoE",
    location: "Austin, TX, USA",
    paperDate: null,
    abstractDate: null,
  }, "medium")
  assert.ok(texts.some(value => value.includes("Austin, TX, USA")), texts.join(" | "))
})

test("small widget renders the venue", () => {
  const texts = []
  api.addSmallWidget(
    new MockNode(texts),
    { networkError: null },
    { selectedSeries: ["venueconf"] },
    {
      shortname: "VenueConf 2099",
      website: "https://example.test/",
      timezone: "AoE",
      location: "Austin, TX, USA",
      paperDate: null,
      abstractDate: null,
    },
    1,
    1,
  )
  assert.ok(texts.some(value => value.includes("Austin, TX, USA")), texts.join(" | "))
})

test("widgets label unannounced venues explicitly", () => {
  const mediumTexts = []
  api.addConferenceRow(new MockNode(mediumTexts), {
    shortname: "VenueConf 2099",
    website: "https://example.test/",
    timezone: "AoE",
    location: null,
    paperDate: null,
    abstractDate: null,
  }, "medium")
  assert.ok(mediumTexts.some(value => /Location TBD/i.test(value)), mediumTexts.join(" | "))

  const smallTexts = []
  api.addSmallWidget(
    new MockNode(smallTexts),
    { networkError: null },
    { selectedSeries: ["venueconf"] },
    {
      shortname: "VenueConf 2099",
      website: "https://example.test/",
      timezone: "AoE",
      location: null,
      paperDate: null,
      abstractDate: null,
    },
    1,
    1,
  )
  assert.ok(smallTexts.some(value => /Location TBD/i.test(value)), smallTexts.join(" | "))
})

test("large widgets use the editable six-deadline row limit", () => {
  assert.match(source, /^const MAX_N_ROWS\s*=\s*6\s*$/m)
  assert.match(source, /const pageSize\s*=\s*widgetMaxRows\(family\)/)
  assert.match(source, /large shows up to \$\{widgetMaxRows\("large"\)\}/i)
  assert.match(installText, /large shows 6/i)
})

console.log("All DeadlineDeck location regression tests passed.")
