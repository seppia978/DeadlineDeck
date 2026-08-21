import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const read = name => fs.readFileSync(path.join(root, name), "utf8")
const source = read("DeadlineDeck.js")
const textMirror = read("DeadlineDeck.txt")
const install = read("INSTALL-DeadlineDeck.txt")
const changelog = read("CHANGELOG.md")
const packageJSON = JSON.parse(read("package.json"))

const match = source.match(/^const APP_VERSION = "((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*))"$/m)
assert.ok(match, "APP_VERSION must be strict MAJOR.MINOR.PATCH")
const version = match[1]
const [major, minor] = version.split(".")

assert.equal(packageJSON.version, version, "package.json version must match APP_VERSION")
assert.equal(source, textMirror, "DeadlineDeck.txt must be byte-identical to DeadlineDeck.js")
assert.match(source, /^const SETTINGS_SCHEMA_VERSION = 3$/m, "the existing settings schema must remain compatible")
assert.match(source, new RegExp(`^const BUILD_LABEL = "DeadlineDeck ${major}\\.${minor}(?: | ·)` , "m"))
assert.match(source, /^const UPDATE_REPOSITORY = "seppia978\/DeadlineDeck"$/m)
assert.match(source, /releases\/latest\/download\/latest\.json/)
assert.match(changelog, new RegExp(`^## \\[${version.replace(/\./g, "\\.")}\\]`, "m"))
assert.match(install, /releases\/latest/i)
assert.match(install, /Check for App Updates/i)

for (const [name, contents] of [
  ["DeadlineDeck.js", source],
  ["DeadlineDeck.txt", textMirror],
  ["INSTALL-DeadlineDeck.txt", install],
]) {
  assert.doesNotMatch(contents, /github_pat_[A-Za-z0-9_]+|ghp_[A-Za-z0-9]+|BEGIN [A-Z ]*PRIVATE KEY|Authorization:\s*Bearer/i, `${name} contains a secret-like value`)
}

const expectedTag = `v${version}`
if (process.env.RELEASE_TAG) {
  assert.equal(process.env.RELEASE_TAG, expectedTag, "release tag must match APP_VERSION")
}

console.log(`Release metadata validated for ${expectedTag}.`)
