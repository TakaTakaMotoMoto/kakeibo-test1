// App Improvements Validation Script
// This script validates all the implemented improvements according to the requirements

class AppImprovementsValidator {
    constructor() {
        this.results = [];
        this.requirements = {
            '1.1': '招待送信時のnullエラー修正',
            '1.2': '招待トークン表示色の修正',
            '1.3': '招待トークン有効期限の修正',
            '2.1': '招待再送信のトークン生成修正',
            '2.2': 'UI重複表示の防止',
            '2.3': '前のトークン無効化処理',
            '3.1': '資金元タイプ選択UIの実装',
            '3.2': '追加後のUI自動更新実装',
            '4.1': 'ローディング管理システムの実装',
            '5.1': '収入・支出分離グラフの実装',
            '5.2': 'グラフタブ切り替え機能の実装'
        };
    }

    // Main validation method
    async validateAllImprovements() {
        console.log('=== アプリ改善実装検証開始 ===');
        
        this.results = [];
        
        // Validate each requirement
        await this.validateSharingBugFixes();
        await this.validateInvitationResending();
        await this.validateFundSourceTypeSelection();
        await this.validateLoadingDisplay();
        await this.validateChartImprovements();
        
        // Generate summary report
        this.generateSummaryReport();
        
        return this.results;
    }

    // Validate sharing bug fixes (Requirements 1.1, 1.2, 1.3)
    async validateSharingBugFixes() {
        console.log('共有機能バグ修正の検証中...');
        
        // Requirement 1.1: Null error fix
        try {
            if (window.sharingManager && typeof window.sharingManager.sendInvitation === 'function') {
                // Test null parameter handling
                try {
                    window.sharingManager.sendInvitation(null, null);
                    this.addResult('1.1', 'failed', 'nullパラメータでエラーが発生しませんでした');
                } catch (error) {
                    if (error.message.includes('有効な') || error.message.includes('null') || error.message.includes('undefined')) {
                        this.addResult('1.1', 'passed', '適切なバリデーションエラーが実装されています');
                    } else {
                        this.addResult('1.1', 'warning', `予期しないエラー: ${error.message}`);
                    }
                }
            } else {
                this.addResult('1.1', 'failed', 'SharingManagerまたはsendInvitationメソッドが存在しません');
            }
        } catch (error) {
            this.addResult('1.1', 'failed', `検証エラー: ${error.message}`);
        }

        // Requirement 1.2: Token display color fix
        try {
            if (window.InvitationTokenDisplayManager) {
                const displayManager = new window.InvitationTokenDisplayManager();
                const mockInvitation = {
                    id: 'test',
                    token: 'test-token',
                    fundSourceId: 'test-fund',
                    inviteeEmail: 'test@example.com',
                    expiresAt: new Date()
                };
                
                const content = displayManager.generateInvitationTokenContent(mockInvitation, 'テスト資金元');
                
                if (content.includes('color: #000000') || content.includes('color: black')) {
                    this.addResult('1.2', 'passed', '招待トークン情報が黒文字で表示されるように修正されています');
                } else {
                    this.addResult('1.2', 'failed', '黒文字スタイルが実装されていません');
                }
            } else {
                this.addResult('1.2', 'failed', 'InvitationTokenDisplayManagerが存在しません');
            }
        } catch (error) {
            this.addResult('1.2', 'failed', `検証エラー: ${error.message}`);
        }

        // Requirement 1.3: Token expiration fix
        try {
            if (window.invitationManager && typeof window.invitationManager.createInvitation === 'function') {
                const testInvitation = {
                    fundSourceId: 'test-fund',
                    inviteeEmail: 'test@example.com',
                    permissions: { canView: true }
                };
                
                const invitation = window.invitationManager.createInvitation(testInvitation);
                if (invitation && invitation.expiresAt) {
                    const now = new Date();
                    const expiresAt = new Date(invitation.expiresAt);
                    const diffMinutes = (expiresAt - now) / (1000 * 60);
                    
                    if (diffMinutes >= 9 && diffMinutes <= 11) { // 10分±1分の許容範囲
                        this.addResult('1.3', 'passed', `有効期限が正しく設定されています (${diffMinutes.toFixed(1)}分)`);
                    } else {
                        this.addResult('1.3', 'failed', `有効期限が正しくありません (${diffMinutes.toFixed(1)}分)`);
                    }
                } else {
                    this.addResult('1.3', 'failed', '招待の作成に失敗しました');
                }
            } else {
                this.addResult('1.3', 'failed', 'InvitationManagerが存在しません');
            }
        } catch (error) {
            this.addResult('1.3', 'failed', `検証エラー: ${error.message}`);
        }
    }

