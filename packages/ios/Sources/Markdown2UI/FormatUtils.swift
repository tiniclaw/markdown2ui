import Foundation

public func formatDisplayValue(_ value: Double, format: FormatAnnotation?, locale: Locale = .current) -> String {
    guard let format = format else {
        return NumberFormatter.localizedString(from: NSNumber(value: value), number: .decimal)
    }

    switch format {
    case .currency(let code):
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = code
        formatter.locale = locale
        return formatter.string(from: NSNumber(value: value)) ?? "\(value)"

    case .unit(let unit, let plural):
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.locale = locale
        let numStr = formatter.string(from: NSNumber(value: value)) ?? "\(value)"
        let unitLabel: String
        if value == 1 {
            unitLabel = unit
        } else {
            unitLabel = plural ?? "\(unit)s"
        }
        return "\(numStr) \(unitLabel)"

    case .percent:
        let formatter = NumberFormatter()
        formatter.numberStyle = .percent
        formatter.locale = locale
        formatter.multiplier = 1
        return formatter.string(from: NSNumber(value: value)) ?? "\(value)%"

    case .integer:
        let formatter = NumberFormatter()
        formatter.numberStyle = .none
        formatter.locale = locale
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: value)) ?? "\(Int(value))"

    case .decimal(let places):
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.locale = locale
        formatter.minimumFractionDigits = places
        formatter.maximumFractionDigits = places
        return formatter.string(from: NSNumber(value: value)) ?? String(format: "%.\(places)f", value)
    }
}
