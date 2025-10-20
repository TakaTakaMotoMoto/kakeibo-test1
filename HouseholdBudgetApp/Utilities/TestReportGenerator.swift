import SwiftUI
import SwiftData
import Foundation

/// Generates comprehensive test reports in various formats
@MainActor
final class TestReportGenerator: ObservableObject {
    @Published var isGeneratingReport = false
    @Published var generatedReports: [TestReport] = []
    
    private let modelContext: ModelContext
    
    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }
    
    /// Generates a comprehensive test report
    func generateTestReport(
        from testSummary: TestSummary,
        integrationResults: [IntegrationTestResult],
        endToEndResults: [EndToEndTestResult],
        securityResults: [SecurityTestResult],
        usabilityResults: [UsabilityTestResult],
        validationResults: [ValidationResult]
    ) async -> TestReport {
        
        isGeneratingReport = true
        
        let report = TestReport(
            id: UUID(),
            timestamp: Date(),
            summary: testSummary,
            integrationResults: integrationResults,
            endToEndResults: endToEndResults,
            securityResults: securityResults,
            usabilityResults: usabilityResults,
            validationResults: validationResults,
            systemInfo: collectSystemInfo(),
            appInfo: collectAppInfo()
        )
        
        generatedReports.append(report)
        isGeneratingReport = false
        
        return report
    }
    
    /// Generates a markdown report
    func generateMarkdownReport(from report: TestReport) -> String {
        var markdown = """
        # Household Budget App - Test Report
        
        **Generated:** \(formatDate(report.timestamp))
        **Overall Status:** \(report.summary.overallStatus.description)
        **Success Rate:** \(String(format: "%.1f", report.summary.overallSuccessRate * 100))%
        **Total Duration:** \(String(format: "%.2f", report.summary.totalDuration)) seconds
        
        ## Executive Summary
        
        """
        
        // Add overall assessment
        switch report.summary.overallStatus {
        case .allPassed:
            markdown += "✅ All tests passed successfully. The application meets all quality standards.\n\n"
        case .passedWithWarnings:
            markdown += "⚠️ Tests passed with some warnings. Review recommended improvements.\n\n"
        case .partiallyPassed:
            markdown += "🔶 Some tests failed. Address critical issues before release.\n\n"
        case .failed:
            markdown += "❌ Multiple test failures detected. Significant issues require attention.\n\n"
        }
        
        // Add key metrics
        markdown += """
        ## Key Metrics
        
        | Metric | Value |
        |--------|-------|
        | Integration Tests | \(report.summary.metrics.passedIntegrationTests)/\(report.summary.metrics.totalIntegrationTests) passed |
        | End-to-End Tests | \(report.summary.metrics.passedEndToEndSteps)/\(report.summary.metrics.totalEndToEndSteps) passed |
        | Security Tests | \(report.summary.metrics.passedSecurityTests)/\(report.summary.metrics.totalSecurityTests) passed |
        | Usability Score | \(report.summary.metrics.usabilityScore)/100 |
        | Validation Checks | \(report.summary.metrics.passedValidationChecks)/\(report.summary.metrics.totalValidationChecks) passed |
        | Performance Score | \(report.summary.metrics.performanceScore)/100 |
        | Memory Usage | \(report.summary.metrics.formattedMemoryUsage) |
        
        """
        
        // Add phase results
        markdown += """
        ## Test Phase Results
        
        """
        
        for phase in report.summary.phaseResults {
            let statusIcon = phase.status == .passed ? "✅" : phase.status == .warning ? "⚠️" : "❌"
            markdown += """
            ### \(statusIcon) \(phase.name)
            
            - **Status:** \(phase.status == .passed ? "Passed" : phase.status == .warning ? "Warning" : "Failed")
            - **Success Rate:** \(String(format: "%.1f", phase.successRate * 100))%
            - **Duration:** \(String(format: "%.2f", phase.duration)) seconds
            - **Details:** \(phase.details)
            
            """
        }
        
        // Add detailed results
        if !report.integrationResults.isEmpty {
            markdown += """
            ## Integration Test Details
            
            """
            
            for result in report.integrationResults {
                let statusIcon = result.status == .passed ? "✅" : "❌"
                markdown += """
                ### \(statusIcon) \(result.name)
                
                - **Status:** \(result.status == .passed ? "Passed" : "Failed")
                - **Duration:** \(String(format: "%.3f", result.duration)) seconds
                - **Message:** \(result.message)
                
                """
            }
        }
        
        if !report.securityResults.isEmpty {
            markdown += """
            ## Security Test Details
            
            """
            
            for result in report.securityResults {
                let statusIcon = result.status == .passed ? "✅" : result.status == .warning ? "⚠️" : "❌"
                markdown += """
                ### \(statusIcon) \(result.testName)
                
                - **Status:** \(result.status == .passed ? "Passed" : result.status == .warning ? "Warning" : "Failed")
                - **Message:** \(result.message)
                
                """
                
                if !result.vulnerabilities.isEmpty {
                    markdown += """
                    **Vulnerabilities:**
                    """
                    for vulnerability in result.vulnerabilities {
                        markdown += "\n- \(vulnerability)"
                    }
                    markdown += "\n\n"
                }
                
                if !result.recommendations.isEmpty {
                    markdown += """
                    **Recommendations:**
                    """
                    for recommendation in result.recommendations {
                        markdown += "\n- \(recommendation)"
                    }
                    markdown += "\n\n"
                }
            }
        }
        
        if !report.usabilityResults.isEmpty {
            markdown += """
            ## Usability Test Details
            
            """
            
            for result in report.usabilityResults {
                let statusIcon = result.status == .excellent ? "⭐" : result.status == .good ? "✅" : result.status == .fair ? "⚠️" : "❌"
                markdown += """
                ### \(statusIcon) \(result.testName)
                
                - **Status:** \(result.status.description)
                - **Score:** \(result.score)/100
                - **Message:** \(result.message)
                
                """
                
                if !result.issues.isEmpty {
                    markdown += """
                    **Issues:**
                    """
                    for issue in result.issues {
                        markdown += "\n- \(issue)"
                    }
                    markdown += "\n\n"
                }
                
                if !result.recommendations.isEmpty {
                    markdown += """
                    **Recommendations:**
                    """
                    for recommendation in result.recommendations {
                        markdown += "\n- \(recommendation)"
                    }
                    markdown += "\n\n"
                }
            }
        }
        
        // Add recommendations
        if !report.summary.recommendations.isEmpty {
            markdown += """
            ## Recommendations
            
            """
            
            for (index, recommendation) in report.summary.recommendations.enumerated() {
                markdown += "\(index + 1). \(recommendation)\n"
            }
            markdown += "\n"
        }
        
        // Add system information
        markdown += """
        ## System Information
        
        - **Device:** \(report.systemInfo.deviceModel)
        - **iOS Version:** \(report.systemInfo.iOSVersion)
        - **App Version:** \(report.appInfo.version)
        - **Build:** \(report.appInfo.build)
        - **Test Environment:** \(report.systemInfo.isSimulator ? "Simulator" : "Device")
        
        ---
        
        *Report generated by Household Budget App Test Suite*
        """
        
        return markdown
    }
    
    /// Generates a JSON report
    func generateJSONReport(from report: TestReport) -> String {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        
        do {
            let jsonData = try encoder.encode(report)
            return String(data: jsonData, encoding: .utf8) ?? "Failed to encode JSON"
        } catch {
            return "JSON encoding error: \(error.localizedDescription)"
        }
    }
    
    /// Saves report to documents directory
    func saveReport(_ report: TestReport, format: ReportFormat) async throws -> URL {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        let timestamp = formatTimestamp(report.timestamp)
        
        let filename: String
        let content: String
        
        switch format {
        case .markdown:
            filename = "test-report-\(timestamp).md"
            content = generateMarkdownReport(from: report)
        case .json:
            filename = "test-report-\(timestamp).json"
            content = generateJSONReport(from: report)
        }
        
        let fileURL = documentsPath.appendingPathComponent(filename)
        try content.write(to: fileURL, atomically: true, encoding: .utf8)
        
        return fileURL
    }
    
    private func collectSystemInfo() -> SystemInfo {
        let device = UIDevice.current
        
        return SystemInfo(
            deviceModel: device.model,
            systemName: device.systemName,
            iOSVersion: device.systemVersion,
            isSimulator: TARGET_OS_SIMULATOR != 0,
            screenSize: UIScreen.main.bounds.size,
            screenScale: UIScreen.main.scale
        )
    }
    
    private func collectAppInfo() -> AppInfo {
        let bundle = Bundle.main
        
        return AppInfo(
            name: bundle.object(forInfoDictionaryKey: "CFBundleDisplayName") as? String ?? "Household Budget App",
            version: bundle.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0",
            build: bundle.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "1",
            bundleIdentifier: bundle.bundleIdentifier ?? "com.example.householdbudget"
        )
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .full
        formatter.timeStyle = .medium
        return formatter.string(from: date)
    }
    
    private func formatTimestamp(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd-HHmmss"
        return formatter.string(from: date)
    }
}