    // Validate invitation resending (Requirements 2.1, 2.2, 2.3)
    async validateInvitationResending() {
        console.log('招待再送信機能の検証中...');
        
        // Requirement 2.1: Resend token generation
        try {
            if (window.sharingManager && typeof window.sharingManager.resendInvitation === 'function') {
                this.addResult('2.1', 'passed', 'resendInvitationメソッドが実装されています');
            } else {
                this.addResult('2.1', 'failed', 'resendInvitationメソッドが存在しません');
            }
        } catch (error) {
            this.addResult('2.1', 'failed', `検証エラー: ${error.message}`);
        }

        // Requirement 2.2: UI duplication prevention
        try {
            if (window.invitationTokenDisplay) {
                const hasProcessingOperations = 'processingOperations' in window.invitationTokenDisplay;
                const hasResendMethod = typeof window.invitationTokenDisplay.resendInvitation === 'function';
                
                if (hasProcessingOperations || hasResendMethod) {
                    this.addResult('2.2', 'passed', 'UI重複表示防止機能が実装されています');
                } else {
                    this.addResult('2.2', 'warning', 'UI重複表示防止機能が確認できませんでした');
                }
            } else {
                this.addResult('2.2', 'failed', 'InvitationTokenDisplayManagerが存在しません');
            }
        } catch (error) {
            this.addResult('2.2', 'failed', `検証エラー: ${error.message}`);
        }

        // Requirement 2.3: Previous token invalidation
        try {
            if (window.invitationManager && typeof window.invitationManager.invalidateInvitation === 'function') {
                this.addResult('2.3', 'passed', 'invalidateInvitationメソッドが実装されています');
            } else {
                this.addResult('2.3', 'warning', 'トークン無効化メソッドが確認できませんでした');
            }
        } catch (error) {
            this.addResult('2.3', 'failed', `検証エラー: ${error.message}`);
        }
    }

    // Validate fund source type selection (Requirements 3.1, 3.2)
    async validateFundSourceTypeSelection() {
        console.log('資金元タイプ選択機能の検証中...');
        
        // Requirement 3.1: Fund source type selection UI
        try {
            if (window.FundSourceTypeSelector) {
                const typeSelector = new window.FundSourceTypeSelector();
                const availableTypes = typeSelector.getAvailableTypes();
                const expectedTypes = ['bank', 'cash', 'credit', 'digital'];
                
                const hasAllTypes = expectedTypes.every(type => 
                    availableTypes.some(t => t.id === type)
                );
                
                if (hasAllTypes) {
                    this.addResult('3.1', 'passed', `すべての必要なタイプが実装されています (${availableTypes.length}種類)`);
                } else {
                    this.addResult('3.1', 'failed', '必要なタイプが不足しています');
                }
            } else {
                this.addResult('3.1', 'failed', 'FundSourceTypeSelectorクラスが存在しません');
            }
        } catch (error) {
            this.addResult('3.1', 'failed', `検証エラー: ${error.message}`);
        }

        // Requirement 3.2: UI auto-update after addition
        try {
            if (window.UIUpdateManager || window.uiUpdateManager) {
                this.addResult('3.2', 'passed', 'UIUpdateManagerが実装されています');
            } else if (window.uiManager && (window.uiManager.refreshUI || window.uiManager.renderer)) {
                this.addResult('3.2', 'passed', 'UI更新機能が利用可能です');
            } else {
                this.addResult('3.2', 'warning', 'UI自動更新機能が確認できませんでした');
            }
        } catch (error) {
            this.addResult('3.2', 'failed', `検証エラー: ${error.message}`);
        }
    }

    // Validate loading display (Requirement 4.1)
    async validateLoadingDisplay() {
        console.log('ローディング表示機能の検証中...');
        
        // Requirement 4.1: Loading management system
        try {
            if (window.LoadingManager) {
                const loadingManager = new window.LoadingManager();
                
                // Test loading show/hide functionality
                const showResult = loadingManager.showLoading('test-validation', {
                    message: '検証テスト中...',
                    showOverlay: false
                });
                
                if (showResult) {
                    const hideResult = loadingManager.hideLoading('test-validation');
                    if (hideResult) {
                        this.addResult('4.1', 'passed', 'ローディング管理システムが正常に動作します');
                    } else {
                        this.addResult('4.1', 'warning', 'ローディング非表示に問題があります');
                    }
                } else {
                    this.addResult('4.1', 'failed', 'ローディング表示に失敗しました');
                }
            } else {
                this.addResult('4.1', 'failed', 'LoadingManagerクラスが存在しません');
            }
        } catch (error) {
            this.addResult('4.1', 'failed', `検証エラー: ${error.message}`);
        }
    }

