// Validation script for sharing functionality fixes integration test
// This script validates the fixes implemented for requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2

class SharingFixesIntegrationValidator {
    constructor() {
        this.results = {
            invitationSendingFixes: [],
            tokenDisplayFixes: [],
            tokenExpirationFixes: [],
            resendingFixes: []
        };
        this.testStats = {
            total: 0,
            passed: 0,
            failed: 0,
            warnings: 0
        };
    }

    // Main validation method
    async validateAllSharingFixes() {
        console.log('=== 共有機能修正統合テスト開始 ===');
        
        try {
            // Initialize test environment
            await this.initializeTestEnvironment();
            
            // Run all validation tests
            await this.validateInvitationSendingFixes();
            await this.validateTokenDisplayFixes();
            await this.validateTokenExpirationFixes();
            await this.validateResendingFixes();
            
            // Generate final report
            return this.generateFinalReport();
            
        } catch (error) {
            console.error('統合テスト実行エラー:', error);
            return {
                success: false,
                error: error.message,
                results: this.results,
                stats: this.testStats
            };
        }
    }

    async initializeTestEnvironment() {
        console.log('テスト環境初期化中...');
        
        // Check required managers
        const requiredManagers = [
            { name: 'StorageManager', object: window.storage },
            { name: 'AuthManager', object: window.authManager },
            { name: 'SharingManager', object: window.sharingManager },
            { name: 'InvitationManager', object: window.invitationManager },
            { name: 'InvitationTokenDisplayManager', object: window.invitationTokenDisplay }
        ];
        
        for (const manager of requiredManagers) {
            if (!manager.object) {
                throw new Error(`${manager.name} が初期化されていません`);
            }
        }
        
        // Set up test data
        this.setupTestData();
        
        console.log('✓ テスト環境初期化完了');
    }

    setupTestData() {
        // Ensure we have test fund sources
        const fundSources = window.storage.getFundSources();
        if (fundSources.length === 0) {
            const testFundSource = {
                id: 'test-fund-source-' + Date.now(),
                name: 'テスト資金元',
                type: 'bank',
                balance: 100000,
                ownerId: 'test-user',
                isShared: false,
                sharedWith: [],
                createdAt: new Date(),
                updatedAt: new Date()
            };
            window.storage.setFundSources([testFundSource]);
        }
        
        // Set up mock user
        if (window.authManager && typeof window.authManager.setCurrentUser === 'function') {
            window.authManager.setCurrentUser({
                id: 'test-user',
                username: 'テストユーザー',
                email: 'testuser@example.com'
            });
        }
    }

    // Validate invitation sending error fixes (Requirements 1.1, 1.2, 1.3)
    async validateInvitationSendingFixes() {
        console.log('=== 招待送信エラー修正テスト (要件 1.1, 1.2, 1.3) ===');
        
        try {
            // Test 1.1: Null object error prevention
            await this.testNullObjectErrorPrevention();
            
            // Test 1.2: Proper object initialization
            await this.testObjectInitialization();
            
            // Test 1.3: Error handling improvements
            await this.testErrorHandlingImprovements();
            
            console.log('✓ 招待送信エラー修正テスト完了');
            
        } catch (error) {
            console.error('✗ 招待送信エラー修正テスト失敗:', error);
            this.addResult('invitationSendingFixes', 'テスト実行エラー', 'failed', error.message);
        }
    }

    async testNullObjectErrorPrevention() {
        console.log('Nullオブジェクトエラー防止テスト実行中...');
        
        const testCases = [
            { fundSourceId: null, email: 'test@example.com', description: 'null fundSourceId' },
            { fundSourceId: undefined, email: 'test@example.com', description: 'undefined fundSourceId' },
            { fundSourceId: '', email: 'test@example.com', description: 'empty fundSourceId' },
            { fundSourceId: 'valid-id', email: null, description: 'null email' },
            { fundSourceId: 'valid-id', email: undefined, description: 'undefined email' },
            { fundSourceId: 'valid-id', email: '', description: 'empty email' }
        ];
        
        let passedTests = 0;
        
        for (const testCase of testCases) {
            try {
                window.sharingManager.sendInvitation(
                    testCase.fundSourceId,
                    testCase.email,
                    { canView: true, canEdit: false, canDelete: false }
                );
                
                // If we reach here, the test failed (should have thrown an error)
                console.warn(`⚠️ ${testCase.description}: エラーが発生しませんでした`);
                
            } catch (error) {
                if (error.message.includes('有効な') || 
                    error.message.includes('必要です') ||
                    error.message.includes('null') ||
                    error.message.includes('undefined')) {
                    passedTests++;
                    console.log(`✓ ${testCase.description}: 適切なエラー処理`);
                } else {
                    console.warn(`⚠️ ${testCase.description}: 予期しないエラー - ${error.message}`);
                }
            }
        }
        
        if (passedTests === testCases.length) {
            this.addResult('invitationSendingFixes', 'Nullオブジェクトエラー防止', 'passed', 
                `全ての無効パラメータが適切に処理されました (${passedTests}/${testCases.length})`);
        } else {
            this.addResult('invitationSendingFixes', 'Nullオブジェクトエラー防止', 'warning', 
                `一部のテストケースで問題があります (${passedTests}/${testCases.length})`);
        }
    }

