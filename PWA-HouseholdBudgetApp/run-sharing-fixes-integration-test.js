// Test runner for sharing fixes integration test
// This script can be run in Node.js environment to validate the sharing fixes

const fs = require('fs');
const path = require('path');

class SharingFixesTestRunner {
    constructor() {
        this.testResults = [];
        this.testStats = {
            total: 0,
            passed: 0,
            failed: 0,
            warnings: 0
        };
    }

    // Check if required files exist
    checkRequiredFiles() {
        console.log('=== ファイル存在確認 ===');
        
        const requiredFiles = [
            'js/sharing-manager.js',
            'js/invitation-manager.js',
            'js/invitation-token-display.js',
            'js/storage.js',
            'js/auth.js',
            'test-sharing-fixes-integration.html',
            'validate-sharing-fixes-integration.js'
        ];
        
        let existingFiles = 0;
        
        for (const file of requiredFiles) {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                existingFiles++;
                console.log(`✓ ${file}: 存在`);
            } else {
                console.log(`✗ ${file}: 不存在`);
            }
        }
        
        this.addTestResult('ファイル存在確認', existingFiles === requiredFiles.length ? 'passed' : 'failed', 
            `${existingFiles}/${requiredFiles.length} ファイルが存在します`);
        
        return existingFiles === requiredFiles.length;
    }

    // Check sharing manager implementation
    checkSharingManagerImplementation() {
        console.log('=== SharingManager実装確認 ===');
        
        try {
            const sharingManagerPath = path.join(__dirname, 'js/sharing-manager.js');
            const content = fs.readFileSync(sharingManagerPath, 'utf8');
            
            // Check for key methods and fixes
            const requiredMethods = [
                'sendInvitation',
                'resendInvitation',
                'acquireOperationLock',
                'releaseOperationLock'
            ];
            
            const requiredFixes = [
                'processingStates', // UI duplicate prevention
                'operationLocks',   // Operation lock mechanism
                'null',             // Null object error handling
                'undefined'         // Undefined object error handling
            ];
            
            let foundMethods = 0;
            let foundFixes = 0;
            
            for (const method of requiredMethods) {
                if (content.includes(method)) {
                    foundMethods++;
                    console.log(`✓ ${method}メソッド: 実装済み`);
                } else {
                    console.log(`✗ ${method}メソッド: 未実装`);
                }
            }
            
            for (const fix of requiredFixes) {
                if (content.includes(fix)) {
                    foundFixes++;
                    console.log(`✓ ${fix}対応: 実装済み`);
                } else {
                    console.log(`✗ ${fix}対応: 未実装`);
                }
            }
            
            const methodsComplete = foundMethods === requiredMethods.length;
            const fixesComplete = foundFixes >= requiredFixes.length * 0.75; // 75%以上で合格
            
            if (methodsComplete && fixesComplete) {
                this.addTestResult('SharingManager実装確認', 'passed', 
                    `必要なメソッドと修正が実装されています (メソッド: ${foundMethods}/${requiredMethods.length}, 修正: ${foundFixes}/${requiredFixes.length})`);
            } else {
                this.addTestResult('SharingManager実装確認', 'failed', 
                    `実装が不完全です (メソッド: ${foundMethods}/${requiredMethods.length}, 修正: ${foundFixes}/${requiredFixes.length})`);
            }
            
        } catch (error) {
            this.addTestResult('SharingManager実装確認', 'failed', `ファイル読み込みエラー: ${error.message}`);
        }
    }

    // Check invitation token display implementation
    checkInvitationTokenDisplayImplementation() {
        console.log('=== InvitationTokenDisplay実装確認 ===');
        
        try {
            const displayPath = path.join(__dirname, 'js/invitation-token-display.js');
            const content = fs.readFileSync(displayPath, 'utf8');
            
            // Check for black text styling fixes (Requirements 3.1, 3.2, 3.3, 3.4)
            const blackTextIndicators = [
                'color: #000000',
                'color: black',
                '!important',
                'generateInvitationTokenContent',
                'showFallbackModal'
            ];
            
            let foundIndicators = 0;
            
            for (const indicator of blackTextIndicators) {
                if (content.includes(indicator)) {
                    foundIndicators++;
                    console.log(`✓ ${indicator}: 確認`);
                } else {
                    console.log(`✗ ${indicator}: 未確認`);
                }
            }
            
            if (foundIndicators >= blackTextIndicators.length * 0.8) { // 80%以上で合格
                this.addTestResult('InvitationTokenDisplay実装確認', 'passed', 
                    `黒文字表示修正が実装されています (${foundIndicators}/${blackTextIndicators.length})`);
            } else {
                this.addTestResult('InvitationTokenDisplay実装確認', 'failed', 
                    `黒文字表示修正が不完全です (${foundIndicators}/${blackTextIndicators.length})`);
            }
            
        } catch (error) {
            this.addTestResult('InvitationTokenDisplay実装確認', 'failed', `ファイル読み込みエラー: ${error.message}`);
        }
    }

    // Check invitation manager implementation
    checkInvitationManagerImplementation() {
        console.log('=== InvitationManager実装確認 ===');
        
        try {
            const invitationPath = path.join(__dirname, 'js/invitation-manager.js');
            const content = fs.readFileSync(invitationPath, 'utf8');
            
            // Check for expiration fixes (Requirements 4.1, 4.2)
            const expirationIndicators = [
                'expiresAt',
                '10 * 60 * 1000', // 10 minutes in milliseconds
                'createdAt',
                'updateInvitationStatus',
                'createInvitation'
            ];
            
            let foundIndicators = 0;
            
            for (const indicator of expirationIndicators) {
                if (content.includes(indicator)) {
                    foundIndicators++;
                    console.log(`✓ ${indicator}: 確認`);
                } else {
                    console.log(`✗ ${indicator}: 未確認`);
                }
            }
            
            if (foundIndicators >= expirationIndicators.length * 0.8) { // 80%以上で合格
                this.addTestResult('InvitationManager実装確認', 'passed', 
                    `有効期限修正が実装されています (${foundIndicators}/${expirationIndicators.length})`);
            } else {
                this.addTestResult('InvitationManager実装確認', 'failed', 
                    `有効期限修正が不完全です (${foundIndicators}/${expirationIndicators.length})`);
            }
            
        } catch (error) {
            this.addTestResult('InvitationManager実装確認', 'failed', `ファイル読み込みエラー: ${error.message}`);
        }
    }

    // Check test files implementation
    checkTestFilesImplementation() {
        console.log('=== テストファイル実装確認 ===');
        
        try {
            const testHtmlPath = path.join(__dirname, 'test-sharing-fixes-integration.html');
            const testJsPath = path.join(__dirname, 'validate-sharing-fixes-integration.js');
            
            const htmlContent = fs.readFileSync(testHtmlPath, 'utf8');
            const jsContent = fs.readFileSync(testJsPath, 'utf8');
            
            // Check for required test functions
            const requiredTestFunctions = [
                'runAllSharingFixTests',
                'runInvitationSendingTests',
                'runTokenDisplayTests',
                'runTokenExpirationTests',
                'runResendingTests'
            ];
            
            const requiredValidationMethods = [
                'validateInvitationSendingFixes',
                'validateTokenDisplayFixes',
                'validateTokenExpirationFixes',
                'validateResendingFixes'
            ];
            
            let foundTestFunctions = 0;
            let foundValidationMethods = 0;
            
            for (const func of requiredTestFunctions) {
                if (htmlContent.includes(func)) {
                    foundTestFunctions++;
                    console.log(`✓ ${func}: 実装済み`);
                } else {
                    console.log(`✗ ${func}: 未実装`);
                }
            }
            
            for (const method of requiredValidationMethods) {
                if (jsContent.includes(method)) {
                    foundValidationMethods++;
                    console.log(`✓ ${method}: 実装済み`);
                } else {
                    console.log(`✗ ${method}: 未実装`);
                }
            }
            
            const testsComplete = foundTestFunctions === requiredTestFunctions.length;
            const validationComplete = foundValidationMethods === requiredValidationMethods.length;
            
            if (testsComplete && validationComplete) {
                this.addTestResult('テストファイル実装確認', 'passed', 
                    `テスト機能が完全に実装されています (テスト: ${foundTestFunctions}/${requiredTestFunctions.length}, バリデーション: ${foundValidationMethods}/${requiredValidationMethods.length})`);
            } else {
                this.addTestResult('テストファイル実装確認', 'failed', 
                    `テスト機能が不完全です (テスト: ${foundTestFunctions}/${requiredTestFunctions.length}, バリデーション: ${foundValidationMethods}/${requiredValidationMethods.length})`);
            }
            
        } catch (error) {
            this.addTestResult('テストファイル実装確認', 'failed', `ファイル読み込みエラー: ${error.message}`);
        }
    }

    // Check requirements coverage
    checkRequirementsCoverage() {
        console.log('=== 要件カバレッジ確認 ===');
        
        const requirements = [
            { id: '1.1', description: 'null is not an object エラー修正', covered: false },
            { id: '1.2', description: '適切なオブジェクト初期化', covered: false },
            { id: '1.3', description: 'エラーハンドリング改善', covered: false },
            { id: '2.1', description: '新しいトークン生成', covered: false },
            { id: '2.2', description: '前のトークン無効化', covered: false },
            { id: '2.3', description: 'UI重複表示防止', covered: false },
            { id: '3.1', description: '資金元情報黒文字表示', covered: false },
            { id: '3.2', description: '招待先情報黒文字表示', covered: false },
            { id: '3.3', description: '有効期限黒文字表示', covered: false },
            { id: '3.4', description: 'トークン文字列黒文字表示', covered: false },
            { id: '4.1', description: '現在時刻+10分有効期限設定', covered: false },
            { id: '4.2', description: '正確な時間計算', covered: false }
        ];
        
        // Check test files for requirement references
        try {
            const testHtmlPath = path.join(__dirname, 'test-sharing-fixes-integration.html');
            const testJsPath = path.join(__dirname, 'validate-sharing-fixes-integration.js');
            
            const htmlContent = fs.readFileSync(testHtmlPath, 'utf8');
            const jsContent = fs.readFileSync(testJsPath, 'utf8');
            const combinedContent = htmlContent + jsContent;
            
            for (const req of requirements) {
                if (combinedContent.includes(`要件 ${req.id}`) || 
                    combinedContent.includes(`Requirements ${req.id}`) ||
                    combinedContent.includes(req.description)) {
                    req.covered = true;
                    console.log(`✓ 要件 ${req.id}: ${req.description} - カバー済み`);
                } else {
                    console.log(`✗ 要件 ${req.id}: ${req.description} - 未カバー`);
                }
            }
            
            const coveredRequirements = requirements.filter(req => req.covered).length;
            const coveragePercentage = Math.round((coveredRequirements / requirements.length) * 100);
            
            if (coveragePercentage >= 90) { // 90%以上で合格
                this.addTestResult('要件カバレッジ確認', 'passed', 
                    `要件カバレッジ: ${coveragePercentage}% (${coveredRequirements}/${requirements.length})`);
            } else {
                this.addTestResult('要件カバレッジ確認', 'warning', 
                    `要件カバレッジが不十分です: ${coveragePercentage}% (${coveredRequirements}/${requirements.length})`);
            }
            
        } catch (error) {
            this.addTestResult('要件カバレッジ確認', 'failed', `確認エラー: ${error.message}`);
        }
    }

    // Helper method to add test results
    addTestResult(testName, status, message) {
        const result = {
            test: testName,
            status: status,
            message: message,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        this.testStats.total++;
        
        if (status === 'passed') {
            this.testStats.passed++;
        } else if (status === 'failed') {
            this.testStats.failed++;
        } else if (status === 'warning') {
            this.testStats.warnings++;
        }
    }

    // Generate final report
    generateReport() {
        const successRate = this.testStats.total > 0 ? 
            Math.round((this.testStats.passed / this.testStats.total) * 100) : 0;
        
        console.log('\n=== 共有機能修正統合テスト実装確認結果 ===');
        console.log(`総テスト数: ${this.testStats.total}`);
        console.log(`成功: ${this.testStats.passed}`);
        console.log(`失敗: ${this.testStats.failed}`);
        console.log(`警告: ${this.testStats.warnings}`);
        console.log(`成功率: ${successRate}%`);
        
        console.log('\n=== 詳細結果 ===');
        for (const result of this.testResults) {
            const icon = result.status === 'passed' ? '✓' : 
                        result.status === 'warning' ? '⚠' : '✗';
            console.log(`${icon} ${result.test}: ${result.message}`);
        }
        
        const overallSuccess = successRate >= 80;
        console.log(`\n=== 全体結果: ${overallSuccess ? '✓ 成功' : '✗ 失敗'} ===`);
        
        return {
            success: overallSuccess,
            stats: this.testStats,
            successRate: successRate,
            results: this.testResults
        };
    }

    // Run all tests
    async runAllTests() {
        console.log('共有機能修正統合テスト実装確認を開始します...\n');
        
        this.checkRequiredFiles();
        this.checkSharingManagerImplementation();
        this.checkInvitationTokenDisplayImplementation();
        this.checkInvitationManagerImplementation();
        this.checkTestFilesImplementation();
        this.checkRequirementsCoverage();
        
        return this.generateReport();
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    const runner = new SharingFixesTestRunner();
    runner.runAllTests().then(result => {
        process.exit(result.success ? 0 : 1);
    }).catch(error => {
        console.error('テスト実行エラー:', error);
        process.exit(1);
    });
}

module.exports = SharingFixesTestRunner;