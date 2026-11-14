// Compiled with dist/apple/OuroTokens.swift by scripts/apple-check.sh: named tokens resolve to the
// colours and numbers web's CSS gives them.
import AppKit
import SwiftUI

var failures = 0

func hex(_ color: Color) -> String {
    let c = NSColor(color).usingColorSpace(.extendedSRGB)!
    let byte = { (x: CGFloat) in Int((min(1, max(0, x)) * 255).rounded()) }
    return String(format: "#%02x%02x%02x", byte(c.redComponent), byte(c.greenComponent), byte(c.blueComponent))
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
expect(hex(OuroTokens.theme(.abyss).light.primary), "#007283", "abyss light primary, oklch(0.5 0.1 210) in Display P3, clipped to sRGB")
expect(String(OuroTokens.theme(.pearl).radius), "18.0", "pearl radius in points (1.125rem, web's radii raised about 1.5 times for squircles)")
expect(String(OuroTokens.Duration.fast), "0.15", "duration fast in seconds")
expect(String(OuroTokens.Press.scale), "0.97", "press scale")
expect(String(OuroTokens.Ease.out.x1), "0.23", "ease out x1")
expect(String(OuroThemeName.allCases.count), "6", "theme count")

// A theme's own tokens (Cookbook's sj-*), resolved like web's CSS.
let cookbook = OuroTokens.theme(.cookbook).extras
expect(hex(cookbook.color(.sjBrass, .light)!), "#9b6834", "cookbook extra sjBrass (light)")
expect(hex(cookbook.color(.sjPhotoCharcoal, .dark)!), "#1d1915", "cookbook extra sjPhotoCharcoal (dark)")
expect(String(format: "%.2f", NSColor(cookbook.color(.sjBorder, .light)!).alphaComponent), "0.18", "cookbook extra sjBorder alpha, color-mix(in srgb, var(--sj-charcoal) 18%, transparent)")
expect(cookbook.fonts[.sjDisplay]!.first!, "Fraunces", "cookbook font sjDisplay")
expect(String(cookbook.lengths[.sjMarginFold]!), "40.0", "cookbook sjMarginFold in points")
let eyebrow = cookbook.type[.sjTypeEyebrow]!
expect("\(eyebrow.family) \(eyebrow.weight) \(eyebrow.size) \(eyebrow.textStyle)", "sjUi 700 11.52 caption", "cookbook eyebrow role")
expect("\(cookbook.shadows[.sjShadowSoft]!.layer(.light).radius)", "18.0", "cookbook sjShadowSoft radius, half web's 36px blur")
expect(String(OuroTokens.theme(.pearl).extras.light.count), "0", "pearl has no extras")

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all Swift token checks passed")
