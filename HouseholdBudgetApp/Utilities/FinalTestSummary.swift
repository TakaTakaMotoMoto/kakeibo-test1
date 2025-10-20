import SwiftUI
import SwiftData
import Foundation

/// Provides a comprehensive summary of all testing activities and results
@MainActor
final class FinalTestSummary: ObservableObject {
    @Published var summaryGenerated = false
    @Published var overallTestStatus: OverallTestStatus = .notStarted
    @Published var testCoverage: TestCoverage?
    @Published var recommendations: [String] = []
    
    private let modelContext: ModelContext
    
    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }
    
    /// Generates a comprehensive test summary
    func generateFinalSummary(
        integrationResults: [IntegrationTestResult],
        endToEndResults: [EndToEndTestResult],
        securityResults: [SecurityTestResult],
        usabilityResults: [UsabilityTestResult],
        validationResults: [ValidationResult],
        performanceMetrics: PerformanceMetrics?
    ) {
        
        let coverage = TestCoverage(
            integrationTests: TestCategoryResult(
                total: integrationResults.count,
                passed: integrationResults.filter { $0.status == .passed }.count,
                failed: integrationResults.filter { $0.status == .failed }.count,
                coverage: calculateCoverage(integrationResults.count, passed: integrationResults.filter { $0.status == .passed }.count)
            ),
            endToEndTests: TestCategoryResult(
                total: endToEndResults.count,
                passed: endToEndResults.filter { $0.status == .passed }.count,
                failed: endToEndResults.filter { $0.status == .failed }.count,
                coverage: calculateCoverage(endToEndResults.count, passed: endToEndResults.filter { $0.status == .passed }.count)
            ),
            securityTests: TestCategoryResult(
                total: securityResults.count,
                passed: securityResults.filter { $0.status == .passed }.count,
                failed: securityResults.filter { $0.status == .failed }.count,
                coverage: calculateCoverage(securityResults.count, passed: securityResults.filter { $0.status == .passed }.count)
            ),
            usabilityTests: TestCategoryResult(
                total: usabilityResults.count,
                passed: usabilityResults.filter { $0.status == .excellent || $0.status == .good }.count,
                failed: usabilityResults.filter { $0.status == .poor || $0.status == .failed }.count,
                coverage: Double(usabilityResults.reduce(0) { $0 + $1.score }) / Double(usabilityResults.count * 100)
            ),
            validationTests: TestCategoryResult(
                total: validationResults.count,
                passed: validationResults.filter { $0.status == .passed }.count,
                failed: validationResults.filter { $0.status == .failed }.count,
                coverage: calculateCoverage(validationResults.count, passed: validationResults.filter { $0.status == .passed }.count)
            )
        )
        
        self.testCoverage = coverage
        
        // Determine overall status
        let overallCoverage = coverage.overallCoverage
        if overallCoverage >= 0.95 {
            overallTestStatus = .excellent
        } else if overallCoverage >= 0.85 {
            overallTestStatus = .good
        } else if overallCoverage >= 0.70 {
            overallTestStatus = .acceptable
        } else {
            overallTestStatus = .needsImprovement
        }
        
        // Generate recommendations
        generateRecommendations(coverage: coverage, performanceMetrics: performanceMetrics)
        
        summaryGenerated = true
    }
    
    private func calculateCoverage(_ total: Int, passed: Int) -> Double {
        return total > 0 ? Double(passed) / Double(total) : 0.0
    }
    
    private func generateRecommendations(coverage: TestCoverage, performanceMetrics: PerformanceMetrics?) {
        recommendations.removeAll()
        
        // Integration test recommendations
        if coverage.integrationTests.coverage < 0.9 {
            recommendations.append("統合テストのカバレッジを向上させる（現在: \(Int(coverage.integrationTests.coverage * 100))%）")
        }
        
        // End-to-end test recommendations
        if coverage.endToEndTests.coverage < 0.9 {
            recommendations.append("エンドツーエンドテストの成功率を向上させる（現在: \(Int(coverage.endToEndTests.coverage * 100))%）")
        }
        
        // Security test recommendations
        if coverage.securityTests.coverage < 1.0 {
            recommendations.append("セキュリティテストで発見された脆弱性を修正する")
        }
        
        // Usability test recommendations
        if coverage.usabilityTests.coverage < 0.8 {
            recommendations.append("ユーザビリティの改善を検討する（現在スコア: \(Int(coverage.usabilityTests.coverage * 100))）")
        }
        
        // Performance recommendations
        if let metrics = performanceMetrics {
            if metrics.dataCreationTime > 2.0 {
                recommendations.append("データ作成処理のパフォーマンスを最適化する")
            }
            if metrics.dataFetchTime > 0.5 {
                recommendations.append("データ取得処理のパフォーマンスを最適化する")
            }
            if metrics.memoryUsage > 50_000_000 { // 50MB
                recommendations.append("メモリ使用量を最適化する")
            }
        }
        
        // General recommendations based on overall status
        switch overallTestStatus {
        case .excellent:
            recommendations.append("優秀なテスト結果です。定期的なテスト実行で品質を維持してください。")
        case .good:
            recommendations.append("良好なテスト結果です。細かい改善点に取り組んでください。")
        case .acceptable:
            recommendations.append("基本的な品質は確保されています。重要な問題から優先的に対応してください。")
        case .needsImprovement:
            recommendations.append("品質向上が必要です。失敗したテストの原因を調査し、修正してください。")
        case .notStarted:
            recommendations.append("テストを実行してください。")
        }
        
        // Add specific feature recommendations
        if coverage.integrationTests.failed > 0 {
            recommendations.append("統合テストの失敗原因を調査し、データ整合性を確認してください。")
        }
        
        if coverage.securityTests.failed > 0 {
            recommendations.append("セキュリティテストの失敗は重大です。即座に対応してください。")
        }
        
        // Add accessibility recommendations
        recommendations.append("アクセシビリティガイドラインに準拠していることを定期的に確認してください。")
        
        // Add maintenance recommendations
        recommendations.append("新機能追加時は対応するテストケースも追加してください。")
        recommendations.append("テストデータの定期的なクリーンアップを実施してください。")
    }
    
    /// Generates a detailed test report
    func generateDetailedReport() -> String {
        guard let coverage = testCoverage else {
            return "テストサマリーが生成されていません。"
        }
        
        let formatter = DateFormatter()
        formatter.dateStyle = .full
        formatter.timeStyle = .medium
        
        var report = """
        # 家計簿アプリ - 最終テストサマリー
        
        **生成日時:** \(formatter.string(from: Date()))
        **総合評価:** \(overallTestStatus.description)
        **総合カバレッジ:** \(String(format: "%.1f", coverage.overallCoverage * 100))%
        
        ## テストカテゴリ別結果
        
        ### 統合テスト
        - **実行数:** \(coverage.integrationTests.total)
        - **成功:** \(coverage.integrationTests.passed)
        - **失敗:** \(coverage.integrationTests.failed)
        - **成功率:** \(String(format: "%.1f", coverage.integrationTests.coverage * 100))%
        
        ### エンドツーエンドテスト
        - **実行数:** \(coverage.endToEndTests.total)
        - **成功:** \(coverage.endToEndTests.passed)
        - **失敗:** \(coverage.endToEndTests.failed)
        - **成功率:** \(String(format: "%.1f", coverage.endToEndTests.coverage * 100))%
        
        ### セキュリティテスト
        - **実行数:** \(coverage.securityTests.total)
        - **成功:** \(coverage.securityTests.passed)
        - **失敗:** \(coverage.securityTests.failed)
        - **成功率:** \(String(format: "%.1f", coverage.securityTests.coverage * 100))%
        
        ### ユーザビリティテスト
        - **実行数:** \(coverage.usabilityTests.total)
        - **良好:** \(coverage.usabilityTests.passed)
        - **要改善:** \(coverage.usabilityTests.failed)
        - **平均スコア:** \(String(format: "%.1f", coverage.usabilityTests.coverage * 100))/100
        
        ### バリデーションテスト
        - **実行数:** \(coverage.validationTests.total)
        - **成功:** \(coverage.validationTests.passed)
        - **失敗:** \(coverage.validationTests.failed)
        - **成功率:** \(String(format: "%.1f", coverage.validationTests.coverage * 100))%
        
        ## 推奨事項
        
        """
        
        for (index, recommendation) in recommendations.enumerated() {
            report += "\(index + 1). \(recommendation)\n"
        }
        
        report += """
        
        ## 品質評価
        
        \(getQualityAssessment())
        
        ---
        
        *このレポートは家計簿アプリの統合テストシステムによって自動生成されました。*
        """
        
        return report
    }
    
    private func getQualityAssessment() -> String {
        guard let coverage = testCoverage else {
            return "評価データが不足しています。"
        }
        
        let overallCoverage = coverage.overallCoverage
        
        switch overallTestStatus {
        case .excellent:
            return """
            **優秀** - アプリケーションは高い品質基準を満たしています。
            - すべてのテストカテゴリで優秀な結果
            - 本番環境への展開準備完了
            - 継続的な品質維持を推奨
            """
        case .good:
            return """
            **良好** - アプリケーションは良好な品質を保っています。
            - 大部分のテストで良好な結果
            - 軽微な改善点の対応を推奨
            - 本番環境への展開可能
            """
        case .acceptable:
            return """
            **許容範囲** - アプリケーションは基本的な品質要件を満たしています。
            - 重要な機能は正常に動作
            - いくつかの改善点が存在
            - 重要な問題の修正後に展開推奨
            """
        case .needsImprovement:
            return """
            **要改善** - アプリケーションの品質向上が必要です。
            - 複数のテストで問題を検出
            - 本番環境への展開前に修正が必要
            - 品質向上計画の策定を推奨
            """
        case .notStarted:
            return "テストが実行されていません。"
        }
    }
}

