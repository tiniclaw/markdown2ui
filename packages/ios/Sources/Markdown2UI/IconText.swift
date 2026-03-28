import SwiftUI

// MARK: - Icon Name → SF Symbol Mapping

private let sfSymbolMap: [String: String] = [
    // Navigation & Actions
    "home": "house", "search": "magnifyingglass", "settings": "gear",
    "edit": "pencil", "delete": "trash", "add": "plus", "remove": "minus",
    "close": "xmark", "check": "checkmark", "back": "arrow.left",
    "forward": "arrow.right", "up": "arrow.up", "down": "arrow.down",
    "menu": "line.3.horizontal", "more": "ellipsis", "refresh": "arrow.clockwise",
    "share": "square.and.arrow.up", "copy": "doc.on.doc", "save": "square.and.arrow.down",
    "download": "arrow.down.circle", "upload": "arrow.up.circle",
    "link": "link", "external_link": "arrow.up.right.square",

    // Communication
    "email": "envelope", "phone": "phone", "chat": "message",
    "notification": "bell", "send": "paperplane",

    // People & Account
    "person": "person", "people": "person.2", "account": "person",
    "lock": "lock", "unlock": "lock.open", "key": "key",

    // Content
    "file": "doc", "folder": "folder", "image": "photo",
    "camera": "camera", "video": "video", "music": "music.note",
    "document": "doc.text", "code": "chevron.left.forwardslash.chevron.right",

    // Status
    "info": "info.circle", "warning": "exclamationmark.triangle",
    "error": "xmark.circle", "success": "checkmark.circle",
    "star": "star", "star_filled": "star.fill", "heart": "heart", "flag": "flag",

    // Time & Place
    "calendar": "calendar", "clock": "clock", "location": "location",
    "map": "map", "globe": "globe",

    // Commerce
    "cart": "cart", "payment": "creditcard", "money": "banknote",
    "gift": "gift", "tag": "tag", "receipt": "receipt",

    // Transport
    "car": "car", "train": "tram", "plane": "airplane",
    "bus": "bus", "bike": "bicycle", "walk": "figure.walk", "ship": "ferry",

    // Weather & Nature
    "sun": "sun.max", "moon": "moon", "cloud": "cloud", "fire": "flame",

    // Misc
    "light": "lightbulb", "dark": "moon", "wifi": "wifi", "power": "power",
]

// MARK: - Icon Extraction

private let iconNameRegex = try! NSRegularExpression(pattern: "^:([a-z][a-z0-9_]*):\\s*")

struct IconTextParts {
    var iconName: String?
    var sfSymbol: String?
    var text: String
}

func extractIcon(from text: String) -> IconTextParts {
    let range = NSRange(text.startIndex..., in: text)
    if let match = iconNameRegex.firstMatch(in: text, range: range),
       let nameRange = Range(match.range(at: 1), in: text),
       let fullRange = Range(match.range, in: text) {
        let name = String(text[nameRange])
        let rest = String(text[fullRange.upperBound...])
        return IconTextParts(iconName: name, sfSymbol: sfSymbolMap[name], text: rest)
    }
    return IconTextParts(text: text)
}

// MARK: - IconText View

@available(iOS 16.0, macOS 13.0, *)
struct IconText: View {
    let text: String
    var font: Font = .body

    var body: some View {
        let parts = extractIcon(from: text)
        HStack(spacing: 4) {
            if let symbol = parts.sfSymbol {
                Image(systemName: symbol)
                    .font(font)
                    .foregroundStyle(.secondary)
            } else if parts.iconName != nil {
                // Unresolved icon name — show nothing (graceful fallback)
            }
            Text(parts.text)
                .font(font)
        }
    }
}
