import SwiftUI
import Markdown2UI

struct ContentView: View {
    enum FormDemo: String, CaseIterable, Identifiable {
        case hotelSearch = "Hotel Search"
        case bugReport = "Bug Report"
        case quickSurvey = "Quick Survey"
        var id: String { rawValue }
    }

    @State private var selected: FormDemo = .hotelSearch
    @State private var submittedJSON: String?
    @State private var showResult = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Picker("Form", selection: $selected) {
                    ForEach(FormDemo.allCases) { demo in
                        Text(demo.rawValue).tag(demo)
                    }
                }
                .pickerStyle(.segmented)
                .padding()

                formView
            }
            .navigationTitle("Markdown2UI")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .sheet(isPresented: $showResult) {
                resultSheet
            }
        }
    }

    @ViewBuilder
    private var formView: some View {
        let json: String = {
            switch selected {
            case .hotelSearch: return SampleData.hotelSearch
            case .bugReport: return SampleData.bugReport
            case .quickSurvey: return SampleData.quickSurvey
            }
        }()

        if let view = Markdown2UIView(jsonString: json, onSubmit: { result in
            submittedJSON = result
            showResult = true
        }) {
            view.id(selected.rawValue)
        } else {
            Text("Failed to decode AST")
                .foregroundStyle(.red)
        }
    }

    private var resultSheet: some View {
        NavigationStack {
            ScrollView {
                Text(prettyJSON(submittedJSON ?? "{}"))
                    .font(.system(.body, design: .monospaced))
                    .textSelection(.enabled)
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .navigationTitle("Submission Result")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { showResult = false }
                }
            }
        }
    }

    private func prettyJSON(_ raw: String) -> String {
        guard let data = raw.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: data),
              let pretty = try? JSONSerialization.data(withJSONObject: obj, options: [.prettyPrinted, .sortedKeys]),
              let str = String(data: pretty, encoding: .utf8)
        else { return raw }
        return str
    }
}
