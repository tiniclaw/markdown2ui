// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "Markdown2UISample",
    platforms: [.iOS(.v17), .macOS(.v14)],
    dependencies: [
        .package(path: "../../packages/ios"),
    ],
    targets: [
        .executableTarget(
            name: "Markdown2UISample",
            dependencies: [.product(name: "Markdown2UI", package: "ios")]
        ),
    ]
)