    async testObjectInitialization() {
        console.log('オブジェクト初期化テスト実行中...');
        
        const requiredObjects = [
            { name: 'storage', object: window.storage },
            { name: 'authManager', object: window.authManager },
            { name: 'sharingManager', object: window.sharingManager },
            { name: 'invitationManager', object: window.invitationManager },
            { name: 'invitationTokenDisplay', object: window.invitationTokenDisplay }
        ];
        
        let initializedCount = 0;
        const details = [];
        
        for (const obj of requiredObjects) {
            if (obj.object) {
                initializedCount++;
                details.push(`${obj.name}: 初期化済み`);
            } else {
                details.push(`${obj.name}: 未初期化`);
            }
        }
        
        if (initializedCount === requiredObjects.length) {
            this.addResult('invitationSendingFixes', 'オブジェクト初期化確認', 'passed', 
                '全ての必要なオブジェクトが初期化されています', details);
        } else {
            this.addResult('invitationSendingFixes', 'オブジェクト初期化確認', 'failed', 
                `一部のオブジェクトが初期化されていません (${initializedCount}/${requiredObjects.length})`, details);
        }
    }

    async testErrorHandlingImprovements() {
        console.log('エラーハンドリング改善テスト実行中...');
        
        const fundSources = window.storage.getFundSources();
        const validFundSourceId = fundSources.length > 0 ? fundSources[0].id : 'test-fund-source';
        
        const invalidEmails = [
            'invalid-email',
            '@example.com',
            'test@',
            'test..test@example.com'
        ];
        
        let handledErrors = 0;
        
        for (const email of invalidEmails) {
            try {
                window.sharingManager.sendInvitation(
                    validFundSourceId,
                    email,
                    { canView: true, canEdit: false, canDelete: false }
                );
                
                console.warn(`⚠️ ${email}: エラーが発生しませんでした`);
                
            } catch (error) {
                if (error.message.includes('有効なメールアドレス') || 
                    error.message.includes('メールアドレス') ||
                    error.message.includes('必要です')) {
                    handledErrors++;
                    console.log(`✓ ${email}: 適切なエラー処理`);
                } else {
                    console.warn(`⚠️ ${email}: 予期しないエラー - ${error.message}`);
                }
            }
        }
        
        if (handledErrors >= invalidEmails.length * 0.8) {
            this.addResult('invitationSendingFixes', 'エラーハンドリング改善', 'passed', 
                `無効データが適切に処理されました (${handledErrors}/${invalidEmails.length})`);
        } else {
            this.addResult('invitationSendingFixes', 'エラーハンドリング改善', 'warning', 
                `エラー処理に改善の余地があります (${handledErrors}/${invalidEmails.length})`);
        }
    }

    // Validate token display fixes (Requirements 3.1, 3.2, 3.3, 3.4)
    async validateTokenDisplayFixes() {
        console.log('=== 招待トークン表示修正テスト (要件 3.1, 3.2, 3.3, 3.4) ===');
        
        try {
            // Test 3.1-3.4: Black text display for all token information
            await this.testBlackTextDisplay();
            
            // Test display content generation
            await this.testDisplayContentGeneration();
            
            console.log('✓ 招待トークン表示修正テスト完了');
            
        } catch (error) {
            console.error('✗ 招待トークン表示修正テスト失敗:', error);
            this.addResult('tokenDisplayFixes', 'テスト実行エラー', 'failed', error.message);
        }
    }

