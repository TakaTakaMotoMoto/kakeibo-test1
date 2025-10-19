import SwiftUI
import SwiftData

struct IntegrationTestView: View {
    @Environment(\.modelContext) private var modelContext
    @StateObject private var integrationManager: IntegrationTestManager
    @StateObject private var compatibilityManager = DeviceCompatibilityManager()
    @StateObject private var endToEndRunner: EndToEndTestRunner
    @State private var selectedTab = 0
    
    init(modelContext: ModelContext) {
        self._integrationManager = StateObject(wrappedValue: IntegrationTestManager(modelContext: modelContext))
        self._endToEndRunner = StateObject(wrappedValue: EndToEndTestRunner(modelContext: modelContext))
    }
    
    var body: some View {
        NavigationView {
            VStack {
                Picker("Test Type", selection: $selectedTab) {
                    Text("Integration").tag(0)
                    Text("End-to-End").tag(1)
                    Text("Compatibility").tag(2)
                    Text("Performance").tag(3)
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding()
                
                TabView(selection: $selectedTab) {
                    integrationTestsView
                        .tag(0)
                    
                    endToEndTestsView
                        .tag(1)
                    
                    deviceCompatibilityView
                        .tag(2)
                    
                    performanceMetricsView
                        .tag(3)
                }
                .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
            }
            .navigationTitle("Integration Tests")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
    
    private var integrationTestsView: some View {
        VStack {
            if integrationManager.isRunningTests {
                VStack(spacing: 20) {
                    ProgressView("Running Integration Tests...")
                        .scaleEffect(1.2)
                    
                    Text("This may take a few moments")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                VStack {
                    Button(action: {
                        Task {
                            await integrationManager.runIntegrationTests()
                        }
                    }) {
                        HStack {
                            Image(systemName: "play.circle.fill")
                            Text("Run Integration Tests")
                        }
                        .font(.headline)
                        .foregroundColor(.white)
                        .padding()
                        .background(Color.blue)
                        .cornerRadius(10)
                    }
                    .padding()
                    
                    if !integrationManager.testResults.isEmpty {
                        List(integrationManager.testResults, id: \.name) { result in
                            TestResultRow(result: result)
                        }
                    } else {
                        Text("No tests have been run yet")
                            .foregroundColor(.secondary)
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                    }
                }
            }
        }
    }
    
    private var endToEndTestsView: some View {
        VStack {
            if endToEndRunner.isRunning {
                VStack(spacing: 20) {
                    ProgressView(value: endToEndRunner.progress)
                        .progressViewStyle(LinearProgressViewStyle())
                        .padding(.horizontal)
                    
                    Text(endToEndRunner.currentStep)
                        .font(.headline)
                        .multilineTextAlignment(.center)
                    
                    Text("Running comprehensive end-to-end tests")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                VStack {
                    Button(action: {
                        Task {
                            await endToEndRunner.runEndToEndTests()
                        }
                    }) {
                        HStack {
                            Image(systemName: "arrow.triangle.2.circlepath")
                            Text("Run End-to-End Tests")
                        }
                        .font(.headline)
                        .foregroundColor(.white)
                        .padding()
                        .background(Color.orange)
                        .cornerRadius(10)
                    }
                    .padding()
                    
                    if !endToEndRunner.results.isEmpty {
                        List(endToEndRunner.results, id: \.step) { result in
                            EndToEndResultRow(result: result)
                        }
                    } else {
                        Text("No end-to-end tests have been run yet")
                            .foregroundColor(.secondary)
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                    }
                }
            }
        }
    }
    
    private var deviceCompatibilityView: some View {
        VStack {
            if compatibilityManager.isRunningCompatibilityTests {
                VStack(spacing: 20) {
                    ProgressView("Running Compatibility Tests...")
                        .scaleEffect(1.2)
                    
                    Text("Checking device compatibility")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                VStack {
                    Button(action: {
                        Task {
                            await compatibilityManager.runCompatibilityTests()
                        }
                    }) {
                        HStack {
                            Image(systemName: "iphone")
                            Text("Run Compatibility Tests")
                        }
                        .font(.headline)
                        .foregroundColor(.white)
                        .padding()
                        .background(Color.green)
                        .cornerRadius(10)
                    }
                    .padding()
                    
                    // Device Info Section
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Device Information")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        VStack(alignment: .leading, spacing: 4) {
                            InfoRow(label: "Device", value: compatibilityManager.deviceInfo.deviceTypeString)
                            InfoRow(label: "Model", value: compatibilityManager.deviceInfo.deviceModel)
                            InfoRow(label: "iOS Version", value: compatibilityManager.deviceInfo.iOSVersion)
                            InfoRow(label: "Screen Size", value: "\(Int(compatibilityManager.deviceInfo.screenSize.width))×\(Int(compatibilityManager.deviceInfo.screenSize.height))")
                            InfoRow(label: "Scale", value: "\(compatibilityManager.deviceInfo.screenScale)x")
                        }
                        .padding(.horizontal)
                    }
                    .background(Color(.systemGray6))
                    .cornerRadius(10)
                    .padding()
                    
                    if !compatibilityManager.compatibilityResults.isEmpty {
                        List(compatibilityManager.compatibilityResults, id: \.testName) { result in
                            CompatibilityResultRow(result: result)
                        }
                    }
                }
            }
        }
    }
    
    private var performanceMetricsView: some View {
        VStack {
            if let metrics = integrationManager.performanceMetrics {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Performance Metrics")
                        .font(.title2)
                        .fontWeight(.bold)
                        .padding(.horizontal)
                    
                    VStack(alignment: .leading, spacing: 8) {
                        MetricRow(
                            label: "Data Creation Time",
                            value: String(format: "%.3f seconds", metrics.dataCreationTime),
                            icon: "plus.circle"
                        )
                        
                        MetricRow(
                            label: "Data Fetch Time",
                            value: String(format: "%.3f seconds", metrics.dataFetchTime),
                            icon: "arrow.down.circle"
                        )
                        
                        MetricRow(
                            label: "Transaction Count",
                            value: "\(metrics.transactionCount) records",
                            icon: "list.number"
                        )
                        
                        MetricRow(
                            label: "Memory Usage",
                            value: metrics.formattedMemoryUsage,
                            icon: "memorychip"
                        )
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(10)
                    .padding(.horizontal)
                    
                    Spacer()
                }
            } else {
                VStack(spacing: 20) {
                    Image(systemName: "speedometer")
                        .font(.system(size: 50))
                        .foregroundColor(.secondary)
                    
                    Text("No Performance Data")
                        .font(.title3)
                        .fontWeight(.medium)
                    
                    Text("Run integration tests to see performance metrics")
                        .font(.body)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
    }
}// MARK
: - Supporting Views

struct TestResultRow: View {
    let result: IntegrationTestResult
    
    var body: some View {
        HStack {
            Image(systemName: result.status == .passed ? "checkmark.circle.fill" : "xmark.circle.fill")
                .foregroundColor(result.status == .passed ? .green : .red)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(result.name)
                    .font(.headline)
                
                Text(result.message)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                if result.duration > 0 {
                    Text("Duration: \(String(format: "%.3f", result.duration))s")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
        }
        .padding(.vertical, 4)
    }
}

struct CompatibilityResultRow: View {
    let result: CompatibilityTestResult
    
    var body: some View {
        HStack {
            Image(systemName: result.status.icon)
                .foregroundColor(result.status.color)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(result.testName)
                    .font(.headline)
                
                Text(result.message)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
        .padding(.vertical, 4)
    }
}

struct InfoRow: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
            
            Spacer()
            
            Text(value)
                .font(.caption)
                .fontWeight(.medium)
        }
    }
}

struct MetricRow: View {
    let label: String
    let value: String
    let icon: String
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.blue)
                .frame(width: 20)
            
            Text(label)
                .font(.body)
            
            Spacer()
            
            Text(value)
                .font(.body)
                .fontWeight(.medium)
        }
    }
}

struct EndToEndResultRow: View {
    let result: EndToEndTestResult
    
    var body: some View {
        HStack {
            Image(systemName: result.status.icon)
                .foregroundColor(result.status.color)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(result.step)
                    .font(.headline)
                
                Text(result.message)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                if result.duration > 0 {
                    Text("Duration: \(String(format: "%.3f", result.duration))s")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    IntegrationTestView(modelContext: PreviewContainer.shared.mainContext)
}