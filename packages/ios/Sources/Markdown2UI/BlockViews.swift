import SwiftUI
import PhotosUI
import UniformTypeIdentifiers

// MARK: - Image Option Grid

private struct ImageOption: Identifiable {
    let text: String
    let image: String?
    var id: String { text }
}

@available(iOS 17.0, macOS 14.0, *)
struct ImageOptionGrid: View {
    let options: [(text: String, image: String?)]
    let selected: [String]
    let onTap: (String) -> Void

    private var items: [ImageOption] {
        options.map { ImageOption(text: $0.text, image: $0.image) }
    }

    private let columns = [
        GridItem(.adaptive(minimum: 140), spacing: 10)
    ]

    var body: some View {
        LazyVGrid(columns: columns, spacing: 10) {
            ForEach(Array(items.enumerated()), id: \.element.id) { _, option in
                let isSelected = selected.contains(option.text)
                Button { onTap(option.text) } label: {
                    VStack(spacing: 0) {
                        if let urlString = option.image, let url = URL(string: urlString) {
                            AsyncImage(url: url) { phase in
                                switch phase {
                                case .success(let img):
                                    img.resizable()
                                        .aspectRatio(4/3, contentMode: .fill)
                                        .clipped()
                                case .failure:
                                    Color.gray.opacity(0.2)
                                        .aspectRatio(4/3, contentMode: .fill)
                                        .overlay { Image(systemName: "photo").foregroundStyle(.secondary) }
                                default:
                                    Color.gray.opacity(0.1)
                                        .aspectRatio(4/3, contentMode: .fill)
                                        .overlay { ProgressView() }
                                }
                            }
                        }
                        Text(option.text)
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 8)
                            .foregroundStyle(.primary)
                    }
                    .background(.background)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(isSelected ? Color.accentColor : Color.gray.opacity(0.3), lineWidth: isSelected ? 2 : 1)
                    )
                }
                .buttonStyle(.plain)
            }
        }
    }
}

// MARK: - Adaptive Select (measure ideal width, pick layout)

@available(iOS 17.0, macOS 14.0, *)
private struct AdaptiveSelect<S: View, F: View>: View {
    let segmented: S
    let fallback: F

    @State private var idealWidth: CGFloat = 0
    @State private var availableWidth: CGFloat = CGFloat.infinity

    private var fits: Bool { idealWidth > 0 && idealWidth <= availableWidth }

    var body: some View {
        ZStack {
            // Hidden: measure ideal (unconstrained) width of segmented picker
            segmented
                .fixedSize(horizontal: true, vertical: false)
                .opacity(0)
                .frame(height: 0)
                .overlay(GeometryReader { geo in
                    Color.clear.onAppear { idealWidth = geo.size.width }
                        .onChange(of: geo.size.width) { idealWidth = geo.size.width }
                })

            // Measure available width
            Color.clear
                .frame(height: 0)
                .overlay(GeometryReader { geo in
                    Color.clear.onAppear { availableWidth = geo.size.width }
                        .onChange(of: geo.size.width) { availableWidth = geo.size.width }
                })
        }
        .frame(height: 0)

        if fits {
            segmented // Full-width (natural layout, not fixedSize)
        } else {
            fallback
        }
    }
}

// MARK: - Grouped Select List

