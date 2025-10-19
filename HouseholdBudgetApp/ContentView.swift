import SwiftUI
import SwiftData

struct ContentView: View {
    @Environment(\.modelContext) private var modelContext
    @StateObject private var dataIntegrityService = DataIntegrityService()
    @StateObject private var orientationManager = OrientationManager()
    @State private var isPerformingStartupChecks = true
    @State private var startupError: Error?
    
    var body: some View {
        Group {
            if isPerformingStartupChecks {
                StartupView(isLoading: dataIntegrityService.isPerformingIntegrityCheck)
            } else if let error = startupError {
                ErrorRecoveryView(error: error) {
                    Task {
                        await performStartupChecks()
                    }
                }
            } else {
                if UIDevice.current.userInterfaceIdiom == .pad {
                    iPadMainView()
                        .environmentObject(dataIntegrityService)
                        .environmentObject(orientationManager)
                } else {
                    MainTabView()
                        .environmentObject(dataIntegrityService)
                        .environmentObject(orientationManager)
                }
            }
        }
        .task {
            await performStartupChecks()
        }
    }
    
    private func performStartupChecks() async {
        do {
            guard let container = modelContext.container else {
                throw BudgetAppError.dataCorruption
            }
            
            await dataIntegrityService.performStartupChecks(container: container)
            
            await MainActor.run {
                isPerformingStartupChecks = false
                startupError = nil
            }
        } catch {
            await MainActor.run {
                isPerformingStartupChecks = false
                startupError = error
            }
        }
    }
}

// MARK: - Startup View
struct StartupView: View {
    let isLoading: Bool
    
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "chart.line.uptrend.xyaxis")
                .font(.system(size: 60))
                .foregroundColor(.accentColor)
            
            Text("HouseholdBudgetApp")
                .font(.title)
                .fontWeight(.bold)
            
            if isLoading {
                VStack(spacing: 12) {
                    ProgressView()
                        .scaleEffect(1.2)
                    
                    Text("integrity.checking")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemBackground))
    }
}

// MARK: - Error Recovery View
struct ErrorRecoveryView: View {
    let error: Error
    let onRetry: () -> Void
    
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 50))
                .foregroundColor(.orange)
            
            Text("Data Integrity Issue")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text(error.localizedDescription)
                .font(.body)
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
                .padding(.horizontal)
            
            VStack(spacing: 12) {
                Button("Retry") {
                    onRetry()
                }
                .buttonStyle(.borderedProminent)
                
                Button("Continue Anyway") {
                    // This would skip integrity checks and continue
                    // Implementation depends on requirements
                }
                .buttonStyle(.bordered)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemBackground))
        .padding()
    }
}

#Preview {
    ContentView()
        .modelContainer(for: Transaction.self, inMemory: true)
}