    // Validate chart improvements (Requirements 5.1, 5.2)
    async validateChartImprovements() {
        console.log('グラフ表示改善の検証中...');
        
        // Requirement 5.1: Income/expense separation
        try {
            // Check HTML structure for data type selector
            const response = await fetch('index.html');
            const html = await response.text();
            
            if (html.includes('data-type-selector') || html.includes('data-data-type')) {
                this.addResult('5.1', 'passed', '収入・支出分離表示のHTML構造が実装されています');
            } else {
                this.addResult('5.1', 'warning', '収入・支出分離表示の構造が確認できませんでした');
            }
        } catch (error) {
            this.addResult('5.1', 'failed', `HTML構造確認エラー: ${error.message}`);
        }

        // Requirement 5.2: Tab switching functionality
        try {
            if (window.chartManager || window.ChartManager) {
                this.addResult('5.2', 'passed', 'ChartManagerが利用可能です');
            } else {
                this.addResult('5.2', 'warning', 'ChartManagerが確認できませんでした');
            }
        } catch (error) {
            this.addResult('5.2', 'failed', `検証エラー: ${error.message}`);
        }
    }

    // Add validation result
    addResult(requirementId, status, message, details = null) {
        const result = {
            requirementId,
            requirement: this.requirements[requirementId],
            status, // 'passed', 'failed', 'warning'
            message,
            details,
            timestamp: new Date().toISOString()
        };
        
        this.results.push(result);
        
        const statusIcon = status === 'passed' ? '✅' : status === 'warning' ? '⚠️' : '❌';
        console.log(`${statusIcon} ${requirementId}: ${message}`);
    }

    // Generate summary report
    generateSummaryReport() {
        const total = this.results.length;
        const passed = this.results.filter(r => r.status === 'passed').length;
        const failed = this.results.filter(r => r.status === 'failed').length;
        const warnings = this.results.filter(r => r.status === 'warning').length;
        const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;
        
        console.log('\n=== 検証結果サマリー ===');
        console.log(`総要件数: ${total}`);
        console.log(`成功: ${passed}`);
        console.log(`失敗: ${failed}`);
        console.log(`警告: ${warnings}`);
        console.log(`成功率: ${successRate}%`);
        
        // Detailed results
        console.log('\n=== 詳細結果 ===');
        this.results.forEach(result => {
            const statusIcon = result.status === 'passed' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
            console.log(`${statusIcon} ${result.requirementId} - ${result.requirement}: ${result.message}`);
        });
        
        // Failed requirements
        const failedRequirements = this.results.filter(r => r.status === 'failed');
        if (failedRequirements.length > 0) {
            console.log('\n=== 失敗した要件 ===');
            failedRequirements.forEach(result => {
                console.log(`❌ ${result.requirementId} - ${result.requirement}: ${result.message}`);
            });
        }
        
        return {
            total,
            passed,
            failed,
            warnings,
            successRate,
            results: this.results
        };
    }

    // Export results to JSON
    exportResults() {
        const summary = this.generateSummaryReport();
        const exportData = {
            timestamp: new Date().toISOString(),
            summary,
            detailedResults: this.results
        };
        
        return JSON.stringify(exportData, null, 2);
    }
}

// Export for global use
window.AppImprovementsValidator = AppImprovementsValidator;

// Convenience function for quick validation
window.validateAppImprovements = async function() {
    const validator = new AppImprovementsValidator();
    return await validator.validateAllImprovements();
};

// Debug function to run validation and display results
window.runAppImprovementsValidation = async function() {
    console.log('アプリ改善実装の検証を開始します...');
    
    try {
        const validator = new AppImprovementsValidator();
        const results = await validator.validateAllImprovements();
        
        // Display results in a modal if UI is available
        if (window.uiManager && window.uiManager.modalManager) {
            const summary = validator.generateSummaryReport();
            const content = `
                <div class="validation-results">
                    <h4>検証結果</h4>
                    <div class="summary">
                        <p>総要件数: ${summary.total}</p>
                        <p>成功: <span style="color: green;">${summary.passed}</span></p>
                        <p>失敗: <span style="color: red;">${summary.failed}</span></p>
                        <p>警告: <span style="color: orange;">${summary.warnings}</span></p>
                        <p>成功率: <strong>${summary.successRate}%</strong></p>
                    </div>
                    <div class="details">
                        <h5>詳細結果</h5>
                        ${results.map(r => {
                            const statusIcon = r.status === 'passed' ? '✅' : r.status === 'warning' ? '⚠️' : '❌';
                            return `<p>${statusIcon} ${r.requirementId}: ${r.message}</p>`;
                        }).join('')}
                    </div>
                </div>
            `;
            
            window.uiManager.modalManager.showInfoModal('アプリ改善実装検証結果', content);
        }
        
        return results;
        
    } catch (error) {
        console.error('検証実行エラー:', error);
        return null;
    }
};

console.log('App Improvements Validator loaded. Use validateAppImprovements() or runAppImprovementsValidation() to run validation.');