// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "Markdown2UI",
    platforms: [.iOS(.v16), .macOS(.v13)],
    products: [
        .library(name: "Markdown2UI", targets: ["Markdown2UI"]),
    ],
    targets: [
        .target(name: "Markdown2UI"),
    ]
)