// MARK: - Supporting Types

struct TestReport: Codable {
    let id: UUID
    let timestamp: Date
    let summary: TestSummary
    let integrationResults: [IntegrationTestResult]
    let endToEndResults: [EndToEndTestResult]
    let securityResults: [SecurityTestResult]
    let usabilityResults: [UsabilityTestResult]
    let validationResults: [ValidationResult]
    let systemInfo: SystemInfo
    let appInfo: AppInfo
}

struct SystemInfo: Codable {
    let deviceModel: String
    let systemName: String
    let iOSVersion: String
    let isSimulator: Bool
    let screenSize: CGSize
    let screenScale: CGFloat
}

struct AppInfo: Codable {
    let name: String
    let version: String
    let build: String
    let bundleIdentifier: String
}

enum ReportFormat: String, CaseIterable {
    case markdown = "Markdown"
    case json = "JSON"
    
    var fileExtension: String {
        switch self {
        case .markdown:
            return "md"
        case .json:
            return "json"
        }
    }
}

// MARK: - Codable Extensions

extension TestSummary: Codable {
    enum CodingKeys: String, CodingKey {
        case overallStatus, overallSuccessRate, totalDuration
        case phaseResults, recommendations, metrics, timestamp
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        overallStatus = try container.decode(OverallStatus.self, from: .overallStatus)
        overallSuccessRate = try container.decode(Double.self, forKey: .overallSuccessRate)
        totalDuration = try container.decode(TimeInterval.self, forKey: .totalDuration)
        phaseResults = try container.decode([PhaseResult].self, forKey: .phaseResults)
        recommendations = try container.decode([String].self, forKey: .recommendations)
        metrics = try container.decode(TestMetrics.self, forKey: .metrics)
        timestamp = try container.decode(Date.self, forKey: .timestamp)
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(overallStatus, forKey: .overallStatus)
        try container.encode(overallSuccessRate, forKey: .overallSuccessRate)
        try container.encode(totalDuration, forKey: .totalDuration)
        try container.encode(phaseResults, forKey: .phaseResults)
        try container.encode(recommendations, forKey: .recommendations)
        try container.encode(metrics, forKey: .metrics)
        try container.encode(timestamp, forKey: .timestamp)
    }
}

extension TestSummary.OverallStatus: Codable {}
extension PhaseResult: Codable {}
extension PhaseResult.Status: Codable {}
extension TestMetrics: Codable {}
extension IntegrationTestResult: Codable {}
extension IntegrationTestResult.Status: Codable {}
extension EndToEndTestResult: Codable {}
extension EndToEndTestResult.Status: Codable {}
extension SecurityTestResult: Codable {}
extension SecurityTestResult.Status: Codable {}
extension UsabilityTestResult: Codable {}
extension UsabilityTestResult.Status: Codable {}
extension ValidationResult: Codable {}
extension ValidationStatus: Codable {}