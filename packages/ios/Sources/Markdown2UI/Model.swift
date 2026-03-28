import Foundation

// MARK: - AST Root

public struct Ast: Codable {
    public let version: String
    public let blocks: [Block]

    public init(version: String, blocks: [Block]) {
        self.version = version
        self.blocks = blocks
    }
}

// MARK: - AnyCodable

public struct AnyCodable: Codable {
    public let value: Any

    public init(_ value: Any) {
        self.value = value
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            value = NSNull()
        } else if let bool = try? container.decode(Bool.self) {
            value = bool
        } else if let int = try? container.decode(Int.self) {
            value = int
        } else if let double = try? container.decode(Double.self) {
            value = double
        } else if let string = try? container.decode(String.self) {
            value = string
        } else if let array = try? container.decode([AnyCodable].self) {
            value = array.map(\.value)
        } else if let dict = try? container.decode([String: AnyCodable].self) {
            value = dict.mapValues(\.value)
        } else {
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unsupported type")
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch value {
        case is NSNull:
            try container.encodeNil()
        case let bool as Bool:
            try container.encode(bool)
        case let int as Int:
            try container.encode(int)
        case let double as Double:
            try container.encode(double)
        case let string as String:
            try container.encode(string)
        case let array as [Any]:
            try container.encode(array.map { AnyCodable($0) })
        case let dict as [String: Any]:
            try container.encode(dict.mapValues { AnyCodable($0) })
        default:
            try container.encodeNil()
        }
    }
}

// MARK: - FormatAnnotation

public enum FormatAnnotation: Codable, Equatable {
    case currency(code: String)
    case unit(unit: String, plural: String?)
    case percent
    case integer
    case decimal(places: Int)

    private enum CodingKeys: String, CodingKey {
        case type, code, unit, plural, places
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)
        switch type {
        case "currency":
            let code = try container.decode(String.self, forKey: .code)
            self = .currency(code: code)
        case "unit":
            let unit = try container.decode(String.self, forKey: .unit)
            let plural = try container.decodeIfPresent(String.self, forKey: .plural)
            self = .unit(unit: unit, plural: plural)
        case "percent":
            self = .percent
        case "integer":
            self = .integer
        case "decimal":
            let places = try container.decode(Int.self, forKey: .places)
            self = .decimal(places: places)
        default:
            throw DecodingError.dataCorruptedError(forKey: .type, in: container, debugDescription: "Unknown format type: \(type)")
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        switch self {
        case .currency(let code):
            try container.encode("currency", forKey: .type)
            try container.encode(code, forKey: .code)
        case .unit(let unit, let plural):
            try container.encode("unit", forKey: .type)
            try container.encode(unit, forKey: .unit)
            try container.encodeIfPresent(plural, forKey: .plural)
        case .percent:
            try container.encode("percent", forKey: .type)
        case .integer:
            try container.encode("integer", forKey: .type)
        case .decimal(let places):
            try container.encode("decimal", forKey: .type)
            try container.encode(places, forKey: .places)
        }
    }
}

// MARK: - TypedInputFormat

public enum TypedInputFormat: String, Codable {
    case email, tel, url, number, password, color
}

// MARK: - Options

public struct SingleSelectOption: Codable, Equatable {
    public let text: String
    public let `default`: Bool
    public let image: String?

    public init(text: String, default: Bool, image: String? = nil) {
        self.text = text
        self.default = `default`
        self.image = image
    }
}

public struct MultiSelectOption: Codable, Equatable {
    public let text: String
    public let selected: Bool
    public let image: String?

    public init(text: String, selected: Bool, image: String? = nil) {
        self.text = text
        self.selected = selected
        self.image = image
    }
}

// MARK: - Block Data Structs

public struct SingleSelectBlock: Codable {
    public let id: String?
    public let required: Bool?
    public let hint: String?
    public let label: String
    public let options: [SingleSelectOption]
}

public struct MultiSelectBlock: Codable {
    public let id: String?
    public let required: Bool?
    public let hint: String?
    public let label: String
    public let options: [MultiSelectOption]
}

public struct SequenceBlock: Codable {
    public let id: String?
    public let required: Bool?
    public let hint: String?
    public let label: String
    public let items: [String]
}

public struct ConfirmationBlock: Codable {
    public let id: String?
    public let required: Bool?
    public let hint: String?
    public let label: String
    public let yesLabel: String
    public let noLabel: String
}

public struct TextInputBlock: Codable {
    public let id: String?
    public let required: Bool?
    public let hint: String?
    public let label: String
    public let multiline: Bool
    public let placeholder: String?
    public let prefill: String?
}

public struct TypedInputBlock: Codable {
    public let id: String?
    public let required: Bool?
    public let hint: String?
    public let label: String
    public let format: TypedInputFormat
    public let placeholder: String?
    public let prefill: String?
    public let displayFormat: FormatAnnotation?
}

public struct SliderBlock: Codable {
    public let id: String?
    public let required: Bool?
    public let hint: String?
    public let label: String
    public let min: Double
    public let max: Double
    public let `default`: Double
    public let step: Double?
    public let displayFormat: FormatAnnotation?
}

public struct DateBlock: Codable {
    public let id: String?
    public let required: Bool?
    public let hint: String?
    public let label: String
    public let `default`: String
}

