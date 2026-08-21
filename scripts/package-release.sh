#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
cd "$repo_root"

node scripts/validate-release.mjs
version="$(node scripts/read-version.mjs)"
release_tag="${RELEASE_TAG:-v$version}"
if [[ ! "$release_tag" =~ ^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ ]] || [[ "$release_tag" != "v$version" ]]; then
  echo "Release tag $release_tag does not match APP_VERSION $version" >&2
  exit 1
fi

package_tmp="$(mktemp -d)"
trap 'rm -rf "$package_tmp"' EXIT
payload_dir="$package_tmp/payload"
output_dir="$package_tmp/output"
mkdir -p "$payload_dir" "$output_dir" dist

cp DeadlineDeck.js "$payload_dir/DeadlineDeck.js"
cp DeadlineDeck.txt "$payload_dir/DeadlineDeck.txt"
cp INSTALL-DeadlineDeck.txt "$payload_dir/INSTALL-DeadlineDeck.txt"

zip_path="$output_dir/DeadlineDeck.zip"
(
  cd "$payload_dir"
  zip -X -q "$zip_path" DeadlineDeck.js DeadlineDeck.txt INSTALL-DeadlineDeck.txt
)

mapfile -t zip_entries < <(unzip -Z1 "$zip_path")
expected_entries=(DeadlineDeck.js DeadlineDeck.txt INSTALL-DeadlineDeck.txt)
if [[ "${zip_entries[*]}" != "${expected_entries[*]}" ]]; then
  echo "Unexpected ZIP entries: ${zip_entries[*]}" >&2
  exit 1
fi

zip_sha256="$(sha256sum "$zip_path" | awk '{print $1}')"
published_at="${RELEASE_PUBLISHED_AT:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}"
node scripts/create-manifest.mjs "$output_dir/latest.json" "$version" "$published_at" "$zip_sha256"

cp DeadlineDeck.js "$output_dir/DeadlineDeck.js"
cp DeadlineDeck.txt "$output_dir/DeadlineDeck.txt"
cp INSTALL-DeadlineDeck.txt "$output_dir/INSTALL-DeadlineDeck.txt"
(
  cd "$output_dir"
  sha256sum DeadlineDeck.zip DeadlineDeck.js DeadlineDeck.txt INSTALL-DeadlineDeck.txt latest.json > SHA256SUMS.txt
)

cp "$output_dir/DeadlineDeck.zip" dist/DeadlineDeck.zip
cp "$output_dir/DeadlineDeck.js" dist/DeadlineDeck.js
cp "$output_dir/DeadlineDeck.txt" dist/DeadlineDeck.txt
cp "$output_dir/INSTALL-DeadlineDeck.txt" dist/INSTALL-DeadlineDeck.txt
cp "$output_dir/latest.json" dist/latest.json
cp "$output_dir/SHA256SUMS.txt" dist/SHA256SUMS.txt

echo "Packaged DeadlineDeck $version in $repo_root/dist"