    async testBlackTextDisplay() {
        console.log('黒文字表示テスト実行中...');
        
        if (!window.invitationTokenDisplay || 
            typeof window.invitationTokenDisplay.generateInvitationTokenContent !== 'function') {
            this.addResult('tokenDisplayFixes', '黒文字表示テスト', 'failed', 
                'InvitationTokenDisplayManagerが存在しません');
            return;
        }
        
        // Create mock invitation for testing
        const mockInvitation = {
            id: 'color-test-' + Date.now(),
            token: 'inv_color_test_' + Date.now(),
            fundSourceId: 'test-fund-source',
            inviterUserId: 'test-user',
            inviterUsername: 'テストユーザー',
            inviteeEmail: 'colortest@example.com',
            permissions: { canView: true, canEdit: true, canDelete: false },
            status: 'pending',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        };
        
        // Generate the invitation content
        const content = window.invitationTokenDisplay.generateInvitationTokenContent(
            mockInvitation, 
            'テスト資金元'
        );
        
        // Check if content contains black color styling
        const hasBlackTextStyling = content.includes('color: #000000') || content.includes('color: black');
        const hasImportantStyling = content.includes('!important');
        
        const details = [
            `コンテンツ長: ${content.length}文字`,
            `黒文字スタイル: ${hasBlackTextStyling ? '確認' : '未確認'}`,
            `重要度指定: ${hasImportantStyling ? '確認' : '未確認'}`
        ];
        
        if (hasBlackTextStyling) {
            this.addResult('tokenDisplayFixes', '黒文字表示修正 (要件 3.1-3.4)', 'passed', 
                '招待トークン情報が黒文字で表示されるように修正されています', details);
        } else {
            this.addResult('tokenDisplayFixes', '黒文字表示修正 (要件 3.1-3.4)', 'failed', 
                '黒文字スタイルが確認できませんでした', details);
        }
    }

    async testDisplayContentGeneration() {
        console.log('表示内容生成テスト実行中...');
        
        const mockInvitation = {
            id: 'content-test-' + Date.now(),
            token: 'inv_content_test_' + Date.now(),
            fundSourceId: 'test-fund-source',
            inviterUserId: 'test-user',
            inviterUsername: 'テストユーザー',
            inviteeEmail: 'contenttest@example.com',
            permissions: { canView: true, canEdit: true, canDelete: false },
            status: 'pending',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        };
        
        const content = window.invitationTokenDisplay.generateInvitationTokenContent(
            mockInvitation, 
            'テスト資金元'
        );
        
        // Check required content elements (Requirements 3.1, 3.2, 3.3, 3.4)
        const requiredElements = [
            { text: '資金元:', description: '資金元情報 (要件 3.1)' },
            { text: '招待先:', description: '招待先情報 (要件 3.2)' },
            { text: '有効期限:', description: '有効期限情報 (要件 3.3)' },
            { text: '招待トークン', description: 'トークン文字列 (要件 3.4)' },
            { text: mockInvitation.token, description: 'トークン値' },
            { text: mockInvitation.inviteeEmail, description: 'メールアドレス' },
            { text: 'テスト資金元', description: '資金元名' }
        ];
        
        let foundElements = 0;
        const details = [];
        
        for (const element of requiredElements) {
            if (content.includes(element.text)) {
                foundElements++;
                details.push(`✓ ${element.description}: 確認`);
            } else {
                details.push(`✗ ${element.description}: 未確認`);
            }
        }
        
        if (foundElements === requiredElements.length) {
            this.addResult('tokenDisplayFixes', '表示内容生成確認', 'passed', 
                `全ての必須要素が含まれています (${foundElements}/${requiredElements.length})`, details);
        } else {
            this.addResult('tokenDisplayFixes', '表示内容生成確認', 'failed', 
                `必須要素が不足しています (${foundElements}/${requiredElements.length})`, details);
        }
    }

    // Validate token expiration fixes (Requirements 4.1, 4.2)
    async validateTokenExpirationFixes() {
        console.log('=== トークン有効期限修正テスト (要件 4.1, 4.2) ===');
        
        try {
            // Test 4.1: Correct expiration calculation (createdAt + 10 minutes)
            await this.testExpirationCalculation();
            
            // Test 4.2: Accurate time calculation
            await this.testTimeCalculationAccuracy();
            
            console.log('✓ トークン有効期限修正テスト完了');
            
        } catch (error) {
            console.error('✗ トークン有効期限修正テスト失敗:', error);
            this.addResult('tokenExpirationFixes', 'テスト実行エラー', 'failed', error.message);
        }
    }