@available(iOS 17.0, macOS 14.0, *)
private struct GroupedSelectRow: View {
    let text: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                IconText(text: text)
                    .foregroundStyle(.primary)
                Spacer()
                if isSelected {
                    Image(systemName: "checkmark")
                        .foregroundStyle(Color.accentColor)
                        .fontWeight(.semibold)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(isSelected ? Color.accentColor.opacity(0.12) : .clear)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

@available(iOS 17.0, macOS 14.0, *)
struct GroupedSelectList: View {
    let options: [String]
    let selected: String
    let onTap: (String) -> Void

    var body: some View {
        VStack(spacing: 0) {
            ForEach(Array(options.enumerated()), id: \.element) { index, option in
                GroupedSelectRow(
                    text: option,
                    isSelected: option == selected,
                    action: { onTap(option) }
                )
                if index < options.count - 1 {
                    Divider().padding(.leading, 14)
                }
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.gray.opacity(0.3), lineWidth: 1)
        )
    }
}

// MARK: - BlockView Router

@available(iOS 17.0, macOS 14.0, *)
struct BlockView: View {
    let block: Block
    let formState: FormState
    var onSubmit: (() -> Void)? = nil

    var body: some View {
        switch block {
        case .singleSelect(let b):
            SingleSelectView(block: b, formState: formState)
        case .multiSelect(let b):
            MultiSelectView(block: b, formState: formState)
        case .sequence(let b):
            SequenceView(block: b, formState: formState)
        case .confirmation(let b):
            ConfirmationView(block: b, formState: formState, onSubmit: onSubmit)
        case .textInput(let b):
            TextInputView(block: b, formState: formState)
        case .typedInput(let b):
            TypedInputView(block: b, formState: formState)
        case .slider(let b):
            SliderView(block: b, formState: formState)
        case .date(let b):
            DateView(block: b, formState: formState)
        case .time(let b):
            TimeView(block: b, formState: formState)
        case .datetime(let b):
            DatetimeView(block: b, formState: formState)
        case .fileUpload(let b):
            FileUploadView(block: b, formState: formState)
        case .imageUpload(let b):
            ImageUploadView(block: b, formState: formState)
        case .header(let b):
            HeaderView(block: b)
        case .hint(let b):
            HintView(block: b)
        case .divider:
            Divider()
        case .prose(let b):
            ProseView(block: b)
        case .group(let b):
            GroupView(block: b, formState: formState)
        }
    }
}

// MARK: - Label + Hint Helper

@available(iOS 17.0, macOS 14.0, *)
private struct FieldLabel: View {
    let label: String
    let required: Bool?
    let hint: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(spacing: 2) {
                IconText(text: label, font: .subheadline)
                    .fontWeight(.medium)
                if required == true {
                    Text("*")
                        .foregroundStyle(.red)
                        .font(.subheadline)
                }
            }
            if let hint = hint {
                Text(hint)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

// MARK: - SingleSelect

@available(iOS 17.0, macOS 14.0, *)
struct SingleSelectView: View {
    let block: SingleSelectBlock
    let formState: FormState

    private var selectedValue: String {
        formState.getValue(block.id ?? "") ?? ""
    }

    private var hasImages: Bool {
        block.options.contains { $0.image != nil }
    }

    private var segmentedPicker: some View {
        Picker(block.label, selection: Binding(
            get: { selectedValue },
            set: { formState.setValue(block.id ?? "", $0) }
        )) {
            ForEach(block.options, id: \.text) { option in
                let parts = extractIcon(from: option.text)
                Text(parts.text).tag(option.text)
            }
        }
        .pickerStyle(.segmented)
        .labelsHidden()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            FieldLabel(label: block.label, required: block.required, hint: block.hint)

            if hasImages {
                ImageOptionGrid(
                    options: block.options.map { ($0.text, $0.image) },
                    selected: [selectedValue],
                    onTap: { formState.setValue(block.id ?? "", $0) }
                )
            } else {
                let groupedList = GroupedSelectList(
                    options: block.options.map { $0.text },
                    selected: selectedValue,
                    onTap: { formState.setValue(block.id ?? "", $0) }
                )

                AdaptiveSelect(segmented: segmentedPicker, fallback: groupedList)
            }

            if let error = formState.errors[block.id ?? ""] {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
            }
        }
    }
}

// MARK: - MultiSelect

@available(iOS 17.0, macOS 14.0, *)
struct MultiSelectView: View {
    let block: MultiSelectBlock
    let formState: FormState

    private var selectedItems: [String] {
        formState.getValue(block.id ?? "") ?? []
    }

    private var hasImages: Bool {
        block.options.contains { $0.image != nil }
    }

    private func isSelected(_ text: String) -> Bool {
        selectedItems.contains(text)
    }

    private func toggle(_ text: String) {
        var current = selectedItems
        if let idx = current.firstIndex(of: text) {
            current.remove(at: idx)
        } else {
            current.append(text)
        }
        formState.setValue(block.id ?? "", current)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            FieldLabel(label: block.label, required: block.required, hint: block.hint)

            if hasImages {
                ImageOptionGrid(
                    options: block.options.map { ($0.text, $0.image) },
                    selected: selectedItems,
                    onTap: { toggle($0) }
                )
            } else {
                VStack(spacing: 0) {
                    ForEach(block.options, id: \.text) { option in
                        HStack {
                            IconText(text: option.text)
                            Spacer()
                            Toggle("", isOn: Binding(
                                get: { isSelected(option.text) },
                                set: { _ in toggle(option.text) }
                            ))
                            .labelsHidden()
                        }
                        .padding(.vertical, 4)
                        .padding(.horizontal, 4)
                        if option.text != block.options.last?.text {
                            Divider()
                        }
                    }
                }
            }

            if let error = formState.errors[block.id ?? ""] {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
            }
        }
    }
}

// MARK: - Sequence

@available(iOS 17.0, macOS 14.0, *)
struct SequenceView: View {
    let block: SequenceBlock
    let formState: FormState

    private var items: [String] {
        formState.getValue(block.id ?? "") ?? block.items
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            FieldLabel(label: block.label, required: block.required, hint: block.hint)

            SequenceListContent(items: items, onMove: { from, to in
                var current = items
                current.move(fromOffsets: from, toOffset: to)
                formState.setValue(block.id ?? "", current)
            }, moveItem: { index, direction in
                moveItem(at: index, direction: direction)
            }, itemCount: items.count)

            if let error = formState.errors[block.id ?? ""] {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
            }
        }
    }

    private func moveItem(at index: Int, direction: Int) {
        var current = items
        let newIndex = index + direction
        guard newIndex >= 0, newIndex < current.count else { return }
        current.swapAt(index, newIndex)
        formState.setValue(block.id ?? "", current)
    }
}

// MARK: - SequenceListContent (platform-aware drag support)

@available(iOS 17.0, macOS 14.0, *)
private struct SequenceListContent: View {
    let items: [String]
    let onMove: (IndexSet, Int) -> Void
    let moveItem: (Int, Int) -> Void
    let itemCount: Int

