import SwiftUI
import SwiftData
import Foundation

/// Orchestrates comprehensive testing across all test suites
@MainActor
final class ComprehensiveTestRunner: ObservableObject {
    @Published var isRunningComprehensiveTests = false
    @Published var currentPhase = ""
    @Published var overallProgress: Double = 0.0
    @Published var testSummary: TestSummary?
    
    private let modelContext: ModelContext
    private let integrationManager: IntegrationTestManager
    private let endToEndRunner: EndToEndTestRunner
    private let securityManager: SecurityTestManager
    private let usabilityManager: UsabilityTestManager
    private let finalValidator: FinalIntegrationValidator
    
    init(modelContext: ModelContext) {
        self.modelContext = modelContext
        self.integrationManager = IntegrationTestManager(modelContext: modelContext)
        self.endToEndRunner = EndToEndTestRunner(modelContext: modelContext)
        self.securityManager = SecurityTestManager(modelContext: modelContext)
        self.usabilityManager = UsabilityTestManager(modelContext: modelContext)
        self.finalValidator = FinalIntegrationValidator(modelContext: modelContext)
    }
    
    /// Runs all test suites in sequence
    func runComprehensiveTests() async {
        isRunningComprehensiveTests = true
        overallProgress = 0.0
        testSummary = nil
        
        let testPhases: [(String, Double, () async -> Void)] = [
            ("Integration Tests", 0.2, runIntegrationPhase),
            ("End-to-End Tests", 0.4, runEndToEndPhase),
            ("Security Tests", 0.6, runSecurityPhase),
            ("Usability Tests", 0.8, runUsabilityPhase),
            ("Final Validation", 1.0, runFinalValidationPhase)
        ]
        
        var phaseResults: [PhaseResult] = []
        
        for (phaseName, progress, phaseRunner) in testPhases {
            currentPhase = "Running \(phaseName)..."
            overallProgress = progress
            
            let startTime = CFAbsoluteTimeGetCurrent()
            await phaseRunner()
            let duration = CFAbsoluteTimeGetCurrent() - startTime
            
            let result = evaluatePhaseResult(phaseName, duration: duration)
            phaseResults.append(result)
            
            // Small delay between phases
            try? await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds
        }
        
        // Generate comprehensive summary
        testSummary = generateTestSummary(phaseResults: phaseResults)
        currentPhase = "Comprehensive testing completed"
        isRunningComprehensiveTests = false
    }
    
    private func runIntegrationPhase() async {
        await integrationManager.runIntegrationTests()
    }
    
    private func runEndToEndPhase() async {
        await endToEndRunner.runEndToEndTests()
    }
    
    private func runSecurityPhase() async {
        await securityManager.runSecurityTests()
    }
    
    private func runUsabilityPhase() async {
        await usabilityManager.runUsabilityTests()
    }
    
    private func runFinalValidationPhase() async {
        await finalValidator.runFinalValidation()
    }
    
