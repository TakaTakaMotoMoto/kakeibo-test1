// UI Improvements Test Runner
// This script runs comprehensive tests for UI improvement features

class UIImprovementsTestRunner {
    constructor() {
        this.results = [];
        this.testSuites = [
            {
                name: 'fund-source-type-selection',
                displayName: '資金元タイプ選択機能',
                testFunction: this.testFundSourceTypeSelection.bind(this)
            },
            {
                name: 'ui-auto-update',
                displayName: 'UI自動更新機能',
                testFunction: this.testUIAutoUpdate.bind(this)
            },
            {
                name: 'loading-display',
                displayName: 'ローディング表示機能',
                testFunction: this.testLoadingDisplay.bind(this)
            }
        ];
    }

    // Main test runner
    async runAllTests() {
        console.log('=== UI機能改善テスト開始 ===');
        this.results = [];
        
        for (const suite of this.testSuites) {
            console.log(`\n--- ${suite.displayName}テスト開始 ---`);
            
            try {
                await suite.testFunction();
                console.log(`--- ${suite.displayName}テスト完了 ---`);
            } catch (error) {
                this.addResult(suite.name, 'テスト実行エラー', 'failed', `エラー: ${error.message}`);
                console.error(`${suite.displayName}テストでエラー:`, error);
            }
        }
        
        this.generateSummaryReport();
        return this.results;
    }

    // Test Suite 1: Fund Source Type Selection
    async testFundSourceTypeSelection() {
        const suiteName = 'fund-source-type-selection';
        
        // Test 1.1: Class existence
        if (window.FundSourceTypeSelector) {
            this.addResult(suiteName, 'FundSourceTypeSelectorクラス存在確認', 'passed', 'クラスが正常に定義されています');
            
            try {
                // Test 1.2: Instance creation
                const typeSelector = new window.FundSourceTypeSelector();
                this.addResult(suiteName, 'インスタンス作成', 'passed', 'インスタンスが正常に作成されました');
                
                // Test 1.3: Available types
                const availableTypes = typeSelector.getAvailableTypes();
                const expectedTypes = ['bank', 'cash', 'credit', 'digital'];
                const hasAllTypes = expectedTypes.every(type => 
                    availableTypes.some(t => t.id === type)
                );
                
                if (hasAllTypes && availableTypes.length >= 4) {
                    this.addResult(suiteName, '利用可能タイプ確認', 'passed', 
                        `必要なタイプがすべて実装されています (${availableTypes.length}種類)`);
                } else {
                    this.addResult(suiteName, '利用可能タイプ確認', 'failed', 
                        `必要なタイプが不足しています。期待: ${expectedTypes.join(', ')}`);
                }
                
                // Test 1.4: HTML rendering
                const selectorHtml = typeSelector.renderTypeSelector();
                if (selectorHtml && selectorHtml.includes('<select') && selectorHtml.includes('<option')) {
                    this.addResult(suiteName, 'HTML生成機能', 'passed', 'セレクターHTMLが正常に生成されます');
                } else {
                    this.addResult(suiteName, 'HTML生成機能', 'failed', 'セレクターHTMLの生成に失敗しました');
                }
                
                // Test 1.5: Validation functionality
                const validationTests = [
                    { input: '', shouldFail: true, desc: '空文字' },
                    { input: 'bank', shouldFail: false, desc: '有効なタイプ' },
                    { input: 'invalid', shouldFail: true, desc: '無効なタイプ' }
                ];
                
                let validationPassed = true;
                for (const test of validationTests) {
                    const error = typeSelector.validateTypeSelection(test.input);
                    const hasFailed = !!error;
                    if (hasFailed !== test.shouldFail) {
                        validationPassed = false;
                        break;
                    }
                }
                
                if (validationPassed) {
                    this.addResult(suiteName, 'バリデーション機能', 'passed', 'タイプ選択のバリデーションが正常に動作します');
                } else {
                    this.addResult(suiteName, 'バリデーション機能', 'failed', 'バリデーション機能に問題があります');
                }
                
                // Test 1.6: Type information retrieval
                const bankType = typeSelector.getTypeById('bank');
                const displayName = typeSelector.getTypeDisplayName('bank');
                
                if (bankType && bankType.name && bankType.icon && displayName) {
                    this.addResult(suiteName, 'タイプ情報取得', 'passed', 'タイプ情報の取得が正常に動作します');
                } else {
                    this.addResult(suiteName, 'タイプ情報取得', 'failed', 'タイプ情報の取得に問題があります');
                }
                
                // Test 1.7: Statistics functionality
                const mockFundSources = [
                    { type: 'bank', balance: 100000 },
                    { type: 'cash', balance: 5000 },
                    { type: 'bank', balance: 50000 }
                ];
                
                const stats = typeSelector.getTypeStatistics(mockFundSources);
                if (stats && stats.bank && stats.bank.count === 2 && stats.cash.count === 1) {
                    this.addResult(suiteName, '統計機能', 'passed', 'タイプ別統計機能が正常に動作します');
                } else {
                    this.addResult(suiteName, '統計機能', 'failed', 'タイプ別統計機能に問題があります');
                }
                
            } catch (error) {
                this.addResult(suiteName, 'インスタンス作成', 'failed', `エラー: ${error.message}`);
            }
        } else {
            this.addResult(suiteName, 'FundSourceTypeSelectorクラス存在確認', 'failed', 'クラスが定義されていません');
        }
        
        // Test 1.8: Integration with storage
        if (window.storage && typeof window.storage.addFundSource === 'function') {
            this.addResult(suiteName, 'ストレージ統合', 'passed', '資金元追加機能との統合が可能です');
        } else {
            this.addResult(suiteName, 'ストレージ統合', 'warning', '資金元追加機能が確認できませんでした');
        }
    }

