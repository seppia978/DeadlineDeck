const [candidateValue, previousTagValue] = process.argv.slice(2)
const strict = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/

function parse(value) {
  const normalized = String(value || "").replace(/^v/, "")
  const match = normalized.match(strict)
  if (!match) throw new Error(`Invalid stable version: ${value}`)
  return match.slice(1).map(Number)
}

function compare(left, right) {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] > right[index] ? 1 : -1
  }
  return 0
}

try {
  const candidate = parse(candidateValue)
  const previous = parse(previousTagValue)
  if (compare(candidate, previous) <= 0) {
    throw new Error(`${candidateValue} must be greater than ${previousTagValue}`)
  }
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
