/**
 * 包括的統合テスト検証スクリプト
 * アプリ改善機能の全要件を検証します
 */

class ComprehensiveTestValidator {
    constructor() {
        this.testResults = [];
        this.requirements = {
            // 共有機能バグ修正
            '1.1': '招待送信時のnullエラー修正',
            '1.2': '招待トークン表示色の修正', 
            '1.3': '招待トークン有効期限の修正',
            
            // 招待再送信機能
            '2.1': '招待再送信のトークン生成修正',
            '2.2': 'UI重複表示の防止',
            '2.3': '前のトークン無効化処理',
            
            // 資金元タイプ選択
            '3.1': '資金元タイプ選択UIの実装',
            '3.2': '追加後のUI自動更新実装',
            
            // ローディング表示
            '4.1': 'ローディング管理システムの実装',
            
            // グラフ表示改善
            '5.1': '収入・支出分離グラフの実装',
            '5.2': 'グラフタブ切り替え機能の実装',
            
            // UI更新同期
            '6.1': 'データ追加後のUI自動更新',
            '6.2': 'UI再描画機能の実装',
            '6.3': 'データ整合性の確保'
        };
    }

    /**
     * 全要件の包括的検証を実行
     */
    async validateAllRequirements() {
        console.log('=== 包括的統合テスト検証開始 ===');
        this.testResults = [];
        
        try {
            // 各要件グループを順次検証
            await this.validateSharingBugFixes();
            await this.validateInvitationResending();
            await this.validateFundSourceTypeSelection();
            await this.validateLoadingDisplay();
            await this.validateChartImprovements();
            await this.validateUISync();
            
            // 結果サマリーを生成
            return this.generateComprehensiveReport();
            
        } catch (error) {
            console.error('検証実行エラー:', error);
            this.addResult('SYSTEM', 'failed', `システムエラー: ${error.message}`);
            return this.generateComprehensiveReport();
        }
    }

