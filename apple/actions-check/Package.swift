// swift-tools-version: 6.0
// Builds the shopping fixture's generated Swift (OuroActions.swift and OuroActionsReins.swift) against OuroReins
// from a pinned ouro-ui-apple release, then runs checks on it. scripts/apple-check.sh copies the generated files
// into Sources/ActionsCheck/Generated first.
import PackageDescription

let package = Package(
    name: "actions-check",
    platforms: [.macOS(.v15)],
    dependencies: [.package(url: "https://github.com/ourostack/ouro-ui-apple.git", exact: "0.4.1")],
    targets: [
        .executableTarget(
            name: "ActionsCheck",
            dependencies: [.product(name: "OuroReins", package: "ouro-ui-apple")]
        ),
    ]
)
