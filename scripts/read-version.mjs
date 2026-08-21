import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const source = fs.readFileSync(path.join(root, "DeadlineDeck.js"), "utf8")
const match = source.match(/^const APP_VERSION = "((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*))"$/m)

if (!match) {
  console.error("DeadlineDeck.js must define one strict APP_VERSION")
  process.exit(1)
}

process.stdout.write(match[1])