// MARK: - Supporting Types

struct TestCoverage {
    let integrationTests: TestCategoryResult
    let endToEndTests: TestCategoryResult
    let securityTests: TestCategoryResult
    let usabilityTests: TestCategoryResult
    let validationTests: TestCategoryResult
    
    var overallCoverage: Double {
        let totalTests = integrationTests.total + endToEndTests.total + securityTests.total + 
                        usabilityTests.total + validationTests.total
        let totalPassed = integrationTests.passed + endToEndTests.passed + securityTests.passed + 
                         usabilityTests.passed + validationTests.passed
        
        return totalTests > 0 ? Double(totalPassed) / Double(totalTests) : 0.0
    }
    
    var totalTests: Int {
        return integrationTests.total + endToEndTests.total + securityTests.total + 
               usabilityTests.total + validationTests.total
    }
    
    var totalPassed: Int {
        return integrationTests.passed + endToEndTests.passed + securityTests.passed + 
               usabilityTests.passed + validationTests.passed
    }
    
    var totalFailed: Int {
        return integrationTests.failed + endToEndTests.failed + securityTests.failed + 
               usabilityTests.failed + validationTests.failed
    }
}

struct TestCategoryResult {
    let total: Int
    let passed: Int
    let failed: Int
    let coverage: Double
    
