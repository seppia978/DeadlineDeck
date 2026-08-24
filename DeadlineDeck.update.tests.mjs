import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import vm from "node:vm"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const source = fs.readFileSync(path.join(here, "DeadlineDeck.js"), "utf8")

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
globalThis.__deadlineDeckUpdateTestAPI = {
  appVersion: APP_VERSION,
  settingsSchemaVersion: SETTINGS_SCHEMA_VERSION,
  checksEnabled: CHECK_FOR_APP_UPDATES,
  checkInterval: UPDATE_CHECK_INTERVAL_MS,
  manifestURL: UPDATE_MANIFEST_URL,
  releasesURL: UPDATE_RELEASES_URL,
  parseSemver,
  compareSemver,
  normalizeReleaseManifest,
  checkForAppUpdate,
  loadUpdateState,
}
`

let nowMs = Date.parse("2026-08-21T12:00:00.000Z")
class FixedDate extends Date {
  constructor(...args) {
    super(...(args.length ? args : [nowMs]))
  }
  static now() { return nowMs }
}

const fileContents = new Map()
const directories = new Set()
const fm = {
  fileExists(value) { return fileContents.has(value) || directories.has(value) },
  createDirectory(value) { directories.add(value) },
  readString(value) { return fileContents.get(value) },
  writeString(value, contents) { fileContents.set(value, String(contents)) },
}

class MockRequest {
  static instances = []
  static responses = []

  constructor(url) {
    this.url = url
    this.headers = {}
    this.timeoutInterval = 0
    this.response = null
    MockRequest.instances.push(this)
  }

  async loadString() {
    const next = MockRequest.responses.shift()
    if (!next) throw new Error("missing mock response")
    if (next.error) throw next.error
    this.response = { statusCode: next.status == null ? 200 : next.status }
    return String(next.body == null ? "" : next.body)
  }
}

class MockNotification {
  static scheduled = []
  static failNext = false

  constructor() {
    this.actions = []
  }

  addAction(title, url, destructive = false) {
    this.actions.push({ title, url, destructive })
  }

  async schedule() {
    if (MockNotification.failNext) {
      MockNotification.failNext = false
      throw new Error("notifications disabled")
    }
    MockNotification.scheduled.push({
      identifier: this.identifier,
      threadIdentifier: this.threadIdentifier,
      title: this.title,
      body: this.body,
      openURL: this.openURL,
      sound: this.sound,
      actions: this.actions,
    })
  }
}

const sandbox = {
  console,
  Date: FixedDate,
  Math,
  JSON,
  Intl,
  Map,
  Set,
  URL,
  fm,
  baseDir: "/library/ConferenceDeadlineWidget",
  cachePath: "/library/ConferenceDeadlineWidget/conferences-v2.json",
  settingsPath: "/library/ConferenceDeadlineWidget/settings-v1.json",
  updateStatePath: "/library/ConferenceDeadlineWidget/update-state-v1.json",
  Request: MockRequest,
  Notification: MockNotification,
  Safari: { openInApp() {} },
  Alert: class Alert {},
  DateFormatter: class DateFormatter {},
}

vm.createContext(sandbox)
vm.runInContext(testableSource, sandbox, { filename: "DeadlineDeck.js" })
const api = sandbox.__deadlineDeckUpdateTestAPI

async function test(name, fn) {
  try {
    await fn()
    console.log(`ok - ${name}`)
  } catch (error) {
    console.error(`not ok - ${name}`)
    throw error
  }
}

function releaseManifest(version, overrides = {}) {
  const tag = `v${version}`
  return {
    schemaVersion: 1,
    product: "DeadlineDeck",
    version,
    tag,
    publishedAt: "2026-08-21T12:00:00.000Z",
    releaseUrl: `https://github.com/seppia978/DeadlineDeck/releases/tag/${tag}`,
    downloadUrl: `https://github.com/seppia978/DeadlineDeck/releases/download/${tag}/DeadlineDeck.zip`,
    zipSha256: "a".repeat(64),
    notes: `DeadlineDeck ${version}`,
    ...overrides,
  }
}

function queueManifest(version, overrides = {}) {
  MockRequest.responses.push({ status: 200, body: JSON.stringify(releaseManifest(version, overrides)) })
}

await test("app and settings versions remain separate", () => {
  assert.equal(api.appVersion, "1.7.3")
  assert.equal(api.settingsSchemaVersion, 3)
  assert.equal(api.checksEnabled, true)
  assert.equal(api.checkInterval, 6 * 60 * 60 * 1000)
  assert.equal(api.manifestURL, "https://github.com/seppia978/DeadlineDeck/releases/latest/download/latest.json")
})