    private func evaluatePhaseResult(_ phaseName: String, duration: TimeInterval) -> PhaseResult {
        switch phaseName {
        case "Integration Tests":
            let passedCount = integrationManager.testResults.filter { $0.status == .passed }.count
            let totalCount = integrationManager.testResults.count
            let successRate = totalCount > 0 ? Double(passedCount) / Double(totalCount) : 0.0
            
            return PhaseResult(
                name: phaseName,
                status: successRate >= 0.8 ? .passed : successRate >= 0.6 ? .warning : .failed,
                successRate: successRate,
                duration: duration,
                details: "\(passedCount)/\(totalCount) tests passed"
            )
            
        case "End-to-End Tests":
            let passedCount = endToEndRunner.results.filter { $0.status == .passed }.count
            let totalCount = endToEndRunner.results.count
            let successRate = totalCount > 0 ? Double(passedCount) / Double(totalCount) : 0.0
            
            return PhaseResult(
                name: phaseName,
                status: successRate >= 0.9 ? .passed : successRate >= 0.7 ? .warning : .failed,
                successRate: successRate,
                duration: duration,
                details: "\(passedCount)/\(totalCount) steps completed successfully"
            )
            
        case "Security Tests":
            let passedCount = securityManager.securityResults.filter { $0.status == .passed }.count
            let totalCount = securityManager.securityResults.count
            let successRate = totalCount > 0 ? Double(passedCount) / Double(totalCount) : 0.0
            
            return PhaseResult(
                name: phaseName,
                status: successRate >= 0.9 ? .passed : successRate >= 0.7 ? .warning : .failed,
                successRate: successRate,
                duration: duration,
                details: "\(passedCount)/\(totalCount) security tests passed"
            )
            
        case "Usability Tests":
            let averageScore = usabilityManager.overallUsabilityScore
            let successRate = Double(averageScore) / 100.0
            
            return PhaseResult(
                name: phaseName,
                status: averageScore >= 80 ? .passed : averageScore >= 60 ? .warning : .failed,
                successRate: successRate,
                duration: duration,
                details: "Overall usability score: \(averageScore)/100"
            )
            
        case "Final Validation":
            let passedCount = finalValidator.validationResults.filter { $0.status == .passed }.count
            let totalCount = finalValidator.validationResults.count
            let successRate = totalCount > 0 ? Double(passedCount) / Double(totalCount) : 0.0
            
            return PhaseResult(
                name: phaseName,
                status: finalValidator.overallStatus == .allPassed ? .passed : 
                        finalValidator.overallStatus == .mostlyPassed ? .warning : .failed,
                successRate: successRate,
                duration: duration,
                details: "\(passedCount)/\(totalCount) validation checks passed"
            )
            
        default:
            return PhaseResult(
                name: phaseName,
                status: .failed,
                successRate: 0.0,
                duration: duration,
                details: "Unknown phase"
            )
        }
    }
    
    private func generateTestSummary(phaseResults: [PhaseResult]) -> TestSummary {
        let totalDuration = phaseResults.reduce(0) { $0 + $1.duration }
        let overallSuccessRate = phaseResults.reduce(0) { $0 + $1.successRate } / Double(phaseResults.count)
        
        let passedPhases = phaseResults.filter { $0.status == .passed }.count
        let warningPhases = phaseResults.filter { $0.status == .warning }.count
        let failedPhases = phaseResults.filter { $0.status == .failed }.count
        
        let overallStatus: TestSummary.OverallStatus
        if failedPhases == 0 && warningPhases == 0 {
            overallStatus = .allPassed
        } else if failedPhases == 0 {
            overallStatus = .passedWithWarnings
        } else if passedPhases > failedPhases {
            overallStatus = .partiallyPassed
        } else {
            overallStatus = .failed
        }
        
        // Generate recommendations
        var recommendations: [String] = []
        
        for result in phaseResults {
            switch result.status {
            case .failed:
                recommendations.append("Address critical issues in \(result.name)")
            case .warning:
                recommendations.append("Review and improve \(result.name)")
            case .passed:
                break // No recommendations needed
            }
        }
        
        if recommendations.isEmpty {
            recommendations.append("All tests passed successfully! Consider regular testing to maintain quality.")
        }
        
        // Collect detailed metrics
        let metrics = TestMetrics(
            totalIntegrationTests: integrationManager.testResults.count,
            passedIntegrationTests: integrationManager.testResults.filter { $0.status == .passed }.count,
            totalEndToEndSteps: endToEndRunner.results.count,
            passedEndToEndSteps: endToEndRunner.results.filter { $0.status == .passed }.count,
            totalSecurityTests: securityManager.securityResults.count,
            passedSecurityTests: securityManager.securityResults.filter { $0.status == .passed }.count,
            usabilityScore: usabilityManager.overallUsabilityScore,
            totalValidationChecks: finalValidator.validationResults.count,
            passedValidationChecks: finalValidator.validationResults.filter { $0.status == .passed }.count,
            memoryUsage: integrationManager.performanceMetrics?.memoryUsage ?? 0,
            performanceScore: calculatePerformanceScore()
        )
        
        return TestSummary(
            overallStatus: overallStatus,
            overallSuccessRate: overallSuccessRate,
            totalDuration: totalDuration,
            phaseResults: phaseResults,
            recommendations: recommendations,
            metrics: metrics,
            timestamp: Date()
        )
    }
    