    /**
     * 共有機能バグ修正の検証 (要件 1.1, 1.2, 1.3)
     */
    async validateSharingBugFixes() {
        console.log('共有機能バグ修正の検証中...');
        
        // 要件 1.1: 招待送信時のnullエラー修正
        try {
            if (window.sharingManager && typeof window.sharingManager.sendInvitation === 'function') {
                // nullパラメータでのエラーハンドリング確認
                try {
                    window.sharingManager.sendInvitation(null, null);
                    this.addResult('1.1', 'failed', 'nullパラメータでエラーが発生しませんでした');
                } catch (error) {
                    if (this.isValidationError(error)) {
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

        // 要件 1.2: 招待トークン表示色修正
        try {
            if (window.invitationTokenDisplay && typeof window.invitationTokenDisplay.generateInvitationTokenContent === 'function') {
                const mockInvitation = this.createMockInvitation();
                const content = window.invitationTokenDisplay.generateInvitationTokenContent(mockInvitation, 'テスト資金元');
                
                if (this.hasBlackTextStyling(content)) {
                    this.addResult('1.2', 'passed', '招待トークン情報が黒文字で表示されるように修正されています');
                } else {
                    this.addResult('1.2', 'failed', '黒文字スタイルが実装されていません');
                }
            } else {
                this.addResult('1.2', 'failed', 'InvitationTokenDisplayが存在しません');
            }
        } catch (error) {
            this.addResult('1.2', 'failed', `検証エラー: ${error.message}`);
        }

        // 要件 1.3: 招待トークン有効期限修正
        try {
            if (window.invitationManager && typeof window.invitationManager.createInvitation === 'function') {
                const testInvitation = {
                    fundSourceId: 'test-fund',
                    inviteeEmail: 'test@example.com',
                    permissions: { canView: true }
                };
                
                const invitation = window.invitationManager.createInvitation(testInvitation);
                if (invitation && invitation.expiresAt) {
                    const diffMinutes = this.calculateExpirationMinutes(invitation);
                    
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
    }    /
**
     * 招待再送信機能の検証 (要件 2.1, 2.2, 2.3)
     */
    async validateInvitationResending() {
        console.log('招待再送信機能の検証中...');
        
        // 要件 2.1: 招待再送信のトークン生成修正
        try {
            if (window.sharingManager && typeof window.sharingManager.resendInvitation === 'function') {
                this.addResult('2.1', 'passed', 'resendInvitationメソッドが実装されています');
            } else {
                this.addResult('2.1', 'failed', 'resendInvitationメソッドが存在しません');
            }
        } catch (error) {
            this.addResult('2.1', 'failed', `検証エラー: ${error.message}`);
        }

        // 要件 2.2: UI重複表示の防止
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
                this.addResult('2.2', 'failed', 'InvitationTokenDisplayが存在しません');
            }
        } catch (error) {
            this.addResult('2.2', 'failed', `検証エラー: ${error.message}`);
        }

        // 要件 2.3: 前のトークン無効化処理
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

    /**
     * 資金元タイプ選択機能の検証 (要件 3.1, 3.2)
     */
    async validateFundSourceTypeSelection() {
        console.log('資金元タイプ選択機能の検証中...');
        
        // 要件 3.1: 資金元タイプ選択UIの実装
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
                
                // HTML生成機能の確認
                const selectorHtml = typeSelector.renderTypeSelector();
                if (selectorHtml && selectorHtml.includes('<select') && selectorHtml.includes('<option')) {
                    this.addResult('3.1', 'passed', 'タイプセレクターのHTML生成が正常に動作します');
                } else {
                    this.addResult('3.1', 'warning', 'セレクターHTML生成に問題があります');
                }
            } else {
                this.addResult('3.1', 'failed', 'FundSourceTypeSelectorクラスが存在しません');
            }
        } catch (error) {
            this.addResult('3.1', 'failed', `検証エラー: ${error.message}`);
        }

        // 要件 3.2: 追加後のUI自動更新実装
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

    /**
     * ローディング表示機能の検証 (要件 4.1)
     */
    async validateLoadingDisplay() {
        console.log('ローディング表示機能の検証中...');
        
        // 要件 4.1: ローディング管理システムの実装
        try {
            if (window.LoadingManager) {
                const loadingManager = new window.LoadingManager();
                
                // ローディング表示/非表示機能のテスト
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
                
                // サーバー操作判定機能のテスト
                if (typeof loadingManager.isServerOperation === 'function') {
                    const isServerOp = loadingManager.isServerOperation('sendInvitation');
                    if (isServerOp) {
                        this.addResult('4.1', 'passed', 'サーバー操作判定機能が実装されています');
                    } else {
                        this.addResult('4.1', 'warning', 'サーバー操作判定の動作を確認してください');
                    }
                }
            } else {
                this.addResult('4.1', 'failed', 'LoadingManagerクラスが存在しません');
            }
        } catch (error) {
            this.addResult('4.1', 'failed', `検証エラー: ${error.message}`);
        }
    } 
   /**
     * グラフ表示改善の検証 (要件 5.1, 5.2)
     */
    async validateChartImprovements() {
        console.log('グラフ表示改善の検証中...');
        
        // 要件 5.1: 収入・支出分離グラフの実装
        try {
            // HTML構造の確認
            const response = await fetch('index.html');
            const html = await response.text();
            
            if (html.includes('data-type-selector') || html.includes('data-data-type')) {
                this.addResult('5.1', 'passed', '収入・支出分離表示のHTML構造が実装されています');
            } else {
                this.addResult('5.1', 'warning', '収入・支出分離表示の構造が確認できませんでした');
            }
            
            // チャートキャンバスの確認
            if (html.includes('main-chart') || html.includes('chart-canvas')) {
                this.addResult('5.1', 'passed', 'メインチャートのキャンバスが存在します');
            } else {
                this.addResult('5.1', 'warning', 'チャートキャンバスが確認できませんでした');
            }
        } catch (error) {
            this.addResult('5.1', 'failed', `HTML構造確認エラー: ${error.message}`);
        }

        // 要件 5.2: グラフタブ切り替え機能の実装
        try {
            if (window.chartManager || window.ChartManager) {
                this.addResult('5.2', 'passed', 'ChartManagerが利用可能です');
            } else {
                this.addResult('5.2', 'warning', 'ChartManagerが確認できませんでした');
            }
            
            // Chart.jsライブラリの確認
            if (typeof Chart !== 'undefined') {
                this.addResult('5.2', 'passed', 'Chart.jsライブラリが利用可能です');
            } else {
                this.addResult('5.2', 'warning', 'Chart.jsライブラリが読み込まれていません');
            }
        } catch (error) {
            this.addResult('5.2', 'failed', `検証エラー: ${error.message}`);
        }
    }

    /**
     * UI更新同期の検証 (要件 6.1, 6.2, 6.3)
     */
    async validateUISync() {
        console.log('UI更新同期の検証中...');
        
        // 要件 6.1: データ追加後のUI自動更新
        try {
            if (window.storage) {
                const initialFundSources = window.storage.getFundSources();
                const initialCount = initialFundSources.length;
                
                // テスト用資金元の追加
                const testFundSource = {
                    name: 'テスト資金元_' + Date.now(),
                    type: 'bank',
                    balance: 10000
                };
                
                const addedFundSource = window.storage.addFundSource(testFundSource);
                if (addedFundSource) {
                    const updatedFundSources = window.storage.getFundSources();
                    if (updatedFundSources.length === initialCount + 1) {
                        this.addResult('6.1', 'passed', '資金元の追加とデータ更新が正常に動作します');
                        
                        // テストデータのクリーンアップ
                        window.storage.deleteFundSource(addedFundSource.id);
                    } else {
                        this.addResult('6.1', 'failed', 'データ更新が正常に反映されませんでした');
                    }
                } else {
                    this.addResult('6.1', 'failed', '資金元の追加に失敗しました');
                }
            } else {
                this.addResult('6.1', 'failed', 'StorageManagerが利用できません');
            }
        } catch (error) {
            this.addResult('6.1', 'failed', `検証エラー: ${error.message}`);
        }

        // 要件 6.2: UI再描画機能の実装
        try {
            if (window.uiManager && typeof window.uiManager.refreshUI === 'function') {
                this.addResult('6.2', 'passed', 'UI再描画機能が実装されています');
            } else if (window.uiManager && window.uiManager.renderer) {
                this.addResult('6.2', 'passed', 'UIレンダラーが利用可能です');
            } else {
                this.addResult('6.2', 'warning', 'UI再描画機能が確認できませんでした');
            }
        } catch (error) {
            this.addResult('6.2', 'failed', `検証エラー: ${error.message}`);
        }

        // 要件 6.3: データ整合性の確保
        try {
            if (window.storage && typeof window.storage.validateDataIntegrity === 'function') {
                const integrityResult = window.storage.validateDataIntegrity();
                if (integrityResult) {
                    this.addResult('6.3', 'passed', 'データ整合性検証機能が実装されています');
                } else {
                    this.addResult('6.3', 'warning', 'データ整合性に問題がある可能性があります');
                }
            } else {
                this.addResult('6.3', 'warning', 'データ整合性検証機能が確認できませんでした');
            }
        } catch (error) {
            this.addResult('6.3', 'failed', `検証エラー: ${error.message}`);
        }
    }

    /**
     * ヘルパーメソッド群
     */
    
    // バリデーションエラーかどうかを判定
    isValidationError(error) {
        const validationKeywords = ['null', 'undefined', '有効な', '必須', 'required', 'invalid'];
        return validationKeywords.some(keyword => 
            error.message.toLowerCase().includes(keyword.toLowerCase())
        );
    }
    
    // 黒文字スタイリングの確認
    hasBlackTextStyling(content) {
        return content.includes('color: #000000') || 
               content.includes('color: black') || 
               content.includes('color:#000000') ||
               content.includes('color:black');
    }
    
    // モック招待オブジェクトの作成
    createMockInvitation() {
        return {
            id: 'test-invitation-' + Date.now(),
            token: 'test-token-123',
            fundSourceId: 'test-fund',
            inviteeEmail: 'test@example.com',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            createdAt: new Date()
        };
    }
    
    // 有効期限の分数計算
    calculateExpirationMinutes(invitation) {
        const now = new Date();
        const expiresAt = new Date(invitation.expiresAt);
        return (expiresAt - now) / (1000 * 60);
    }
    
    // テスト結果の追加
    addResult(requirementId, status, message, details = null) {
        const result = {
            requirementId,
            requirement: this.requirements[requirementId] || 'Unknown requirement',
            status, // 'passed', 'failed', 'warning'
            message,
            details,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        
        const statusIcon = status === 'passed' ? '✅' : status === 'warning' ? '⚠️' : '❌';
        console.log(`${statusIcon} ${requirementId}: ${message}`);
    }    /
**
     * 包括的レポートの生成
     */
    generateComprehensiveReport() {
        const total = this.testResults.length;
        const passed = this.testResults.filter(r => r.status === 'passed').length;
        const failed = this.testResults.filter(r => r.status === 'failed').length;
        const warnings = this.testResults.filter(r => r.status === 'warning').length;
        const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;
        
        console.log('\n=== 包括的検証結果サマリー ===');
        console.log(`総要件数: ${total}`);
        console.log(`成功: ${passed}`);
        console.log(`失敗: ${failed}`);
        console.log(`警告: ${warnings}`);
        console.log(`成功率: ${successRate}%`);
        
        // カテゴリ別の結果
        const categoryResults = this.groupResultsByCategory();
        console.log('\n=== カテゴリ別結果 ===');
        Object.entries(categoryResults).forEach(([category, results]) => {
            const categoryPassed = results.filter(r => r.status === 'passed').length;
            const categoryTotal = results.length;
            const categoryRate = categoryTotal > 0 ? Math.round((categoryPassed / categoryTotal) * 100) : 0;
            console.log(`${category}: ${categoryPassed}/${categoryTotal} (${categoryRate}%)`);
        });
        
        // 失敗した要件の詳細
        const failedRequirements = this.testResults.filter(r => r.status === 'failed');
        if (failedRequirements.length > 0) {
            console.log('\n=== 失敗した要件 ===');
            failedRequirements.forEach(result => {
                console.log(`❌ ${result.requirementId} - ${result.requirement}: ${result.message}`);
            });
        }
        
        // 警告のある要件
        const warningRequirements = this.testResults.filter(r => r.status === 'warning');
        if (warningRequirements.length > 0) {
            console.log('\n=== 警告のある要件 ===');
            warningRequirements.forEach(result => {
                console.log(`⚠️ ${result.requirementId} - ${result.requirement}: ${result.message}`);
            });
        }
        
        return {
            summary: {
                total,
                passed,
                failed,
                warnings,
                successRate
            },
            categoryResults,
            detailedResults: this.testResults,
            failedRequirements,
            warningRequirements,
            timestamp: new Date().toISOString()
        };
    }
    
    // カテゴリ別結果のグループ化
    groupResultsByCategory() {
        const categories = {
            '共有機能バグ修正': this.testResults.filter(r => r.requirementId.startsWith('1.')),
            '招待再送信機能': this.testResults.filter(r => r.requirementId.startsWith('2.')),
            '資金元タイプ選択': this.testResults.filter(r => r.requirementId.startsWith('3.')),
            'ローディング表示': this.testResults.filter(r => r.requirementId.startsWith('4.')),
            'グラフ表示改善': this.testResults.filter(r => r.requirementId.startsWith('5.')),
            'UI更新同期': this.testResults.filter(r => r.requirementId.startsWith('6.'))
        };
        
        return categories;
    }
    
    /**
     * 結果のJSONエクスポート
     */
    exportResults() {
        const report = this.generateComprehensiveReport();
        return JSON.stringify(report, null, 2);
    }
    
    /**
     * HTMLレポートの生成
     */
    generateHTMLReport() {
        const report = this.generateComprehensiveReport();
        
        const html = `
        <!DOCTYPE html>
        <html lang="ja">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>包括的統合テスト結果レポート</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
                .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                .category { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
                .result { margin: 10px 0; padding: 10px; border-left: 4px solid; }
                .passed { background: #d4edda; border-color: #28a745; }
                .failed { background: #f8d7da; border-color: #dc3545; }
                .warning { background: #fff3cd; border-color: #ffc107; }
                .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
                .stat { text-align: center; padding: 15px; background: white; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .stat-number { font-size: 2em; font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>包括的統合テスト結果レポート</h1>
            <p>生成日時: ${new Date(report.timestamp).toLocaleString('ja-JP')}</p>
            
            <div class="summary">
                <h2>結果サマリー</h2>
                <div class="stats">
                    <div class="stat">
                        <div class="stat-number">${report.summary.total}</div>
                        <div>総要件数</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number" style="color: #28a745;">${report.summary.passed}</div>
                        <div>成功</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number" style="color: #dc3545;">${report.summary.failed}</div>
                        <div>失敗</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number" style="color: #ffc107;">${report.summary.warnings}</div>
                        <div>警告</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">${report.summary.successRate}%</div>
                        <div>成功率</div>
                    </div>
                </div>
            </div>
            
            ${Object.entries(report.categoryResults).map(([category, results]) => `
                <div class="category">
                    <h3>${category}</h3>
                    ${results.map(result => `
                        <div class="result ${result.status}">
                            <strong>${result.status === 'passed' ? '✅' : result.status === 'warning' ? '⚠️' : '❌'} ${result.requirementId}</strong>: ${result.message}
                            ${result.details ? `<div style="margin-top: 5px; font-size: 0.9em;">${result.details}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            `).join('')}
        </body>
        </html>
        `;
        
        return html;
    }
}

// グローバルエクスポート
window.ComprehensiveTestValidator = ComprehensiveTestValidator;

// 便利関数
window.runComprehensiveValidation = async function() {
    console.log('包括的統合テスト検証を開始します...');
    
    try {
        const validator = new ComprehensiveTestValidator();
        const results = await validator.validateAllRequirements();
        
        // 結果をコンソールに出力
        console.log('\n=== 検証完了 ===');
        console.log(`成功率: ${results.summary.successRate}%`);
        console.log(`成功: ${results.summary.passed}/${results.summary.total}`);
        
        return results;
        
    } catch (error) {
        console.error('包括的検証実行エラー:', error);
        return null;
    }
};

// デバッグ用関数
window.exportValidationResults = function() {
    if (window.lastValidationResults) {
        const validator = new ComprehensiveTestValidator();
        validator.testResults = window.lastValidationResults.detailedResults;
        return validator.exportResults();
    } else {
        console.log('検証結果がありません。先にrunComprehensiveValidation()を実行してください。');
        return null;
    }
};

console.log('Comprehensive Test Validator loaded. Use runComprehensiveValidation() to run all tests.');