await test("semantic versions are parsed and compared numerically", () => {
  assert.equal(api.parseSemver("1.7.0").version, "1.7.0")
  assert.equal(api.compareSemver("1.10.0", "1.9.9"), 1)
  assert.equal(api.compareSemver("2.0.0", "2.0.0"), 0)
  assert.equal(api.compareSemver("1.7.1", "1.7.0"), 1, "the solid-highlight patch is newer than the first public release")
  assert.equal(api.compareSemver("1.6.9", "1.7.0"), -1)
  for (const invalid of ["v1.7.0", "1.7", "1.7.0-beta", "01.7.0", "1.7.-1", ""]) {
    assert.equal(api.parseSemver(invalid), null)
  }
})

await test("release manifests require the exact product, tag, URLs, timestamp, and digest", () => {
  assert.equal(api.normalizeReleaseManifest(releaseManifest("1.8.0")).version, "1.8.0")
  assert.equal(api.normalizeReleaseManifest(releaseManifest("1.8.0", { product: "OtherApp" })), null)
  assert.equal(api.normalizeReleaseManifest(releaseManifest("1.8.0", { tag: "v9.9.9" })), null)
  assert.equal(api.normalizeReleaseManifest(releaseManifest("1.8.0", { releaseUrl: "https://example.test/release" })), null)
  assert.equal(api.normalizeReleaseManifest(releaseManifest("1.8.0", { downloadUrl: "https://example.test/DeadlineDeck.zip" })), null)
  assert.equal(api.normalizeReleaseManifest(releaseManifest("1.8.0", { zipSha256: "bad" })), null)
  assert.equal(api.normalizeReleaseManifest(releaseManifest("1.8.0", { publishedAt: "not-a-date" })), null)
})

await test("an active local lease prevents duplicate network checks from widget stacks", async () => {
  const requestCount = MockRequest.instances.length
  const leasedState = JSON.stringify({
    schemaVersion: 1,
    lastCheckedAt: 0,
    latestRelease: null,
    checkLeaseUntil: nowMs + 30 * 1000,
  })
  fileContents.set(sandbox.updateStatePath, leasedState)
  const result = await api.checkForAppUpdate(false, true)
  assert.equal(result.status, "deferred")
  assert.equal(MockRequest.instances.length, requestCount)
  assert.equal(fileContents.get(sandbox.updateStatePath), leasedState, "a deferred process must not overwrite the lease owner")
  fileContents.clear()
})

await test("an implausibly distant future lease is discarded", async () => {
  fileContents.set(sandbox.updateStatePath, JSON.stringify({
    schemaVersion: 1,
    lastCheckedAt: 0,
    latestRelease: null,
    checkLeaseUntil: nowMs + 365 * 24 * 60 * 60 * 1000,
  }))
  queueManifest("1.7.1")
  const result = await api.checkForAppUpdate(false, false)
  assert.equal(result.status, "current")
  assert.equal(api.loadUpdateState().checkLeaseUntil, 0)
  fileContents.clear()
  MockRequest.instances.length = 0
})

await test("a newer stable release is fetched without a token and notified exactly once", async () => {
  const settingsBefore = JSON.stringify({ version: 3, selectedSeries: ["iclr", "usenixsecurity"] })
  fileContents.set(sandbox.settingsPath, settingsBefore)
  queueManifest("1.8.0")
  const first = await api.checkForAppUpdate(false, true)
  assert.equal(first.status, "available")
  assert.equal(MockRequest.instances.length, 1)
  assert.equal(MockRequest.instances[0].timeoutInterval, 8)
  assert.equal(MockRequest.instances[0].headers.Authorization, undefined)
  assert.match(MockRequest.instances[0].headers["User-Agent"], /^DeadlineDeck\/1\.7\.3/)
  assert.equal(MockNotification.scheduled.length, 1)
  assert.equal(fileContents.get(sandbox.settingsPath), settingsBefore, "update checks must not alter user selections")
  assert.equal(MockNotification.scheduled[0].identifier, "deadlinedeck-update-1-8-0")
  assert.equal(MockNotification.scheduled[0].openURL, releaseManifest("1.8.0").releaseUrl)
  assert.deepEqual(
    MockNotification.scheduled[0].actions.map(item => [item.title, item.url]),
    [["Download ZIP", releaseManifest("1.8.0").downloadUrl]],
  )

  const cached = await api.checkForAppUpdate(false, true)
  assert.equal(cached.status, "available")
  assert.equal(MockRequest.instances.length, 1, "fresh update metadata must be cached")
  assert.equal(MockNotification.scheduled.length, 1, "the same release must not be announced twice")
})