    var body: some View {
        List {
            ForEach(Array(items.enumerated()), id: \.offset) { index, item in
                HStack {
                    Text(item)
                    Spacer()
                    VStack(spacing: 4) {
                        Button {
                            moveItem(index, -1)
                        } label: {
                            Image(systemName: "chevron.up")
                                .font(.caption)
                        }
                        .disabled(index == 0)
                        Button {
                            moveItem(index, 1)
                        } label: {
                            Image(systemName: "chevron.down")
                                .font(.caption)
                        }
                        .disabled(index == itemCount - 1)
                    }
                    .buttonStyle(.borderless)
                }
            }
            .onMove(perform: onMove)
        }
        #if os(iOS)
        .environment(\.editMode, .constant(.active))
        #endif
        .frame(minHeight: CGFloat(itemCount * 44 + 16))
        .listStyle(.plain)
    }
}

// MARK: - Confirmation

@available(iOS 17.0, macOS 14.0, *)
struct ConfirmationView: View {
    let block: ConfirmationBlock
    let formState: FormState
    var onSubmit: (() -> Void)? = nil

    private var confirmed: Bool {
        formState.getValue(block.id ?? "") ?? false
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            FieldLabel(label: block.label, required: block.required, hint: block.hint)

            let noButton = Button { formState.setValue(block.id ?? "", false) } label: {
                IconText(text: block.noLabel)
            }
            let yesButton = Button { formState.setValue(block.id ?? "", true); onSubmit?() } label: {
                IconText(text: block.yesLabel)
            }

            ViewThatFits(in: .horizontal) {
                HStack(spacing: 12) {
                    if confirmed {
                        noButton.buttonStyle(.bordered)
                        yesButton.buttonStyle(.borderedProminent)
                    } else {
                        noButton.buttonStyle(.borderedProminent)
                        yesButton.buttonStyle(.bordered)
                    }
                }
                VStack(spacing: 8) {
                    if confirmed {
                        noButton.buttonStyle(.bordered)
                        yesButton.buttonStyle(.borderedProminent)
                    } else {
                        noButton.buttonStyle(.borderedProminent)
                        yesButton.buttonStyle(.bordered)
                    }
                }
            }
        }
    }
}

// MARK: - TextInput

@available(iOS 17.0, macOS 14.0, *)
struct TextInputView: View {
    let block: TextInputBlock
    let formState: FormState

    private var text: Binding<String> {
        Binding(
            get: { formState.getValue(block.id ?? "") ?? "" },
            set: { formState.setValue(block.id ?? "", $0) }
        )
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            FieldLabel(label: block.label, required: block.required, hint: block.hint)

            if block.multiline {
                TextEditor(text: text)
                    .frame(minHeight: 80)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color.secondary.opacity(0.3), lineWidth: 1)
                    )
            } else {
                TextField(block.placeholder ?? "", text: text)
                    .textFieldStyle(.roundedBorder)
            }

            if let error = formState.errors[block.id ?? ""] {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
            }
        }
    }
}

// MARK: - TypedInput

