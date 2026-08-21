import fs from "node:fs"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const tests = fs.readdirSync(root)
  .filter(name => /^DeadlineDeck\..+\.tests\.mjs$/.test(name))
  .sort()

if (tests.length < 6) {
  console.error(`Expected at least 6 DeadlineDeck test suites, found ${tests.length}`)
  process.exit(1)
}

const syntax = spawnSync(process.execPath, ["--check", "DeadlineDeck.js"], {
  cwd: root,
  stdio: "inherit",
})
if (syntax.status !== 0) process.exit(syntax.status || 1)

const newerVersion = spawnSync(process.execPath, ["scripts/assert-newer-version.mjs", "1.10.0", "v1.9.9"], {
  cwd: root,
  stdio: "inherit",
})
if (newerVersion.status !== 0) process.exit(newerVersion.status || 1)

for (const invalidPair of [["1.7.0", "v1.7.0"], ["1.6.9", "v1.7.0"], ["01.8.0", "v1.7.0"]]) {
  const guard = spawnSync(process.execPath, ["scripts/assert-newer-version.mjs", ...invalidPair], {
    cwd: root,
    stdio: "ignore",
  })
  if (guard.status === 0) {
    console.error(`Version guard accepted invalid transition ${invalidPair.join(" -> ")}`)
    process.exit(1)
  }
}

for (const test of tests) {
  const result = spawnSync(process.execPath, [test], {
    cwd: root,
    stdio: "inherit",
  })
  if (result.status !== 0) process.exit(result.status || 1)
}

const validation = spawnSync(process.execPath, ["scripts/validate-release.mjs"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
})
if (validation.status !== 0) process.exit(validation.status || 1)

console.log(`All ${tests.length} DeadlineDeck suites and release checks passed.`)