public struct TimeBlock: Codable {
    public let id: String?
    public let required: Bool?
    public let hint: String?
    public let label: String
    public let `default`: String
}

public struct DatetimeBlock: Codable {
    public let id: String?
    public let required: Bool?
    public let hint: String?
    public let label: String
    public let `default`: String
}

public struct FileUploadBlock: Codable {
    public let id: String?
    public let required: Bool?
    public let hint: String?
    public let label: String
    public let extensions: [String]?
}

public struct ImageUploadBlock: Codable {
    public let id: String?
    public let required: Bool?
    public let hint: String?
    public let label: String
}

public struct HeaderBlock: Codable {
    public let level: Int
    public let text: String
}

public struct HintBlock: Codable {
    public let text: String
}

public struct ProseBlock: Codable {
    public let text: String
}

public struct GroupBlock: Codable {
    public let name: String?
    public let children: [Block]
}

// MARK: - Block Enum

public enum Block: Codable {
    case singleSelect(SingleSelectBlock)
    case multiSelect(MultiSelectBlock)
    case sequence(SequenceBlock)
    case confirmation(ConfirmationBlock)
    case textInput(TextInputBlock)
    case typedInput(TypedInputBlock)
    case slider(SliderBlock)
    case date(DateBlock)
    case time(TimeBlock)
    case datetime(DatetimeBlock)
    case fileUpload(FileUploadBlock)
    case imageUpload(ImageUploadBlock)
    case header(HeaderBlock)
    case hint(HintBlock)
    case divider
    case prose(ProseBlock)
    case group(GroupBlock)

    private enum CodingKeys: String, CodingKey {
        case type
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)

        let singleContainer = try decoder.singleValueContainer()

        switch type {
        case "single-select":
            self = .singleSelect(try singleContainer.decode(SingleSelectBlock.self))
        case "multi-select":
            self = .multiSelect(try singleContainer.decode(MultiSelectBlock.self))
        case "sequence":
            self = .sequence(try singleContainer.decode(SequenceBlock.self))
        case "confirmation":
            self = .confirmation(try singleContainer.decode(ConfirmationBlock.self))
        case "text-input":
            self = .textInput(try singleContainer.decode(TextInputBlock.self))
        case "typed-input":
            self = .typedInput(try singleContainer.decode(TypedInputBlock.self))
        case "slider":
            self = .slider(try singleContainer.decode(SliderBlock.self))
        case "date":
            self = .date(try singleContainer.decode(DateBlock.self))
        case "time":
            self = .time(try singleContainer.decode(TimeBlock.self))
        case "datetime":
            self = .datetime(try singleContainer.decode(DatetimeBlock.self))
        case "file-upload":
            self = .fileUpload(try singleContainer.decode(FileUploadBlock.self))
        case "image-upload":
            self = .imageUpload(try singleContainer.decode(ImageUploadBlock.self))
        case "header":
            self = .header(try singleContainer.decode(HeaderBlock.self))
        case "hint":
            self = .hint(try singleContainer.decode(HintBlock.self))
        case "divider":
            self = .divider
        case "prose":
            self = .prose(try singleContainer.decode(ProseBlock.self))
        case "group":
            self = .group(try singleContainer.decode(GroupBlock.self))
        default:
            throw DecodingError.dataCorruptedError(forKey: .type, in: container, debugDescription: "Unknown block type: \(type)")
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        switch self {
        case .singleSelect(let block):
            try container.encode("single-select", forKey: .type)
            try block.encode(to: encoder)
        case .multiSelect(let block):
            try container.encode("multi-select", forKey: .type)
            try block.encode(to: encoder)
        case .sequence(let block):
            try container.encode("sequence", forKey: .type)
            try block.encode(to: encoder)
        case .confirmation(let block):
            try container.encode("confirmation", forKey: .type)
            try block.encode(to: encoder)
        case .textInput(let block):
            try container.encode("text-input", forKey: .type)
            try block.encode(to: encoder)
        case .typedInput(let block):
            try container.encode("typed-input", forKey: .type)
            try block.encode(to: encoder)
        case .slider(let block):
            try container.encode("slider", forKey: .type)
            try block.encode(to: encoder)
        case .date(let block):
            try container.encode("date", forKey: .type)
            try block.encode(to: encoder)
        case .time(let block):
            try container.encode("time", forKey: .type)
            try block.encode(to: encoder)
        case .datetime(let block):
            try container.encode("datetime", forKey: .type)
            try block.encode(to: encoder)
        case .fileUpload(let block):
            try container.encode("file-upload", forKey: .type)
            try block.encode(to: encoder)
        case .imageUpload(let block):
            try container.encode("image-upload", forKey: .type)
            try block.encode(to: encoder)
        case .header(let block):
            try container.encode("header", forKey: .type)
            try block.encode(to: encoder)
        case .hint(let block):
            try container.encode("hint", forKey: .type)
            try block.encode(to: encoder)
        case .divider:
            try container.encode("divider", forKey: .type)
        case .prose(let block):
            try container.encode("prose", forKey: .type)
            try block.encode(to: encoder)
        case .group(let block):
            try container.encode("group", forKey: .type)
            try block.encode(to: encoder)
        }
    }
}