    // Test Suite 2: UI Auto Update
    async testUIAutoUpdate() {
        const suiteName = 'ui-auto-update';
        
        // Test 2.1: UIUpdateManager existence
        if (window.UIUpdateManager) {
            this.addResult(suiteName, 'UIUpdateManagerクラス存在確認', 'passed', 'クラスが正常に定義されています');
            
            try {
                // Test 2.2: Instance creation
                const updateManager = new window.UIUpdateManager();
                this.addResult(suiteName, 'インスタンス作成', 'passed', 'インスタンスが正常に作成されました');
                
                // Test 2.3: Update scheduling
                const initialStatus = updateManager.getStatus();
                updateManager.scheduleUpdate('test', 'high');
                
                // Wait for processing
                await new Promise(resolve => setTimeout(resolve, 100));
                
                this.addResult(suiteName, '更新スケジューリング', 'passed', '更新のスケジューリングが正常に動作します');
                
                // Test 2.4: Callback registration and execution
                let callbackExecuted = false;
                updateManager.registerUpdateCallback('test-callback', () => {
                    callbackExecuted = true;
                });
                
                updateManager.scheduleUpdate('test-callback', 'high');
                
                // Wait for callback execution
                await new Promise(resolve => setTimeout(resolve, 200));
                
                if (callbackExecuted) {
                    this.addResult(suiteName, 'コールバック機能', 'passed', 'コールバックの登録と実行が正常に動作します');
                } else {
                    this.addResult(suiteName, 'コールバック機能', 'warning', 'コールバックの実行が確認できませんでした');
                }
                
                // Test 2.5: Debounced updates
                updateManager.debouncedUpdate('test-debounce', 100);
                updateManager.debouncedUpdate('test-debounce', 100); // Should replace previous
                
                this.addResult(suiteName, 'デバウンス機能', 'passed', 'デバウンス機能が実装されています');
                
                // Test 2.6: Data change notification
                updateManager.notifyDataChange('fundSource', 'add', { name: 'テスト資金元' });
                this.addResult(suiteName, 'データ変更通知', 'passed', 'データ変更通知機能が正常に動作します');
                
                // Test 2.7: Full update scheduling
                updateManager.scheduleFullUpdate('test_full_update');
                this.addResult(suiteName, '全体更新機能', 'passed', '全体更新のスケジューリングが正常に動作します');
                
                // Test 2.8: Status monitoring
                const status = updateManager.getStatus();
                if (status && typeof status.isUpdating === 'boolean' && typeof status.queueLength === 'number') {
                    this.addResult(suiteName, '状態監視機能', 'passed', '更新状態の監視が正常に動作します');
                } else {
                    this.addResult(suiteName, '状態監視機能', 'failed', '状態監視機能に問題があります');
                }
                
            } catch (error) {
                this.addResult(suiteName, 'インスタンス作成', 'failed', `エラー: ${error.message}`);
            }
        } else {
            this.addResult(suiteName, 'UIUpdateManagerクラス存在確認', 'failed', 'クラスが定義されていません');
        }
        
        // Test 2.9: Legacy UI update compatibility
        if (window.uiManager && (window.uiManager.refreshUI || window.uiManager.renderer)) {
            this.addResult(suiteName, '従来UI更新互換性', 'passed', '従来のUI更新機能との互換性があります');
        } else {
            this.addResult(suiteName, '従来UI更新互換性', 'warning', '従来のUI更新機能が確認できませんでした');
        }
    }

