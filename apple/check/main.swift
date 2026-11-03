// Compiled with dist/apple/OuroTokens.swift by scripts/apple-check.sh: named tokens resolve to the
// colours and numbers web's CSS gives them.
import AppKit
import SwiftUI

var failures = 0

func hex(_ color: Color) -> String {
    let c = NSColor(color).usingColorSpace(.sRGB)!
    return String(format: "#%02x%02x%02x", Int((c.redComponent * 255).rounded()), Int((c.greenComponent * 255).rounded()), Int((c.blueComponent * 255).rounded()))
}

@MainActor func expect(_ actual: String, _ expected: String, _ what: String) {
    if actual == expected { print("ok    \(what) = \(actual)") } else { print("FAIL  \(what) = \(actual), expected \(expected)"); failures += 1 }
}

let pearl = OuroTokens.theme(.pearl)
expect(hex(pearl.light.primary), "#0066cc", "pearl light primary")
expect(hex(pearl.dark.primary), "#2997ff", "pearl dark primary")
expect(hex(pearl.colors(.dark).background), "#000000", "pearl dark background")
expect(hex(OuroTokens.theme(.cookbook).light.background), "#fbfaf4", "cookbook light background (var(--sj-paper), then var(--sj-bone))")
expect(hex(OuroTokens.theme(.cookbook).dark.background), "#1f1d1a", "cookbook dark background (var(--sj-paper), then var(--sj-charcoal))")
expect(String(OuroTokens.theme(.pearl).radius), "12.0", "pearl radius in points (0.75rem)")
expect(String(OuroTokens.Duration.fast), "0.15", "duration fast in seconds")
expect(String(OuroTokens.Press.scale), "0.97", "press scale")
expect(String(OuroTokens.Ease.out.x1), "0.23", "ease out x1")
expect(String(OuroThemeName.allCases.count), "6", "theme count")

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all Swift token checks passed")
