import SwiftUI
import JavaScriptCore
import Markdown2UI

// MARK: - JS Parser Bridge

final class MarkdownParser {
    static let shared = MarkdownParser()
    private let context: JSContext

    private init() {
        context = JSContext()!
        context.exceptionHandler = { _, val in
            print("[JSCore] \(val?.toString() ?? "unknown error")")
        }
        if let url = Bundle.main.url(forResource: "parser", withExtension: "js"),
           let js = try? String(contentsOf: url) {
            context.evaluateScript(js)
        }
    }

    func parse(_ markup: String) -> String? {
        let escaped = markup
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "`", with: "\\`")
            .replacingOccurrences(of: "$", with: "\\$")
        let result = context.evaluateScript("parseMarkdown(`\(escaped)`)")
        return result?.toString()
    }
}

// MARK: - Example Data

struct DemoExample: Codable, Identifiable {
    let id: String
    let title: String
    let markup: String
    let ast: Ast
}

private let demoExamples: [DemoExample] = {
    guard let url = Bundle.main.url(forResource: "examples", withExtension: "json"),
          let data = try? Data(contentsOf: url),
          let items = try? JSONDecoder().decode([DemoExample].self, from: data)
    else { return [] }
    return items
}()

// MARK: - Content

struct ContentView: View {
    @State private var customAstJson: String = ""
    @State private var customMarkup: String = ""

    var body: some View {
        TabView {
            EditorTab(onUpdate: { markup, json in
                customMarkup = markup
                customAstJson = json
            })
                .tabItem {
                    Label("Editor", systemImage: "square.and.pencil")
                }

            ShowcaseTab(customAstJson: customAstJson, customMarkup: customMarkup)
                .tabItem {
                    Label("Showcase", systemImage: "photo.on.rectangle")
                }
        }
    }
}

// MARK: - Editor Tab

struct EditorTab: View {
    var onUpdate: (String, String) -> Void = { _, _ in }

    @State private var markup: String = demoExamples.first?.markup ?? ""
    @State private var astJson: String = ""
    @State private var result: String = ""
    @State private var showResult = false
    @FocusState private var editorFocused: Bool

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                TextEditor(text: $markup)
                    .font(.system(.caption2, design: .monospaced))
                    .frame(height: 180)
                    .focused($editorFocused)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color.gray.opacity(0.3))
                    )
                    .padding(.horizontal)
                    .padding(.top, 8)

                Button {
                    editorFocused = false
                    reparse()
                } label: {
                    Text("Update")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .padding(.horizontal)
                .padding(.vertical, 6)

                Divider()

                if let view = Markdown2UIView(jsonString: astJson, onSubmit: { json in
                    result = json
                    showResult = true
                }) {
                    view
                } else {
                    VStack(spacing: 8) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.largeTitle)
                            .foregroundStyle(.orange)
                        Text("Parse error — check your markup")
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
            .navigationTitle("markdown2ui")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        ForEach(demoExamples) { ex in
                            Button(ex.title) { markup = ex.markup; reparse() }
                        }
                    } label: {
                        Image(systemName: "doc.on.doc")
                    }
                }
            }
            .alert("Submitted", isPresented: $showResult) {
                Button("OK") {}
            } message: {
                Text(result)
            }
            .onAppear { reparse() }
        }
    }

    private func reparse() {
        astJson = MarkdownParser.shared.parse(markup) ?? ""
        onUpdate(markup, astJson)
    }
}

// MARK: - Showcase Tab

struct ShowcaseTab: View {
    var customAstJson: String = ""
    var customMarkup: String = ""

    @State private var selected: String = demoExamples.first?.id ?? ""
    @State private var result: String = ""
    @State private var showResult = false

    private var hasCustom: Bool { !customAstJson.isEmpty }

    private var currentJson: String? {
        if selected == "_custom" { return customAstJson }
        if let ex = demoExamples.first(where: { $0.id == selected }),
           let data = try? JSONEncoder().encode(ex.ast),
           let json = String(data: data, encoding: .utf8) {
            return json
        }
        return nil
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Example picker
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        if hasCustom {
                            Button {
                                selected = "_custom"
                            } label: {
                                Text("Custom")
                                    .font(.subheadline)
                                    .fontWeight(selected == "_custom" ? .semibold : .regular)
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 7)
                                    .background(selected == "_custom" ? Color.accentColor.opacity(0.15) : Color.gray.opacity(0.1))
                                    .foregroundStyle(selected == "_custom" ? .primary : .secondary)
                                    .clipShape(Capsule())
                            }
                            .buttonStyle(.plain)
                        }
                        ForEach(demoExamples) { ex in
                            Button {
                                selected = ex.id
                            } label: {
                                Text(ex.title)
                                    .font(.subheadline)
                                    .fontWeight(selected == ex.id ? .semibold : .regular)
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 7)
                                    .background(selected == ex.id ? Color.accentColor.opacity(0.15) : Color.gray.opacity(0.1))
                                    .foregroundStyle(selected == ex.id ? .primary : .secondary)
                                    .clipShape(Capsule())
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 8)
                }

                Divider()

                if let json = currentJson,
                   let view = Markdown2UIView(jsonString: json, onSubmit: { r in
                       result = r
                       showResult = true
                   }) {
                    view
                }
            }
            .navigationTitle("Examples")
            .navigationBarTitleDisplayMode(.inline)
            .alert("Submitted", isPresented: $showResult) {
                Button("OK") {}
            } message: {
                Text(result)
            }
        }
    }
}