    private func calculatePerformanceScore() -> Int {
        guard let metrics = integrationManager.performanceMetrics else { return 0 }
        
        var score = 100
        
        // Penalize slow data creation (should be under 2 seconds)
        if metrics.dataCreationTime > 2.0 {
            score -= Int((metrics.dataCreationTime - 2.0) * 10)
        }
        
        // Penalize slow data fetching (should be under 0.5 seconds)
        if metrics.dataFetchTime > 0.5 {
            score -= Int((metrics.dataFetchTime - 0.5) * 20)
        }
        
        // Penalize high memory usage (should be under 50MB)
        let memoryMB = Double(metrics.memoryUsage) / 1_000_000
        if memoryMB > 50 {
            score -= Int((memoryMB - 50) / 10)
        }
        
        return max(0, min(100, score))
    }
}

// MARK: - Supporting Types

struct PhaseResult {
    let name: String
    let status: Status
    let successRate: Double
    let duration: TimeInterval
    let details: String
    
    enum Status {
        case passed
        case warning
        case failed
        
        var color: Color {
            switch self {
            case .passed:
                return .green
            case .warning:
                return .orange
            case .failed:
                return .red
            }
        }
        
        var icon: String {
            switch self {
            case .passed:
                return "checkmark.circle.fill"
            case .warning:
                return "exclamationmark.triangle.fill"
            case .failed:
                return "xmark.circle.fill"
            }
        }
    }
}

struct TestSummary {
    let overallStatus: OverallStatus
    let overallSuccessRate: Double
    let totalDuration: TimeInterval
    let phaseResults: [PhaseResult]
    let recommendations: [String]
    let metrics: TestMetrics
    let timestamp: Date
    
    enum OverallStatus {
        case allPassed
        case passedWithWarnings
        case partiallyPassed
        case failed
        
        var color: Color {
            switch self {
            case .allPassed:
                return .green
            case .passedWithWarnings:
                return .blue
            case .partiallyPassed:
                return .orange
            case .failed:
                return .red
            }
        }
        
        var icon: String {
            switch self {
            case .allPassed:
                return "checkmark.seal.fill"
            case .passedWithWarnings:
                return "checkmark.circle.trianglebadge.exclamationmark"
            case .partiallyPassed:
                return "exclamationmark.triangle.fill"
            case .failed:
                return "xmark.seal.fill"
            }
        }
        
        var description: String {
            switch self {
            case .allPassed:
                return "All Tests Passed"
            case .passedWithWarnings:
                return "Passed with Warnings"
            case .partiallyPassed:
                return "Partially Passed"
            case .failed:
                return "Tests Failed"
            }
        }
    }
}

struct TestMetrics {
    let totalIntegrationTests: Int
    let passedIntegrationTests: Int
    let totalEndToEndSteps: Int
    let passedEndToEndSteps: Int
    let totalSecurityTests: Int
    let passedSecurityTests: Int
    let usabilityScore: Int
    let totalValidationChecks: Int
    let passedValidationChecks: Int
    let memoryUsage: UInt64
    let performanceScore: Int
    
    var integrationSuccessRate: Double {
        return totalIntegrationTests > 0 ? Double(passedIntegrationTests) / Double(totalIntegrationTests) : 0.0
    }
    
    var endToEndSuccessRate: Double {
        return totalEndToEndSteps > 0 ? Double(passedEndToEndSteps) / Double(totalEndToEndSteps) : 0.0
    }
    
    var securitySuccessRate: Double {
        return totalSecurityTests > 0 ? Double(passedSecurityTests) / Double(totalSecurityTests) : 0.0
    }
    
    var validationSuccessRate: Double {
        return totalValidationChecks > 0 ? Double(passedValidationChecks) / Double(totalValidationChecks) : 0.0
    }
    
    var formattedMemoryUsage: String {
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useMB, .useKB]
        formatter.countStyle = .memory
        return formatter.string(fromByteCount: Int64(memoryUsage))
    }
}