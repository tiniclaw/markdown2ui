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

    public var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 12) {
                ForEach(Array(ast.blocks.enumerated()), id: \.offset) { _, block in
                    BlockView(block: block, formState: formState)
                }
                Button("Submit") {
                    guard formState.validate(ast.blocks) else { return }
                    let json = formState.serializeCompact(ast.blocks)
                    onSubmit(json)
                }
                .buttonStyle(.borderedProminent)
                .frame(maxWidth: .infinity, alignment: .center)
                .padding(.top, 8)
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