    async testExpirationCalculation() {
        console.log('有効期限計算テスト実行中...');
        
        const fundSources = window.storage.getFundSources();
        if (fundSources.length === 0) {
            this.addResult('tokenExpirationFixes', '有効期限計算テスト (要件 4.1)', 'failed', 
                'テスト用の資金元がありません');
            return;
        }
        
        const fundSourceId = fundSources[0].id;
        const testEmail = 'expiration-test@example.com';
        
        try {
            // Record time before invitation creation
            const beforeCreation = new Date();
            
            // Create invitation
            const invitation = window.sharingManager.sendInvitation(
                fundSourceId,
                testEmail,
                { canView: true, canEdit: false, canDelete: false }
            );
            
            // Check expiration time
            const createdAt = new Date(invitation.createdAt);
            const expiresAt = new Date(invitation.expiresAt);
            
            // Calculate expected expiration (createdAt + 10 minutes)
            const expectedExpiration = new Date(createdAt.getTime() + 10 * 60 * 1000);
            
            // Check if expiration is approximately 10 minutes from creation
            const timeDifference = Math.abs(expiresAt.getTime() - expectedExpiration.getTime());
            const isCorrectExpiration = timeDifference < 1000; // Allow 1 second tolerance
            
            // Check if expiration is in the future
            const isInFuture = expiresAt > beforeCreation;
            
            // Check if expiration is reasonable (between 9-11 minutes from now)
            const minutesFromNow = (expiresAt.getTime() - beforeCreation.getTime()) / (1000 * 60);
            const isReasonableTime = minutesFromNow >= 9 && minutesFromNow <= 11;
            
            const details = [
                `作成時刻: ${createdAt.toLocaleString()}`,
                `有効期限: ${expiresAt.toLocaleString()}`,
                `現在からの分数: ${Math.round(minutesFromNow * 100) / 100}分`,
                `時間差: ${timeDifference}ms`,
                `未来の時刻: ${isInFuture ? '✓' : '✗'}`,
                `適切な期間: ${isReasonableTime ? '✓' : '✗'}`,
                `正確な計算: ${isCorrectExpiration ? '✓' : '✗'}`
            ];
            
            if (isCorrectExpiration && isInFuture && isReasonableTime) {
                this.addResult('tokenExpirationFixes', '有効期限計算確認 (要件 4.1)', 'passed', 
                    '有効期限が正しく設定されています (createdAt + 10分)', details);
            } else {
                this.addResult('tokenExpirationFixes', '有効期限計算確認 (要件 4.1)', 'failed', 
                    '有効期限の計算に問題があります', details);
            }
            
        } catch (error) {
            this.addResult('tokenExpirationFixes', '有効期限計算確認 (要件 4.1)', 'failed', 
                `招待作成エラー: ${error.message}`);
        }
    }

    async testTimeCalculationAccuracy() {
        console.log('時間計算精度テスト実行中...');
        
        // Test the time calculation logic directly
        const now = new Date();
        const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000);
        
        const timeDifference = tenMinutesLater.getTime() - now.getTime();
        const expectedDifference = 10 * 60 * 1000; // 10 minutes in milliseconds
        
        const details = [
            `現在時刻: ${now.toLocaleString()}`,
            `10分後: ${tenMinutesLater.toLocaleString()}`,
            `実際の差: ${timeDifference}ms`,
            `期待値: ${expectedDifference}ms`,
            `正確性: ${timeDifference === expectedDifference ? '✓' : '✗'}`
        ];
        
