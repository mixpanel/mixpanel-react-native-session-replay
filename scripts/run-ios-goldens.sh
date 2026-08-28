#!/usr/bin/env bash
#
# Runs the iOS React Native wireframe coordinate goldens.
#
# In Debug the host app loads its bundle from Metro, so this starts one if it is not already
# running and stops it again on the way out. That is the only reason this script exists — the
# tests themselves are a normal xcodebuild invocation.
#
#   ./scripts/run-ios-goldens.sh [simulator-udid]
#
# With no argument it picks the first available iPhone simulator. Coordinates are portable
# across devices (the fixture is absolutely positioned inside its own fixed-size window), so
# the choice of simulator does not affect the goldens.
set -euo pipefail

cd "$(dirname "$0")/.."
REPO="$PWD"
WORKSPACE="$REPO/example/ios/MixpanelReactNativeSessionReplayExample.xcworkspace"
SCHEME="MixpanelReactNativeSessionReplayExample"
# No -derivedDataPath by default: Xcode's shared DerivedData keeps builds incremental and
# leaves nothing in the repo. A private path means a from-scratch build of all ~78 pods every
# time, which is both slow and enough disk to matter (~2.8 GB a tree). Override for CI, where
# a scoped path is usually what you want.
# NB: expanded as ${DERIVED_ARGS[@]+...} below — macOS ships bash 3.2, where expanding an
# empty array under `set -u` is an "unbound variable" error rather than expanding to nothing.
DERIVED_ARGS=()
if [[ -n "${DERIVED_DATA:-}" ]]; then
  DERIVED_ARGS=(-derivedDataPath "$DERIVED_DATA")
fi

UDID="${1:-}"
if [[ -z "$UDID" ]]; then
  UDID=$(xcrun simctl list devices available \
    | grep -oE '\(([0-9A-F]{8}-[0-9A-F-]+)\)' \
    | tr -d '()' | head -1)
fi
if [[ -z "$UDID" ]]; then
  echo "No available simulator found. Create one in Xcode, or pass a UDID." >&2
  exit 1
fi
echo "→ simulator: $UDID"

# Only manage Metro if we started it, so a dev already running one keeps theirs.
STARTED_METRO=0
METRO_LOG="$(mktemp -t rn-goldens-metro)"
cleanup() {
  if [[ "$STARTED_METRO" == "1" ]]; then
    echo "→ stopping Metro"
    lsof -ti:8081 2>/dev/null | xargs kill 2>/dev/null || true
  fi
}
trap cleanup EXIT

if lsof -ti:8081 >/dev/null 2>&1; then
  echo "→ Metro already running on 8081, reusing it"
else
  echo "→ starting Metro (log: $METRO_LOG)"
  (cd "$REPO/example" && npx react-native start >"$METRO_LOG" 2>&1 &)
  STARTED_METRO=1
  for _ in $(seq 1 60); do
    grep -q "Dev server ready" "$METRO_LOG" 2>/dev/null && break
    sleep 1
  done
  if ! grep -q "Dev server ready" "$METRO_LOG" 2>/dev/null; then
    echo "Metro did not come up. Log:" >&2
    tail -20 "$METRO_LOG" >&2
    exit 1
  fi
fi

echo "→ building"
xcodebuild build-for-testing \
  -workspace "$WORKSPACE" -scheme "$SCHEME" -configuration Debug \
  -destination "platform=iOS Simulator,id=$UDID" ${DERIVED_ARGS[@]+"${DERIVED_ARGS[@]}"} \
  -quiet 2>&1 | grep -E "error:|warning: no rule|BUILD" || true

echo "→ running goldens"
xcodebuild test-without-building \
  -workspace "$WORKSPACE" -scheme "$SCHEME" \
  -destination "platform=iOS Simulator,id=$UDID" ${DERIVED_ARGS[@]+"${DERIVED_ARGS[@]}"} \
  -only-testing:WireframeGoldenTests