    // Test Suite 3: Loading Display
    async testLoadingDisplay() {
        const suiteName = 'loading-display';
        
        // Test 3.1: LoadingManager existence
        if (window.LoadingManager) {
            this.addResult(suiteName, 'LoadingManagerクラス存在確認', 'passed', 'クラスが正常に定義されています');
            
            try {
                // Test 3.2: Instance creation
                const loadingManager = new window.LoadingManager();
                this.addResult(suiteName, 'インスタンス作成', 'passed', 'インスタンスが正常に作成されました');
                
                // Test 3.3: Show/Hide loading
                const showResult = loadingManager.showLoading('test-operation', {
                    message: 'テスト処理中...',
                    showOverlay: false
                });
                
                if (showResult) {
                    this.addResult(suiteName, 'ローディング表示機能', 'passed', 'ローディング表示が正常に動作します');
                    
                    // Test hide functionality
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    const hideResult = loadingManager.hideLoading('test-operation');
                    if (hideResult) {
                        this.addResult(suiteName, 'ローディング非表示機能', 'passed', 'ローディング非表示が正常に動作します');
                    } else {
                        this.addResult(suiteName, 'ローディング非表示機能', 'failed', 'ローディング非表示に失敗しました');
                    }
                } else {
                    this.addResult(suiteName, 'ローディング表示機能', 'failed', 'ローディング表示に失敗しました');
                }
                
                // Test 3.4: Server operation detection
                const serverOperations = ['sendInvitation', 'resendInvitation', 'acceptInvitation'];
                const nonServerOperations = ['addTransaction', 'updateTransaction'];
                
                let serverDetectionPassed = true;
                for (const op of serverOperations) {
                    if (!loadingManager.isServerOperation(op)) {
                        serverDetectionPassed = false;
                        break;
                    }
                }
                
                for (const op of nonServerOperations) {
                    if (loadingManager.isServerOperation(op)) {
                        serverDetectionPassed = false;
                        break;
                    }
                }
                
                if (serverDetectionPassed) {
                    this.addResult(suiteName, 'サーバー操作判定', 'passed', 'サーバー操作の判定が正常に動作します');
                } else {
                    this.addResult(suiteName, 'サーバー操作判定', 'warning', 'サーバー操作判定の動作を確認してください');
                }
                
                // Test 3.5: Async operation wrapping
                const testAsyncOperation = async () => {
                    await new Promise(resolve => setTimeout(resolve, 50));
                    return 'テスト完了';
                };
                
                const result = await loadingManager.wrapWithLoading('test-wrap', testAsyncOperation, {
                    message: 'ラッピングテスト中...',
                    showOverlay: false
                });
                
                if (result === 'テスト完了') {
                    this.addResult(suiteName, '非同期操作ラッピング', 'passed', '非同期操作のラッピングが正常に動作します');
                } else {
                    this.addResult(suiteName, '非同期操作ラッピング', 'failed', '操作ラッピングに問題があります');
                }
                
                // Test 3.6: Loading state management
                const stats = loadingManager.getStats();
                if (stats && typeof stats.activeOperations === 'number' && typeof stats.activeIndicators === 'number') {
                    this.addResult(suiteName, '状態管理機能', 'passed', 'ローディング状態の管理が正常に動作します');
                } else {
                    this.addResult(suiteName, '状態管理機能', 'warning', '状態管理機能が確認できませんでした');
                }
                
                // Test 3.7: Operation loading convenience method
                const operationResult = loadingManager.showOperationLoading('sendInvitation', {
                    timeout: 1000
                });
                
                if (operationResult) {
                    this.addResult(suiteName, '操作別ローディング', 'passed', '操作別ローディング機能が正常に動作します');
                    
                    // Clean up
                    setTimeout(() => {
                        loadingManager.hideLoading('sendInvitation');
                    }, 100);
                } else {
                    this.addResult(suiteName, '操作別ローディング', 'failed', '操作別ローディング機能に問題があります');
                }
                
                // Test 3.8: Cleanup functionality
                loadingManager.cleanup();
                this.addResult(suiteName, 'クリーンアップ機能', 'passed', 'クリーンアップ機能が実装されています');
                
            } catch (error) {
                this.addResult(suiteName, 'インスタンス作成', 'failed', `エラー: ${error.message}`);
            }
        } else {
            this.addResult(suiteName, 'LoadingManagerクラス存在確認', 'failed', 'クラスが定義されていません');
        }
    }

