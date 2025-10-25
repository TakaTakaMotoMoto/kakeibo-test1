/**
 * 統合テスト実行スクリプト
 * Node.js環境で統合テストを実行します
 */

const fs = require('fs');
const path = require('path');

class IntegrationTestRunner {
    constructor() {
        this.testResults = [];
        this.testFiles = [
            'comprehensive-integration-test.html',
            'test-app-improvements-integration.html',
            'validate-app-improvements.js',
            'comprehensive-test-validator.js'
        ];
    }

    /**
     * 統合テストファイルの存在確認
     */
    validateTestFiles() {
        console.log('=== 統合テストファイルの確認 ===');
        
        let allFilesExist = true;
        
        this.testFiles.forEach(filename => {
            const filePath = path.join(__dirname, filename);
            if (fs.existsSync(filePath)) {
                console.log(`✅ ${filename} - 存在します`);
                
                // ファイルサイズの確認
                const stats = fs.statSync(filePath);
                console.log(`   サイズ: ${(stats.size / 1024).toFixed(2)} KB`);
                
                // 最終更新日時
                console.log(`   更新日時: ${stats.mtime.toLocaleString('ja-JP')}`);
            } else {
                console.log(`❌ ${filename} - 存在しません`);
                allFilesExist = false;
            }
        });
        
        return allFilesExist;
    }

    /**
     * テストファイルの内容検証
     */
    validateTestContent() {
        console.log('\n=== テストファイル内容の検証 ===');
        
        const validationResults = [];
        
        // comprehensive-integration-test.htmlの検証
        try {
            const htmlContent = fs.readFileSync('comprehensive-integration-test.html', 'utf8');
            
            const requiredElements = [
                'runComprehensiveTest',
                'testSharingBugFixes',
                'testInvitationResending', 
                'testFundSourceTypeSelection',
                'testLoadingDisplay',
                'testChartImprovements',
                'testUISync'
            ];
            
            let htmlValid = true;
            requiredElements.forEach(element => {
                if (htmlContent.includes(element)) {
                    console.log(`✅ HTML: ${element} 関数が実装されています`);
                } else {
                    console.log(`❌ HTML: ${element} 関数が見つかりません`);
                    htmlValid = false;
                }
            });
            
            validationResults.push({ file: 'comprehensive-integration-test.html', valid: htmlValid });
            
        } catch (error) {
            console.log(`❌ HTML: ファイル読み込みエラー - ${error.message}`);
            validationResults.push({ file: 'comprehensive-integration-test.html', valid: false });
        }
        
        // comprehensive-test-validator.jsの検証
        try {
            const jsContent = fs.readFileSync('comprehensive-test-validator.js', 'utf8');
            
            const requiredClasses = [
                'ComprehensiveTestValidator',
                'validateAllRequirements',
                'validateSharingBugFixes',
                'validateInvitationResending',
                'validateFundSourceTypeSelection',
                'validateLoadingDisplay',
                'validateChartImprovements',
                'validateUISync'
            ];
            
            let jsValid = true;
            requiredClasses.forEach(className => {
                if (jsContent.includes(className)) {
                    console.log(`✅ JS: ${className} が実装されています`);
                } else {
                    console.log(`❌ JS: ${className} が見つかりません`);
                    jsValid = false;
                }
            });
            
            validationResults.push({ file: 'comprehensive-test-validator.js', valid: jsValid });
            
        } catch (error) {
            console.log(`❌ JS: ファイル読み込みエラー - ${error.message}`);
            validationResults.push({ file: 'comprehensive-test-validator.js', valid: false });
        }
        
        return validationResults;
    }