    var successRate: Double {
        return total > 0 ? Double(passed) / Double(total) : 0.0
    }
    
    var status: TestCategoryStatus {
        if coverage >= 0.95 {
            return .excellent
        } else if coverage >= 0.85 {
            return .good
        } else if coverage >= 0.70 {
            return .acceptable
        } else {
            return .needsImprovement
        }
    }
}

enum TestCategoryStatus {
    case excellent
    case good
    case acceptable
    case needsImprovement
    
    var description: String {
        switch self {
        case .excellent:
            return "優秀"
        case .good:
            return "良好"
        case .acceptable:
            return "許容範囲"
        case .needsImprovement:
            return "要改善"
        }
    }
    
    var color: Color {
        switch self {
        case .excellent:
            return .green
        case .good:
            return .blue
        case .acceptable:
            return .orange
        case .needsImprovement:
            return .red
        }
    }
}

enum OverallTestStatus {
    case notStarted
    case needsImprovement
    case acceptable
    case good
    case excellent
    
    var description: String {
        switch self {
        case .notStarted:
            return "未実行"
        case .needsImprovement:
            return "要改善"
        case .acceptable:
            return "許容範囲"
        case .good:
            return "良好"
        case .excellent:
            return "優秀"
        }
    }
    
    var color: Color {
        switch self {
        case .notStarted:
            return .gray
        case .needsImprovement:
            return .red
        case .acceptable:
            return .orange
        case .good:
            return .blue
        case .excellent:
            return .green
        }
    }
    
    var icon: String {
        switch self {
        case .notStarted:
            return "circle"
        case .needsImprovement:
            return "xmark.seal.fill"
        case .acceptable:
            return "exclamationmark.triangle.fill"
        case .good:
            return "checkmark.circle.fill"
        case .excellent:
            return "star.fill"
        }
    }
}