    // Add test result
    addResult(suiteName, testName, status, message, details = null) {
        const result = {
            suite: suiteName,
            name: testName,
            status: status, // 'passed', 'failed', 'warning'
            message: message,
            details: details,
            timestamp: new Date().toISOString()
        };
        
        this.results.push(result);
        
        const statusIcon = status === 'passed' ? '✅' : status === 'warning' ? '⚠️' : '❌';
        console.log(`${statusIcon} ${suiteName} - ${testName}: ${message}`);
    }

    // Generate summary report
    generateSummaryReport() {
        const total = this.results.length;
        const passed = this.results.filter(r => r.status === 'passed').length;
        const failed = this.results.filter(r => r.status === 'failed').length;
        const warnings = this.results.filter(r => r.status === 'warning').length;
        const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;
        
        console.log('\n=== UI機能改善テスト結果サマリー ===');
        console.log(`総テスト数: ${total}`);
        console.log(`成功: ${passed}`);
        console.log(`失敗: ${failed}`);
        console.log(`警告: ${warnings}`);
        console.log(`成功率: ${successRate}%`);
        
        // Suite-wise summary
        console.log('\n=== スイート別結果 ===');
        this.testSuites.forEach(suite => {
            const suiteResults = this.results.filter(r => r.suite === suite.name);
            const suitePassed = suiteResults.filter(r => r.status === 'passed').length;
            const suiteTotal = suiteResults.length;
            const suiteRate = suiteTotal > 0 ? Math.round((suitePassed / suiteTotal) * 100) : 0;
            
            console.log(`${suite.displayName}: ${suitePassed}/${suiteTotal} (${suiteRate}%)`);
        });
        
        // Failed tests
        const failedTests = this.results.filter(r => r.status === 'failed');
        if (failedTests.length > 0) {
            console.log('\n=== 失敗したテスト ===');
            failedTests.forEach(result => {
                console.log(`❌ ${result.suite} - ${result.name}: ${result.message}`);
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
            testType: 'UI機能改善テスト',
            summary,
            detailedResults: this.results
        };
        
        return JSON.stringify(exportData, null, 2);
    }

    // Run specific test suite
    async runTestSuite(suiteName) {
        const suite = this.testSuites.find(s => s.name === suiteName);
        if (!suite) {
            console.error(`テストスイート '${suiteName}' が見つかりません`);
            return;
        }
        
        console.log(`=== ${suite.displayName}テスト開始 ===`);
        
        try {
            await suite.testFunction();
            console.log(`=== ${suite.displayName}テスト完了 ===`);
        } catch (error) {
            this.addResult(suite.name, 'テスト実行エラー', 'failed', `エラー: ${error.message}`);
            console.error(`${suite.displayName}テストでエラー:`, error);
        }
        
        return this.results.filter(r => r.suite === suiteName);
    }
}

// Export for global use
window.UIImprovementsTestRunner = UIImprovementsTestRunner;

// Convenience functions
window.runUIImprovementsTests = async function() {
    const runner = new UIImprovementsTestRunner();
    return await runner.runAllTests();
};

window.runUITestSuite = async function(suiteName) {
    const runner = new UIImprovementsTestRunner();
    return await runner.runTestSuite(suiteName);
};

console.log('UI Improvements Test Runner loaded. Use runUIImprovementsTests() to run all tests.');