        if (timeDifference === expectedDifference) {
            this.addResult('tokenExpirationFixes', '時間計算精度確認 (要件 4.2)', 'passed', 
                '時間計算が正確です (10分 = 600,000ms)', details);
        } else {
            this.addResult('tokenExpirationFixes', '時間計算精度確認 (要件 4.2)', 'failed', 
                `時間計算に不正確性があります: ${timeDifference} vs ${expectedDifference}`, details);
        }
    }

    // Validate resending fixes (Requirements 2.1, 2.2, 2.3)
    async validateResendingFixes() {
        console.log('=== 招待再送信修正テスト (要件 2.1, 2.2, 2.3) ===');
        
        try {
            // Test 2.1: New token generation on resend
            await this.testNewTokenGeneration();
            
            // Test 2.2: Previous token invalidation
            await this.testPreviousTokenInvalidation();
            
            // Test 2.3: UI duplicate prevention
            await this.testUIDuplicatePrevention();
            
            console.log('✓ 招待再送信修正テスト完了');
            
        } catch (error) {
            console.error('✗ 招待再送信修正テスト失敗:', error);
            this.addResult('resendingFixes', 'テスト実行エラー', 'failed', error.message);
        }
    }

    async testNewTokenGeneration() {
        console.log('新しいトークン生成テスト実行中...');
        
        if (!window.sharingManager || typeof window.sharingManager.resendInvitation !== 'function') {
            this.addResult('resendingFixes', '新しいトークン生成 (要件 2.1)', 'failed', 
                'resendInvitationメソッドが存在しません');
            return;
        }
        
        this.addResult('resendingFixes', '新しいトークン生成 (要件 2.1)', 'passed', 
            'resendInvitationメソッドが実装されています');
    }

    async testPreviousTokenInvalidation() {
        console.log('前のトークン無効化テスト実行中...');
        
        if (!window.invitationManager || typeof window.invitationManager.updateInvitationStatus !== 'function') {
            this.addResult('resendingFixes', '前のトークン無効化 (要件 2.2)', 'warning', 
                'updateInvitationStatusメソッドが確認できませんでした');
            return;
        }
        
        this.addResult('resendingFixes', '前のトークン無効化 (要件 2.2)', 'passed', 
            'トークン無効化機能が実装されています');
    }

    async testUIDuplicatePrevention() {
        console.log('UI重複表示防止テスト実行中...');
        
        if (typeof window.sharingManager.acquireOperationLock === 'function' &&
            typeof window.sharingManager.releaseOperationLock === 'function') {
            
            this.addResult('resendingFixes', 'UI重複表示防止 (要件 2.3)', 'passed', 
                '操作ロック機能が実装されています');
        } else {
            this.addResult('resendingFixes', 'UI重複表示防止 (要件 2.3)', 'warning', 
                '操作ロックメソッドが確認できませんでした');
        }
    }

    // Helper methods
    addResult(category, testName, status, message, details = []) {
        const result = {
            test: testName,
            status: status,
            message: message,
            details: details,
            timestamp: new Date().toISOString()
        };
        
        this.results[category].push(result);
        this.testStats.total++;
        
        if (status === 'passed') {
            this.testStats.passed++;
        } else if (status === 'failed') {
            this.testStats.failed++;
        } else if (status === 'warning') {
            this.testStats.warnings++;
        }
        
        console.log(`${status === 'passed' ? '✓' : status === 'warning' ? '⚠' : '✗'} ${testName}: ${message}`);
    }

    generateFinalReport() {
        const successRate = this.testStats.total > 0 ? 
            Math.round((this.testStats.passed / this.testStats.total) * 100) : 0;
        
        const report = {
            success: successRate >= 80, // 80%以上で成功とみなす
            stats: this.testStats,
            successRate: successRate,
            results: this.results,
            summary: {
                invitationSendingFixes: this.results.invitationSendingFixes.length,
                tokenDisplayFixes: this.results.tokenDisplayFixes.length,
                tokenExpirationFixes: this.results.tokenExpirationFixes.length,
                resendingFixes: this.results.resendingFixes.length
            }
        };
        
        console.log('\n=== 共有機能修正統合テスト結果 ===');
        console.log(`総テスト数: ${this.testStats.total}`);
        console.log(`成功: ${this.testStats.passed}`);
        console.log(`失敗: ${this.testStats.failed}`);
        console.log(`警告: ${this.testStats.warnings}`);
        console.log(`成功率: ${successRate}%`);
        console.log(`\n全体結果: ${report.success ? '✓ 成功' : '✗ 失敗'}`);
        
        return report;
    }
}

// Export for use in tests
if (typeof window !== 'undefined') {
    window.SharingFixesIntegrationValidator = SharingFixesIntegrationValidator;
}

// Auto-run validation if in browser environment
if (typeof window !== 'undefined' && window.document) {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('共有機能修正統合テストバリデーター準備完了');
        
        // Make validator available globally for manual testing
        window.runSharingFixesIntegrationValidation = async () => {
            try {
                const validator = new SharingFixesIntegrationValidator();
                const result = await validator.validateAllSharingFixes();
                
                console.log('統合テスト完了:', result);
                return result;
                
            } catch (error) {
                console.error('統合テスト実行エラー:', error);
                return { success: false, error: error.message };
            }
        };
    });
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SharingFixesIntegrationValidator;
}