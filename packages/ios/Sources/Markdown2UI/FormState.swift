import Foundation
import SwiftUI

// MARK: - FormState

@available(iOS 17.0, macOS 14.0, *)
@Observable
public class FormState {
    public var values: [String: AnyCodable] = [:]
    public var errors: [String: String] = [:]

    public init() {}

    public func getValue<T>(_ id: String) -> T? {
        values[id]?.value as? T
    }

    public func setValue(_ id: String, _ value: Any?) {
        if let value = value {
            values[id] = AnyCodable(value)
        } else {
            values.removeValue(forKey: id)
        }
    }

    public func initializeDefaults(_ blocks: [Block]) {
        for block in blocks {
            initializeBlock(block)
        }
    }

    private func initializeBlock(_ block: Block) {
        switch block {
        case .singleSelect(let b):
            guard let id = b.id else { return }
            if values[id] == nil {
                if let defaultOption = b.options.first(where: { $0.default }) {
                    setValue(id, defaultOption.text)
                }
            }

        case .multiSelect(let b):
            guard let id = b.id else { return }
            if values[id] == nil {
                let selected = b.options.filter(\.selected).map(\.text)
                setValue(id, selected)
            }

        case .sequence(let b):
            guard let id = b.id else { return }
            if values[id] == nil {
                setValue(id, b.items)
            }

        case .confirmation(let b):
            guard let id = b.id else { return }
            if values[id] == nil {
                setValue(id, false)
            }

        case .textInput(let b):
            guard let id = b.id else { return }
            if values[id] == nil {
                setValue(id, b.prefill ?? "")
            }

        case .typedInput(let b):
            guard let id = b.id else { return }
            if values[id] == nil {
                setValue(id, b.prefill ?? "")
            }

        case .slider(let b):
            guard let id = b.id else { return }
            if values[id] == nil {
                setValue(id, b.default)
            }

        case .date(let b):
            guard let id = b.id else { return }
            if values[id] == nil {
                let val = b.default == "NOW" ? Self.todayString() : b.default
                setValue(id, val)
            }

        case .time(let b):
            guard let id = b.id else { return }
            if values[id] == nil {
                let val = b.default == "NOW" ? Self.nowTimeString() : b.default
                setValue(id, val)
            }

        case .datetime(let b):
            guard let id = b.id else { return }
            if values[id] == nil {
                let val = b.default == "NOW" ? Self.nowDatetimeString() : b.default
                setValue(id, val)
            }

        case .fileUpload(let b):
            guard let id = b.id else { return }
            if values[id] == nil {
                setValue(id, nil as String?)
            }

        case .imageUpload(let b):
            guard let id = b.id else { return }
            if values[id] == nil {
                setValue(id, nil as String?)
            }

        case .group(let b):
            for child in b.children {
                initializeBlock(child)
            }

        case .header, .hint, .divider, .prose:
            break
        }
    }

    /// Validates all required fields and populates `errors`. Returns `true` if valid.
    @discardableResult
    public func validate(_ blocks: [Block]) -> Bool {
        errors = [:]
        validateBlocks(blocks)
        return errors.isEmpty
    }