@available(iOS 17.0, macOS 14.0, *)
struct TypedInputView: View {
    let block: TypedInputBlock
    let formState: FormState

    private var text: Binding<String> {
        Binding(
            get: { formState.getValue(block.id ?? "") ?? "" },
            set: { formState.setValue(block.id ?? "", $0) }
        )
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            FieldLabel(label: block.label, required: block.required, hint: block.hint)

            TextField(block.placeholder ?? "", text: text)
                .textFieldStyle(.roundedBorder)
                #if os(iOS)
                .keyboardType(keyboardType)
                .textContentType(contentType)
                #endif
                .autocorrectionDisabled(block.format == .email || block.format == .url)
                #if os(iOS)
                .textInputAutocapitalization(block.format == .email || block.format == .url ? .never : .sentences)
                #endif

            if let displayFormat = block.displayFormat,
               let numVal = Double(text.wrappedValue) {
                Text(formatDisplayValue(numVal, format: displayFormat))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            if let error = formState.errors[block.id ?? ""] {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
            }
        }
    }

    #if os(iOS)
    private var keyboardType: UIKeyboardType {
        switch block.format {
        case .email: return .emailAddress
        case .tel: return .phonePad
        case .url: return .URL
        case .number: return .decimalPad
        case .password, .color: return .default
        }
    }

    private var contentType: UITextContentType? {
        switch block.format {
        case .email: return .emailAddress
        case .tel: return .telephoneNumber
        case .url: return .URL
        case .password: return .password
        default: return nil
        }
    }
    #endif
}

// MARK: - Slider

@available(iOS 17.0, macOS 14.0, *)
struct SliderView: View {
    let block: SliderBlock
    let formState: FormState

    private var value: Binding<Double> {
        Binding(
            get: { formState.getValue(block.id ?? "") ?? block.default },
            set: { formState.setValue(block.id ?? "", $0) }
        )
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            FieldLabel(label: block.label, required: block.required, hint: block.hint)

            HStack {
                Text(formatDisplayValue(block.min, format: block.displayFormat))
                    .font(.caption)
                    .foregroundStyle(.secondary)

                Slider(
                    value: value,
                    in: block.min...block.max,
                    step: block.step ?? 1
                )

                Text(formatDisplayValue(block.max, format: block.displayFormat))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Text(formatDisplayValue(value.wrappedValue, format: block.displayFormat))
                .font(.callout)
                .fontWeight(.medium)
                .frame(maxWidth: .infinity, alignment: .center)
        }
    }
}

// MARK: - Date

@available(iOS 17.0, macOS 14.0, *)
struct DateView: View {
    let block: DateBlock
    let formState: FormState

    private var date: Binding<Date> {
        Binding(
            get: {
                if let str: String = formState.getValue(block.id ?? ""),
                   let d = DateView.dateFormatter.date(from: str) {
                    return d
                }
                return DateView.dateFormatter.date(from: block.default) ?? Date()
            },
            set: {
                formState.setValue(block.id ?? "", DateView.dateFormatter.string(from: $0))
            }
        )
    }

    private static let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            FieldLabel(label: block.label, required: block.required, hint: block.hint)
            DatePicker(block.label, selection: date, displayedComponents: .date)
                .labelsHidden()

            if let error = formState.errors[block.id ?? ""] {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
            }
        }
    }
}

// MARK: - Time

@available(iOS 17.0, macOS 14.0, *)
struct TimeView: View {
    let block: TimeBlock
    let formState: FormState

    private var date: Binding<Date> {
        Binding(
            get: {
                if let str: String = formState.getValue(block.id ?? ""),
                   let d = TimeView.timeFormatter.date(from: str) {
                    return d
                }
                return TimeView.timeFormatter.date(from: block.default) ?? Date()
            },
            set: {
                formState.setValue(block.id ?? "", TimeView.timeFormatter.string(from: $0))
            }
        )
    }

    private static let timeFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "HH:mm"
        return f
    }()

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            FieldLabel(label: block.label, required: block.required, hint: block.hint)
            DatePicker(block.label, selection: date, displayedComponents: .hourAndMinute)
                .labelsHidden()

            if let error = formState.errors[block.id ?? ""] {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
            }
        }
    }
}

// MARK: - Datetime

@available(iOS 17.0, macOS 14.0, *)
struct DatetimeView: View {
    let block: DatetimeBlock
    let formState: FormState

