#!/usr/bin/env bash

set -euo pipefail

target_dir="${1:-/home/pi}"

mkdir -p "$target_dir"

cat > "$target_dir/override.json" <<'EOF'
{"override": null}
EOF

cat > "$target_dir/location_state.json" <<'EOF'
{"date":"1970-01-01","location":"off_campus"}
EOF

echo "Created:"
echo "  $target_dir/override.json"
echo "  $target_dir/location_state.json"