await test("a later check of the same release does not create a duplicate notification", async () => {
  nowMs += 7 * 60 * 60 * 1000
  queueManifest("1.8.0")
  const result = await api.checkForAppUpdate(false, true)
  assert.equal(result.status, "available")
  assert.equal(MockRequest.instances.length, 2)
  assert.equal(MockNotification.scheduled.length, 1)
})

await test("a subsequent version produces one new notification", async () => {
  nowMs += 7 * 60 * 60 * 1000
  queueManifest("1.9.0")
  const result = await api.checkForAppUpdate(false, true)
  assert.equal(result.release.version, "1.9.0")
  assert.equal(MockNotification.scheduled.length, 2)
  assert.equal(MockNotification.scheduled[1].identifier, "deadlinedeck-update-1-9-0")
})

await test("a release-channel rollback preserves the newest verified version and never renotifies", async () => {
  nowMs += 7 * 60 * 60 * 1000
  queueManifest("1.8.0")
  const result = await api.checkForAppUpdate(false, true)
  assert.equal(result.status, "available")
  assert.equal(result.release.version, "1.9.0")
  assert.match(result.error, /moved backwards/)
  assert.equal(MockNotification.scheduled.length, 2)
  assert.equal(api.loadUpdateState().latestRelease.version, "1.9.0")
})

await test("notification failures are contained and use a 24-hour retry cooldown", async () => {
  nowMs += 7 * 60 * 60 * 1000
  queueManifest("2.0.0")
  MockNotification.failNext = true
  const first = await api.checkForAppUpdate(false, true)
  assert.equal(first.status, "available")
  assert.match(first.notificationError, /notifications disabled/)
  const notificationCount = MockNotification.scheduled.length

  const cached = await api.checkForAppUpdate(false, true)
  assert.equal(cached.status, "available")
  assert.equal(MockNotification.scheduled.length, notificationCount)
})

await test("a failed network refresh preserves the last verified release", async () => {
  nowMs += 7 * 60 * 60 * 1000
  MockRequest.responses.push({ status: 503, body: "unavailable" })
  const result = await api.checkForAppUpdate(false, false)
  assert.equal(result.status, "available")
  assert.equal(result.release.version, "2.0.0")
  assert.match(result.error, /HTTP 503/)
  assert.equal(api.loadUpdateState().latestRelease.version, "2.0.0")
})

await test("current or older releases on a fresh install never notify", async () => {
  fileContents.clear()
  MockNotification.scheduled.length = 0
  nowMs += 7 * 60 * 60 * 1000
  queueManifest("1.7.3")
  const current = await api.checkForAppUpdate(false, true)
  assert.equal(current.status, "current")
  assert.equal(MockNotification.scheduled.length, 0)

  fileContents.clear()
  nowMs += 7 * 60 * 60 * 1000
  queueManifest("1.7.0")
  const older = await api.checkForAppUpdate(false, true)
  assert.equal(older.status, "current")
  assert.equal(MockNotification.scheduled.length, 0)
})

await test("a failed live check with a cached current release is reported as an error", async () => {
  fileContents.clear()
  nowMs += 7 * 60 * 60 * 1000
  queueManifest("1.7.3")
  assert.equal((await api.checkForAppUpdate(false, false)).status, "current")

  nowMs += 7 * 60 * 60 * 1000
  MockRequest.responses.push({ status: 503, body: "unavailable" })
  const failed = await api.checkForAppUpdate(false, false)
  assert.equal(failed.status, "error")
  assert.equal(failed.release.version, "1.7.3")
  assert.match(failed.error, /HTTP 503/)
})

await test("the manual update alert offers both release notes and the ZIP download", () => {
  const start = source.indexOf("async function presentUpdateCheck")
  const end = source.indexOf("async function checkForAppUpdate")
  const manualSource = source.slice(start, end)
  assert.match(manualSource, /addAction\("Open GitHub Release"\)/)
  assert.match(manualSource, /addAction\("Download ZIP"\)/)
  assert.match(manualSource, /Safari\.openInApp\(result\.release\.downloadUrl/)
})

assert.doesNotMatch(source, /Authorization\s*:/)
assert.doesNotMatch(source, /Keychain\./)
console.log("All DeadlineDeck update-check regression tests passed.")
