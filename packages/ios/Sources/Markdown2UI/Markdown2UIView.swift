import SwiftUI

@available(iOS 17.0, macOS 14.0, *)
public struct Markdown2UIView: View {
    let ast: Ast
    let onSubmit: (String) -> Void
    @State private var formState = FormState()

    public init(ast: Ast, onSubmit: @escaping (String) -> Void) {
        self.ast = ast
        self.onSubmit = onSubmit
    }

    private var singleConfirmation: Bool {
        func count(_ blocks: [Block]) -> Int {
            blocks.reduce(0) { sum, b in
                if case .confirmation = b { return sum + 1 }
                if case .group(let g) = b { return sum + count(g.children) }
                return sum
            }
        }
        return count(ast.blocks) == 1
    }

    private func handleSubmit() {
        guard formState.validate(ast.blocks) else { return }
        let json = formState.serializeCompact(ast.blocks)
        onSubmit(json)
    }

    public var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 12) {
                ForEach(Array(ast.blocks.enumerated()), id: \.offset) { _, block in
                    BlockView(block: block, formState: formState, onSubmit: singleConfirmation ? handleSubmit : nil)
                }
                if !singleConfirmation {
                    Button("Submit") {
                        handleSubmit()
                    }
                    .buttonStyle(.borderedProminent)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.top, 8)
                }
            }
            .padding()
        }
        .onAppear {
            formState.initializeDefaults(ast.blocks)
        }
    }
}

// MARK: - Convenience initializer from JSON

@available(iOS 17.0, macOS 14.0, *)
public extension Markdown2UIView {
    init?(jsonData: Data, onSubmit: @escaping (String) -> Void) {
        let decoder = JSONDecoder()
        guard let ast = try? decoder.decode(Ast.self, from: jsonData) else {
            return nil
        }
        self.init(ast: ast, onSubmit: onSubmit)
    }

    init?(jsonString: String, onSubmit: @escaping (String) -> Void) {
        guard let data = jsonString.data(using: .utf8) else { return nil }
        self.init(jsonData: data, onSubmit: onSubmit)
    }
}
