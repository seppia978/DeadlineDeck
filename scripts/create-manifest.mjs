import assert from "node:assert/strict"
import fs from "node:fs"

const [outputPath, version, publishedAt, zipSha256] = process.argv.slice(2)
assert.ok(outputPath, "output path is required")
assert.match(version || "", /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/)
assert.ok(Number.isFinite(Date.parse(publishedAt || "")), "publishedAt must be an ISO date")
assert.match(zipSha256 || "", /^[a-f0-9]{64}$/)

const tag = `v${version}`
const manifest = {
  schemaVersion: 1,
  product: "DeadlineDeck",
  version,
  tag,
  publishedAt: new Date(publishedAt).toISOString(),
  releaseUrl: `https://github.com/seppia978/DeadlineDeck/releases/tag/${tag}`,
  downloadUrl: `https://github.com/seppia978/DeadlineDeck/releases/download/${tag}/DeadlineDeck.zip`,
  zipSha256,
  notes: `DeadlineDeck ${version} is available. Tap to view the release notes and download the update.`,
}

fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8")