    private var date: Binding<Date> {
        Binding(
            get: {
                if let str: String = formState.getValue(block.id ?? ""),
                   let d = DatetimeView.datetimeFormatter.date(from: str) {
                    return d
                }
                return DatetimeView.datetimeFormatter.date(from: block.default) ?? Date()
            },
            set: {
                formState.setValue(block.id ?? "", DatetimeView.datetimeFormatter.string(from: $0))
            }
        )
    }

    private static let datetimeFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd'T'HH:mm"
        return f
    }()

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            FieldLabel(label: block.label, required: block.required, hint: block.hint)
            DatePicker(block.label, selection: date, displayedComponents: [.date, .hourAndMinute])
                .labelsHidden()

            if let error = formState.errors[block.id ?? ""] {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
            }
        }
    }
}

// MARK: - FileUpload

@available(iOS 17.0, macOS 14.0, *)
struct FileUploadView: View {
    let block: FileUploadBlock
    let formState: FormState
    @State private var showFileImporter = false

    private var selectedFileName: String? {
        formState.getValue(block.id ?? "")
    }

    private var allowedContentTypes: [UTType] {
        guard let extensions = block.extensions, !extensions.isEmpty else {
            return [.data]
        }
        return extensions.compactMap { ext in
            let clean = ext.hasPrefix(".") ? String(ext.dropFirst()) : ext
            return UTType(filenameExtension: clean)
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            FieldLabel(label: block.label, required: block.required, hint: block.hint)

            Button {
                showFileImporter = true
            } label: {
                HStack {
                    Image(systemName: "doc.badge.plus")
                    Text(selectedFileName ?? "Choose File")
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(Color.secondary.opacity(0.1))
                .cornerRadius(8)
            }
            .buttonStyle(.plain)
            .fileImporter(
                isPresented: $showFileImporter,
                allowedContentTypes: allowedContentTypes,
                allowsMultipleSelection: false
            ) { result in
                if case .success(let urls) = result, let url = urls.first {
                    formState.setValue(block.id ?? "", url.lastPathComponent)
                }
            }

            if let error = formState.errors[block.id ?? ""] {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
            }
        }
    }
}

// MARK: - ImageUpload

@available(iOS 17.0, macOS 14.0, *)
struct ImageUploadView: View {
    let block: ImageUploadBlock
    let formState: FormState
    @State private var selectedItem: PhotosPickerItem?

    private var selectedFileName: String? {
        formState.getValue(block.id ?? "")
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            FieldLabel(label: block.label, required: block.required, hint: block.hint)

            PhotosPicker(
                selection: $selectedItem,
                matching: .images
            ) {
                HStack {
                    Image(systemName: "photo.badge.plus")
                    Text(selectedFileName ?? "Choose Image")
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(Color.secondary.opacity(0.1))
                .cornerRadius(8)
            }
            .buttonStyle(.plain)
            .onChange(of: selectedItem) { _, newItem in
                if let newItem {
                    formState.setValue(block.id ?? "", newItem.itemIdentifier ?? "selected-image")
                }
            }

            if let error = formState.errors[block.id ?? ""] {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
            }
        }
    }
}

// MARK: - Header

struct HeaderView: View {
    let block: HeaderBlock

    var body: some View {
        IconText(text: block.text, font: block.level == 1 ? .title2 : .title3)
            .fontWeight(.bold)
    }
}

// MARK: - Hint

struct HintView: View {
    let block: HintBlock

    var body: some View {
        IconText(text: block.text, font: .caption)
            .foregroundStyle(.secondary)
    }
}

// MARK: - Prose

struct ProseView: View {
    let block: ProseBlock

    var body: some View {
        IconText(text: block.text, font: .body)
    }
}

// MARK: - Group

@available(iOS 17.0, macOS 14.0, *)
struct GroupView: View {
    let block: GroupBlock
    let formState: FormState

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Group name is for accessibility, not displayed visually
            ViewThatFits(in: .horizontal) {
                // Try horizontal first
                HStack(alignment: .top, spacing: 12) {
                    ForEach(Array(block.children.enumerated()), id: \.offset) { _, child in
                        BlockView(block: child, formState: formState)
                            .frame(maxWidth: .infinity)
                    }
                }
                // Fall back to vertical if horizontal doesn't fit
                VStack(alignment: .leading, spacing: 12) {
                    ForEach(Array(block.children.enumerated()), id: \.offset) { _, child in
                        BlockView(block: child, formState: formState)
                    }
                }
            }
        }
        .padding()
        .background(Color.secondary.opacity(0.05))
        .cornerRadius(12)
    }
}