    private func validateBlocks(_ blocks: [Block]) {
        for block in blocks {
            switch block {
            case .textInput(let b):
                guard b.required == true, let id = b.id else { continue }
                let val: String = getValue(id) ?? ""
                if val.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    errors[id] = "\(b.label) is required"
                }

            case .typedInput(let b):
                guard let id = b.id else { continue }
                let val: String = getValue(id) ?? ""
                if b.required == true && val.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    errors[id] = "\(b.label) is required"
                } else if !val.isEmpty {
                    // Format validation
                    switch b.format {
                    case .email:
                        if !val.contains("@") || !val.contains(".") {
                            errors[id] = "Enter a valid email address"
                        }
                    case .url:
                        if !val.hasPrefix("http://") && !val.hasPrefix("https://") && !val.contains(".") {
                            errors[id] = "Enter a valid URL"
                        }
                    case .tel:
                        let digits = val.filter { $0.isNumber || $0 == "+" || $0 == "-" }
                        if digits.count < 7 {
                            errors[id] = "Enter a valid phone number"
                        }
                    default:
                        break
                    }
                }

            case .multiSelect(let b):
                guard b.required == true, let id = b.id else { continue }
                let val: [String] = getValue(id) ?? []
                if val.isEmpty {
                    errors[id] = "\(b.label) requires at least one selection"
                }

            case .singleSelect(let b):
                guard b.required == true, let id = b.id else { continue }
                let val: String = getValue(id) ?? ""
                if val.isEmpty {
                    errors[id] = "\(b.label) is required"
                }

            case .date(let b):
                guard b.required == true, let id = b.id else { continue }
                let val: String = getValue(id) ?? ""
                if val.isEmpty {
                    errors[id] = "\(b.label) is required"
                }

            case .time(let b):
                guard b.required == true, let id = b.id else { continue }
                let val: String = getValue(id) ?? ""
                if val.isEmpty {
                    errors[id] = "\(b.label) is required"
                }

            case .datetime(let b):
                guard b.required == true, let id = b.id else { continue }
                let val: String = getValue(id) ?? ""
                if val.isEmpty {
                    errors[id] = "\(b.label) is required"
                }

            case .fileUpload(let b):
                guard b.required == true, let id = b.id else { continue }
                let val: String? = getValue(id)
                if val == nil || val!.isEmpty {
                    errors[id] = "\(b.label) is required"
                }

            case .imageUpload(let b):
                guard b.required == true, let id = b.id else { continue }
                let val: String? = getValue(id)
                if val == nil || val!.isEmpty {
                    errors[id] = "\(b.label) is required"
                }

            case .group(let b):
                validateBlocks(b.children)

            case .sequence, .confirmation, .slider, .header, .hint, .divider, .prose:
                break
            }
        }
    }

    public func serializeCompact(_ blocks: [Block]) -> String {
        var result: [String: Any] = [:]
        collectValues(blocks, into: &result)
        if let data = try? JSONSerialization.data(withJSONObject: result, options: [.sortedKeys]),
           let json = String(data: data, encoding: .utf8) {
            return json
        }
        return "{}"
    }

    private static func todayString() -> String {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; return f.string(from: Date())
    }
    private static func nowTimeString() -> String {
        let f = DateFormatter(); f.dateFormat = "HH:mm"; return f.string(from: Date())
    }
    private static func nowDatetimeString() -> String {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd'T'HH:mm"; return f.string(from: Date())
    }

    private func collectValues(_ blocks: [Block], into result: inout [String: Any]) {
        for block in blocks {
            switch block {
            case .singleSelect(let b):
                if let id = b.id, let v = values[id] { result[id] = v.value }
            case .multiSelect(let b):
                if let id = b.id, let v = values[id] { result[id] = v.value }
            case .sequence(let b):
                if let id = b.id, let v = values[id] { result[id] = v.value }
            case .confirmation(let b):
                if let id = b.id, let v = values[id] { result[id] = v.value }
            case .textInput(let b):
                if let id = b.id, let v = values[id] { result[id] = v.value }
            case .typedInput(let b):
                if let id = b.id, let v = values[id] { result[id] = v.value }
            case .slider(let b):
                if let id = b.id, let v = values[id] { result[id] = v.value }
            case .date(let b):
                if let id = b.id, let v = values[id] { result[id] = v.value }
            case .time(let b):
                if let id = b.id, let v = values[id] { result[id] = v.value }
            case .datetime(let b):
                if let id = b.id, let v = values[id] { result[id] = v.value }
            case .fileUpload(let b):
                if let id = b.id, let v = values[id] { result[id] = v.value }
            case .imageUpload(let b):
                if let id = b.id, let v = values[id] { result[id] = v.value }
            case .group(let b):
                collectValues(b.children, into: &result)
            case .header, .hint, .divider, .prose:
                break
            }
        }
    }
}
