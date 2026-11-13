#!/bin/sh
# Type-checks dist/apple/OuroTokens.swift in Swift 6 mode, then compiles it with
# apple/check/main.swift and runs that: named tokens must resolve to web's values. macOS only.
set -eu
cd "$(dirname "$0")/.."
swiftc -typecheck -swift-version 6 dist/apple/OuroTokens.swift
echo "ok    swiftc -typecheck -swift-version 6 dist/apple/OuroTokens.swift"
mkdir -p apple/check/.build
swiftc -swift-version 6 dist/apple/OuroTokens.swift apple/check/main.swift -o apple/check/.build/ouro-tokens-check
apple/check/.build/ouro-tokens-check

# The one action model: build the shopping fixture's generated Swift (App Intents, Button(intent:), Reins) against
# OuroReins from a pinned ouro-ui-apple release, and run its checks (apple/actions-check).
mkdir -p apple/actions-check/Sources/ActionsCheck/Generated
cp test/fixtures/actions/generated/OuroActions.swift test/fixtures/actions/generated/OuroActionsReins.swift apple/actions-check/Sources/ActionsCheck/Generated/
(cd apple/actions-check && swift run -q ActionsCheck)