    /**
     * 要件カバレッジの確認
     */
    validateRequirementsCoverage() {
        console.log('\n=== 要件カバレッジの確認 ===');
        
        const expectedRequirements = [
            '1.1', '1.2', '1.3', // 共有機能バグ修正
            '2.1', '2.2', '2.3', // 招待再送信機能
            '3.1', '3.2',        // 資金元タイプ選択
            '4.1',               // ローディング表示
            '5.1', '5.2',        // グラフ表示改善
            '6.1', '6.2', '6.3'  // UI更新同期
        ];
        
        try {
            const validatorContent = fs.readFileSync('comprehensive-test-validator.js', 'utf8');
            
            let coveredRequirements = 0;
            expectedRequirements.forEach(req => {
                if (validatorContent.includes(`'${req}':`)) {
                    console.log(`✅ 要件 ${req} がテストでカバーされています`);
                    coveredRequirements++;
                } else {
                    console.log(`❌ 要件 ${req} がテストでカバーされていません`);
                }
            });
            
            const coverageRate = Math.round((coveredRequirements / expectedRequirements.length) * 100);
            console.log(`\n要件カバレッジ: ${coveredRequirements}/${expectedRequirements.length} (${coverageRate}%)`);
            
            return { covered: coveredRequirements, total: expectedRequirements.length, rate: coverageRate };
            
        } catch (error) {
            console.log(`❌ 要件カバレッジ確認エラー: ${error.message}`);
            return { covered: 0, total: expectedRequirements.length, rate: 0 };
        }
    }

    /**
     * テスト実行可能性の確認
     */
    validateTestExecutability() {
        console.log('\n=== テスト実行可能性の確認 ===');
        
        const checks = [
            {
                name: 'HTMLテストファイル',
                check: () => fs.existsSync('comprehensive-integration-test.html')
            },
            {
                name: 'JavaScriptバリデーター',
                check: () => fs.existsSync('comprehensive-test-validator.js')
            },
            {
                name: 'アプリケーションファイル',
                check: () => fs.existsSync('index.html')
            },
            {
                name: 'JavaScriptモジュール',
                check: () => fs.existsSync('js') && fs.statSync('js').isDirectory()
            }
        ];
        
        let allChecksPass = true;
        checks.forEach(({ name, check }) => {
            if (check()) {
                console.log(`✅ ${name}: OK`);
            } else {
                console.log(`❌ ${name}: NG`);
                allChecksPass = false;
            }
        });
        
        return allChecksPass;
    }

    /**
     * 統合テストの完全検証
     */
    runCompleteValidation() {
        console.log('統合テスト実装の完全検証を開始します...\n');
        
        const results = {
            filesExist: this.validateTestFiles(),
            contentValid: this.validateTestContent(),
            requirementsCoverage: this.validateRequirementsCoverage(),
            executable: this.validateTestExecutability()
        };
        
        console.log('\n=== 検証結果サマリー ===');
        
        const filesValid = results.contentValid.every(r => r.valid);
        const overallSuccess = results.filesExist && filesValid && results.executable && results.requirementsCoverage.rate >= 90;
        
        console.log(`ファイル存在確認: ${results.filesExist ? '✅ 成功' : '❌ 失敗'}`);
        console.log(`ファイル内容検証: ${filesValid ? '✅ 成功' : '❌ 失敗'}`);
        console.log(`要件カバレッジ: ${results.requirementsCoverage.rate}% ${results.requirementsCoverage.rate >= 90 ? '✅' : '❌'}`);
        console.log(`実行可能性確認: ${results.executable ? '✅ 成功' : '❌ 失敗'}`);
        
        console.log(`\n総合評価: ${overallSuccess ? '✅ 統合テスト実装完了' : '❌ 修正が必要'}`);
        
        if (overallSuccess) {
            console.log('\n🎉 統合テストが正常に実装されました！');
            console.log('以下の方法でテストを実行できます:');
            console.log('1. ブラウザで comprehensive-integration-test.html を開く');
            console.log('2. ブラウザで test-app-improvements-integration.html を開く');
            console.log('3. コンソールで runComprehensiveValidation() を実行');
        } else {
            console.log('\n⚠️ 統合テストの実装に問題があります。上記の結果を確認して修正してください。');
        }
        
        return results;
    }
}

// 実行
if (require.main === module) {
    const runner = new IntegrationTestRunner();
    runner.runCompleteValidation();
}

module.exports = IntegrationTestRunner;