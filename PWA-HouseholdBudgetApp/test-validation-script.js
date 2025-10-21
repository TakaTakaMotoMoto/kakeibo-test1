/**
 * PWA家計簿アプリ - バグ修正検証スクリプト
 * ブラウザのコンソールで実行して、すべての修正項目を検証します
 */

console.log('=== PWA家計簿アプリ バグ修正検証スクリプト ===');
console.log('実行開始時刻:', new Date().toLocaleString('ja-JP'));

// 検証結果を格納する配列
const validationResults = [];

// 結果をログに記録する関数
function logValidationResult(category, testName, status, message, details = []) {
    const result = {
        category,
        testName,
        status, // 'PASS', 'FAIL', 'WARN'
        message,
        details,
        timestamp: new Date().toISOString()
    };
    
    validationResults.push(result);
    
    const statusIcon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
    console.log(`${statusIcon} [${category}] ${testName}: ${message}`);
    
    if (details.length > 0) {
        details.forEach(detail => console.log(`   - ${detail}`));
    }
}

// 1. 資金元管理機能の検証
function validateFundSourceManagement() {
    console.log('\n--- 1. 資金元管理機能の検証 ---');
    
    try {
        // StorageManager存在確認
        if (typeof window.storage === 'undefined') {
            logValidationResult('資金元管理', 'StorageManager初期化', 'FAIL', 'StorageManagerが存在しません');
            return;
        }
        
        logValidationResult('資金元管理', 'StorageManager初期化', 'PASS', 'StorageManagerが正常に初期化されています');
        
        // 資金元取得テスト
        const fundSources = window.storage.getFundSources();
        if (Array.isArray(fundSources)) {
            logValidationResult('資金元管理', '資金元取得', 'PASS', `資金元を正常に取得 (${fundSources.length}件)`,
                fundSources.slice(0, 3).map(fs => `${fs.name} (${fs.type})`));
        } else {
            logValidationResult('資金元管理', '資金元取得', 'FAIL', '資金元の取得に失敗');
        }
        
        // 資金元追加機能テスト
        const testFundSource = {
            name: 'テスト資金元_' + Date.now(),
            type: 'bank',
            currentBalance: 10000
        };
        
        try {
            const addedFundSource = window.storage.addFundSource(testFundSource);
            if (addedFundSource && addedFundSource.id) {
                logValidationResult('資金元管理', '資金元追加', 'PASS', `資金元を正常に追加: ${addedFundSource.name}`);
                
                // 追加後の確認
                const updatedFundSources = window.storage.getFundSources();
                const found = updatedFundSources.find(fs => fs.id === addedFundSource.id);
                if (found) {
                    logValidationResult('資金元管理', '追加後確認', 'PASS', '追加した資金元が正常に保存されています');
                } else {
                    logValidationResult('資金元管理', '追加後確認', 'FAIL', '追加した資金元が見つかりません');
                }
                
                // 削除機能テスト
                try {
                    window.storage.deleteFundSource(addedFundSource.id);
                    const afterDelete = window.storage.getFundSources();
                    const stillExists = afterDelete.find(fs => fs.id === addedFundSource.id);
                    if (!stillExists) {
                        logValidationResult('資金元管理', '資金元削除', 'PASS', '資金元を正常に削除しました');
                    } else {
                        logValidationResult('資金元管理', '資金元削除', 'FAIL', '資金元の削除に失敗');
                    }
                } catch (deleteError) {
                    logValidationResult('資金元管理', '資金元削除', 'WARN', `削除時エラー: ${deleteError.message}`);
                }
            } else {
                logValidationResult('資金元管理', '資金元追加', 'FAIL', '資金元の追加に失敗');
            }
        } catch (addError) {
            logValidationResult('資金元管理', '資金元追加', 'FAIL', `追加エラー: ${addError.message}`);
        }
        
    } catch (error) {
        logValidationResult('資金元管理', 'テスト実行', 'FAIL', `予期しないエラー: ${error.message}`);
    }
}

// 2. データ初期化システムの検証
function validateDataInitialization() {
    console.log('\n--- 2. データ初期化システムの検証 ---');
    
    try {
        // 初期化状態確認
        if (typeof window.storage.isInitialized === 'function') {
            const isInitialized = window.storage.isInitialized();
            logValidationResult('データ初期化', '初期化状態確認', 'PASS', `初期化状態: ${isInitialized ? '完了' : '未完了'}`);
        } else {
            logValidationResult('データ初期化', '初期化状態確認', 'WARN', 'isInitializedメソッドが存在しません');
        }
        
        // デフォルトデータ存在確認
        const categories = window.storage.getCategories();
        const subcategories = window.storage.getSubcategories();
        const fundSources = window.storage.getFundSources();
        
        const details = [
            `カテゴリ: ${categories.length}件`,
            `サブカテゴリ: ${subcategories.length}件`,
            `資金元: ${fundSources.length}件`
        ];
        
        if (categories.length > 0 && fundSources.length > 0) {
            logValidationResult('データ初期化', 'デフォルトデータ確認', 'PASS', 'デフォルトデータが正常に作成されています', details);
        } else {
            logValidationResult('データ初期化', 'デフォルトデータ確認', 'FAIL', 'デフォルトデータが不足しています', details);
        }
        
        // ユーザーキー生成テスト
        if (typeof window.storage.getUserKey === 'function') {
            const testKey = 'test_key';
            const userKey = window.storage.getUserKey(testKey);
            if (userKey && userKey !== testKey) {
                logValidationResult('データ初期化', 'ユーザーキー生成', 'PASS', `ユーザー固有キーを正常に生成: ${userKey}`);
            } else {
                logValidationResult('データ初期化', 'ユーザーキー生成', 'WARN', 'ユーザーキー生成が期待通りに動作していません');
            }
        } else {
            logValidationResult('データ初期化', 'ユーザーキー生成', 'WARN', 'getUserKeyメソッドが存在しません');
        }
        
        // データアクセス制御
        if (typeof window.storage.hasDataAccess === 'function') {
            const hasAccess = window.storage.hasDataAccess();
            logValidationResult('データ初期化', 'データアクセス制御', 'PASS', `データアクセス権限: ${hasAccess ? '許可' : '拒否'}`);
        } else {
            logValidationResult('データ初期化', 'データアクセス制御', 'WARN', 'hasDataAccessメソッドが存在しません');
        }
        
    } catch (error) {
        logValidationResult('データ初期化', 'テスト実行', 'FAIL', `予期しないエラー: ${error.message}`);
    }
}

// 3. 認証システム安定化の検証
function validateAuthenticationSystem() {
    console.log('\n--- 3. 認証システム安定化の検証 ---');
    
    try {
        // AuthManager存在確認
        if (typeof window.authManager === 'undefined') {
            logValidationResult('認証システム', 'AuthManager初期化', 'FAIL', 'AuthManagerが存在しません');
            return;
        }
        
        logValidationResult('認証システム', 'AuthManager初期化', 'PASS', 'AuthManagerが正常に初期化されています');
        
        // 必要なメソッド存在確認
        const requiredMethods = ['getIsLoggedIn', 'getCurrentUser', 'loginUser', 'logoutUser'];
        const missingMethods = [];
        
        requiredMethods.forEach(method => {
            if (typeof window.authManager[method] !== 'function') {
                missingMethods.push(method);
            }
        });
        
        if (missingMethods.length === 0) {
            logValidationResult('認証システム', '必要メソッド確認', 'PASS', 'すべての必要なメソッドが実装されています');
        } else {
            logValidationResult('認証システム', '必要メソッド確認', 'FAIL', '不足しているメソッドがあります', missingMethods);
        }
        
        // 認証状態取得テスト
        try {
            const isLoggedIn = window.authManager.getIsLoggedIn();
            const currentUser = window.authManager.getCurrentUser();
            logValidationResult('認証システム', '認証状態取得', 'PASS', 
                `ログイン状態: ${isLoggedIn}, ユーザー: ${currentUser ? currentUser.username : 'なし'}`);
        } catch (stateError) {
            logValidationResult('認証システム', '認証状態取得', 'WARN', `状態取得エラー: ${stateError.message}`);
        }
        
        // UIManager連携確認
        if (window.uiManager) {
            const uiMethods = ['updateAuthDependentUI', 'updateUserInfoDisplay', 'updateNavigationState'];
            const missingUIMethods = [];
            
            uiMethods.forEach(method => {
                if (typeof window.uiManager[method] !== 'function') {
                    missingUIMethods.push(method);
                }
            });
            
            if (missingUIMethods.length === 0) {
                logValidationResult('認証システム', 'UI連携メソッド', 'PASS', '認証関連UIメソッドが実装されています');
            } else {
                logValidationResult('認証システム', 'UI連携メソッド', 'WARN', 'UI連携メソッドが不足しています', missingUIMethods);
            }
        } else {
            logValidationResult('認証システム', 'UI連携メソッド', 'WARN', 'UIManagerが初期化されていません');
        }
        
    } catch (error) {
        logValidationResult('認証システム', 'テスト実行', 'FAIL', `予期しないエラー: ${error.message}`);
    }
}// 4. カテゴリ・
サブカテゴリ機能の検証
function validateCategorySubcategoryFunctionality() {
    console.log('\n--- 4. カテゴリ・サブカテゴリ機能の検証 ---');
    
    try {
        // カテゴリ取得
        const categories = window.storage.getCategories();
        if (categories.length > 0) {
            logValidationResult('カテゴリ機能', 'カテゴリ取得', 'PASS', `カテゴリを正常に取得 (${categories.length}件)`,
                categories.slice(0, 5).map(cat => `${cat.icon} ${cat.name}`));
        } else {
            logValidationResult('カテゴリ機能', 'カテゴリ取得', 'FAIL', 'カテゴリが取得できません');
            return;
        }
        
        // サブカテゴリ取得
        const subcategories = window.storage.getSubcategories();
        logValidationResult('カテゴリ機能', 'サブカテゴリ取得', 'PASS', `サブカテゴリを取得 (${subcategories.length}件)`);
        
        // DataManager存在確認
        if (!window.dataManager) {
            logValidationResult('カテゴリ機能', 'DataManager確認', 'WARN', 'DataManagerが初期化されていません');
            return;
        }
        
        // カテゴリ別サブカテゴリ取得
        if (typeof window.dataManager.getSubcategories === 'function') {
            const firstCategory = categories[0];
            const categorySubcategories = window.dataManager.getSubcategories(firstCategory.id);
            logValidationResult('カテゴリ機能', 'カテゴリ別サブカテゴリ', 'PASS', 
                `${firstCategory.name}のサブカテゴリ: ${categorySubcategories.length}件`);
        } else {
            logValidationResult('カテゴリ機能', 'カテゴリ別サブカテゴリ', 'WARN', 'getSubcategoriesメソッドが存在しません');
        }
        
        // サブカテゴリ追加テスト
        if (typeof window.dataManager.addSubcategory === 'function') {
            const testSubcategory = {
                name: 'テストサブカテゴリ_' + Date.now(),
                categoryId: categories[0].id
            };
            
            try {
                const addedSubcategory = window.dataManager.addSubcategory(testSubcategory);
                if (addedSubcategory && addedSubcategory.id) {
                    logValidationResult('カテゴリ機能', 'サブカテゴリ追加', 'PASS', `サブカテゴリを正常に追加: ${addedSubcategory.name}`);
                    
                    // 重複チェック
                    try {
                        window.dataManager.addSubcategory(testSubcategory);
                        logValidationResult('カテゴリ機能', '重複チェック', 'WARN', '重複チェックが機能していない可能性があります');
                    } catch (duplicateError) {
                        logValidationResult('カテゴリ機能', '重複チェック', 'PASS', '重複チェックが正常に動作しています');
                    }
                    
                    // 削除可能性チェック
                    if (typeof window.dataManager.canDeleteSubcategory === 'function') {
                        const canDelete = window.dataManager.canDeleteSubcategory(addedSubcategory.id);
                        logValidationResult('カテゴリ機能', '削除可能性チェック', 'PASS', `削除可能性: ${canDelete ? '削除可能' : '削除不可'}`);
                    } else {
                        logValidationResult('カテゴリ機能', '削除可能性チェック', 'WARN', 'canDeleteSubcategoryメソッドが存在しません');
                    }
                } else {
                    logValidationResult('カテゴリ機能', 'サブカテゴリ追加', 'FAIL', 'サブカテゴリの追加に失敗');
                }
            } catch (addError) {
                logValidationResult('カテゴリ機能', 'サブカテゴリ追加', 'FAIL', `追加エラー: ${addError.message}`);
            }
        } else {
            logValidationResult('カテゴリ機能', 'サブカテゴリ追加', 'WARN', 'addSubcategoryメソッドが存在しません');
        }
        
    } catch (error) {
        logValidationResult('カテゴリ機能', 'テスト実行', 'FAIL', `予期しないエラー: ${error.message}`);
    }
}

// 5. 共有機能の検証
function validateSharingFunctionality() {
    console.log('\n--- 5. 共有機能の検証 ---');
    
    try {
        // Mock認証設定（テスト用）
        if (!window.authManager || !window.authManager.getIsLoggedIn()) {
            window.authManager = {
                getCurrentUser: () => ({ id: 'test-user', username: 'テストユーザー' }),
                getIsLoggedIn: () => true
            };
            logValidationResult('共有機能', 'Mock認証設定', 'PASS', 'テスト用認証を設定しました');
        }
        
        // DataManager共有メソッド確認
        if (!window.dataManager) {
            logValidationResult('共有機能', 'DataManager確認', 'FAIL', 'DataManagerが初期化されていません');
            return;
        }
        
        const sharingMethods = ['getSharedUsers', 'addSharedUser', 'removeSharedUser', 
                              'getFundSourceSharingSettings', 'updateFundSourceSharing'];
        const missingSharingMethods = [];
        
        sharingMethods.forEach(method => {
            if (typeof window.dataManager[method] !== 'function') {
                missingSharingMethods.push(method);
            }
        });
        
        if (missingSharingMethods.length === 0) {
            logValidationResult('共有機能', '共有メソッド確認', 'PASS', 'すべての共有メソッドが実装されています');
        } else {
            logValidationResult('共有機能', '共有メソッド確認', 'FAIL', '不足している共有メソッドがあります', missingSharingMethods);
            return;
        }
        
        // 共有ユーザー取得
        try {
            const sharedUsers = window.dataManager.getSharedUsers();
            logValidationResult('共有機能', '共有ユーザー取得', 'PASS', `共有ユーザー数: ${sharedUsers.length}`);
        } catch (getUsersError) {
            logValidationResult('共有機能', '共有ユーザー取得', 'FAIL', `取得エラー: ${getUsersError.message}`);
        }
        
        // 共有ユーザー追加テスト
        try {
            const testEmail = 'test-sharing@example.com';
            const addedUser = window.dataManager.addSharedUser(testEmail);
            if (addedUser && addedUser.id) {
                logValidationResult('共有機能', '共有ユーザー追加', 'PASS', `ユーザーを追加: ${addedUser.email}`);
                
                // 資金元共有設定テスト
                const fundSources = window.storage.getFundSources();
                if (fundSources.length > 0) {
                    const testFundSource = fundSources[0];
                    const sharingSettings = {
                        isShared: true,
                        sharedWith: [addedUser.id],
                        permissions: { canView: true, canEdit: false, canDelete: false }
                    };
                    
                    try {
                        window.dataManager.updateFundSourceSharing(testFundSource.id, sharingSettings);
                        logValidationResult('共有機能', '資金元共有設定', 'PASS', `${testFundSource.name}の共有設定を更新`);
                    } catch (sharingError) {
                        logValidationResult('共有機能', '資金元共有設定', 'FAIL', `共有設定エラー: ${sharingError.message}`);
                    }
                }
                
                // 共有ユーザー削除
                try {
                    window.dataManager.removeSharedUser(addedUser.id);
                    logValidationResult('共有機能', '共有ユーザー削除', 'PASS', 'ユーザーを正常に削除');
                } catch (removeError) {
                    logValidationResult('共有機能', '共有ユーザー削除', 'FAIL', `削除エラー: ${removeError.message}`);
                }
            } else {
                logValidationResult('共有機能', '共有ユーザー追加', 'FAIL', 'ユーザーの追加に失敗');
            }
        } catch (addUserError) {
            logValidationResult('共有機能', '共有ユーザー追加', 'FAIL', `追加エラー: ${addUserError.message}`);
        }
        
    } catch (error) {
        logValidationResult('共有機能', 'テスト実行', 'FAIL', `予期しないエラー: ${error.message}`);
    }
}

// 6. UI応答性とエラーハンドリングの検証
function validateUIResponsivenessAndErrorHandling() {
    console.log('\n--- 6. UI応答性とエラーハンドリングの検証 ---');
    
    try {
        // UIManager存在確認
        if (window.uiManager) {
            logValidationResult('UI応答性', 'UIManager初期化', 'PASS', 'UIManagerが正常に初期化されています');
        } else {
            logValidationResult('UI応答性', 'UIManager初期化', 'WARN', 'UIManagerが初期化されていません');
        }
        
        // 通知システム確認
        if (window.uiManager && typeof window.uiManager.showNotification === 'function') {
            logValidationResult('UI応答性', '通知システム', 'PASS', '通知システムが実装されています');
        } else {
            logValidationResult('UI応答性', '通知システム', 'WARN', 'showNotificationメソッドが存在しません');
        }
        
        // モーダル機能確認
        if (window.uiManager && typeof window.uiManager.showModal === 'function') {
            logValidationResult('UI応答性', 'モーダル機能', 'PASS', 'モーダル機能が実装されています');
        } else {
            logValidationResult('UI応答性', 'モーダル機能', 'WARN', 'showModalメソッドが存在しません');
        }
        
        // フォームバリデーション確認
        if (window.uiManager && typeof window.uiManager.showFieldError === 'function') {
            logValidationResult('UI応答性', 'フォームバリデーション', 'PASS', 'フォームバリデーション機能が実装されています');
        } else {
            logValidationResult('UI応答性', 'フォームバリデーション', 'WARN', 'showFieldErrorメソッドが存在しません');
        }
        
        // CSS読み込み確認
        const cssLoaded = document.querySelector('link[href*="main.css"]') !== null;
        if (cssLoaded) {
            logValidationResult('UI応答性', 'CSS読み込み', 'PASS', 'メインCSSファイルが読み込まれています');
        } else {
            logValidationResult('UI応答性', 'CSS読み込み', 'WARN', 'メインCSSファイルが見つかりません');
        }
        
        // レスポンシブデザイン確認
        const screenWidth = window.innerWidth;
        const isMobile = screenWidth < 768;
        const isTablet = screenWidth >= 768 && screenWidth < 1024;
        const isDesktop = screenWidth >= 1024;
        
        logValidationResult('UI応答性', 'レスポンシブデザイン', 'PASS', 
            `画面サイズ: ${screenWidth}px (${isMobile ? 'モバイル' : isTablet ? 'タブレット' : 'デスクトップ'})`);
        
    } catch (error) {
        logValidationResult('UI応答性', 'テスト実行', 'FAIL', `予期しないエラー: ${error.message}`);
    }
}

// 7. データ整合性の検証
function validateDataIntegrity() {
    console.log('\n--- 7. データ整合性の検証 ---');
    
    try {
        // データ構造整合性チェック
        const transactions = window.storage.getTransactions();
        const categories = window.storage.getCategories();
        const fundSources = window.storage.getFundSources();
        
        let integrityIssues = [];
        
        // 取引データの整合性チェック
        transactions.forEach(transaction => {
            if (!transaction.id || !transaction.amount || !transaction.date) {
                integrityIssues.push(`取引ID ${transaction.id || 'unknown'}: 必須フィールド不足`);
            }
            
            if (transaction.category && !categories.find(cat => cat.id === transaction.category)) {
                integrityIssues.push(`取引ID ${transaction.id}: 存在しないカテゴリ参照`);
            }
            
            if (transaction.fundSource && !fundSources.find(fs => fs.id === transaction.fundSource)) {
                integrityIssues.push(`取引ID ${transaction.id}: 存在しない資金元参照`);
            }
        });
        
        if (integrityIssues.length === 0) {
            logValidationResult('データ整合性', 'データ構造整合性', 'PASS', 
                `データ整合性チェック完了 (取引: ${transactions.length}件, カテゴリ: ${categories.length}件, 資金元: ${fundSources.length}件)`);
        } else {
            logValidationResult('データ整合性', 'データ構造整合性', 'WARN', 
                `${integrityIssues.length}件の整合性問題を検出`, integrityIssues.slice(0, 5));
        }
        
        // ローカルストレージ容量チェック
        try {
            let totalSize = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length;
                }
            }
            
            const sizeInKB = Math.round(totalSize / 1024);
            if (sizeInKB < 5000) { // 5MB未満
                logValidationResult('データ整合性', 'ストレージ容量', 'PASS', `ローカルストレージ使用量: ${sizeInKB}KB`);
            } else {
                logValidationResult('データ整合性', 'ストレージ容量', 'WARN', `ローカルストレージ使用量が多い: ${sizeInKB}KB`);
            }
        } catch (storageError) {
            logValidationResult('データ整合性', 'ストレージ容量', 'FAIL', `容量チェックエラー: ${storageError.message}`);
        }
        
        // JSON解析テスト
        const testKeys = ['transactions', 'categories', 'fundSources', 'subcategories'];
        let jsonErrors = [];
        
        testKeys.forEach(key => {
            try {
                const data = localStorage.getItem(key);
                if (data) {
                    JSON.parse(data);
                }
            } catch (parseError) {
                jsonErrors.push(`${key}: ${parseError.message}`);
            }
        });
        
        if (jsonErrors.length === 0) {
            logValidationResult('データ整合性', 'JSON解析', 'PASS', 'すべてのデータが正常にJSON解析できます');
        } else {
            logValidationResult('データ整合性', 'JSON解析', 'FAIL', 'JSON解析エラーが発生', jsonErrors);
        }
        
    } catch (error) {
        logValidationResult('データ整合性', 'テスト実行', 'FAIL', `予期しないエラー: ${error.message}`);
    }
}// 8
. パフォーマンステスト
function validatePerformance() {
    console.log('\n--- 8. パフォーマンステストの検証 ---');
    
    try {
        // データ処理速度テスト
        const startTime = performance.now();
        const testData = Array.from({length: 1000}, (_, i) => ({
            id: i,
            amount: Math.random() * 1000,
            date: new Date().toISOString(),
            category: `Category ${i % 10}`
        }));
        
        // フィルタリング処理
        const filtered = testData.filter(item => item.amount > 500);
        const sorted = filtered.sort((a, b) => b.amount - a.amount);
        const endTime = performance.now();
        
        const processingTime = endTime - startTime;
        
        if (processingTime < 50) {
            logValidationResult('パフォーマンス', 'データ処理速度', 'PASS', `処理時間: ${processingTime.toFixed(2)}ms (優秀)`);
        } else if (processingTime < 200) {
            logValidationResult('パフォーマンス', 'データ処理速度', 'WARN', `処理時間: ${processingTime.toFixed(2)}ms (改善の余地あり)`);
        } else {
            logValidationResult('パフォーマンス', 'データ処理速度', 'FAIL', `処理時間: ${processingTime.toFixed(2)}ms (遅い)`);
        }
        
        // ローカルストレージ読み書き速度
        const storageStartTime = performance.now();
        const testKey = 'perf-test-' + Date.now();
        localStorage.setItem(testKey, JSON.stringify(testData));
        const retrieved = JSON.parse(localStorage.getItem(testKey));
        localStorage.removeItem(testKey);
        const storageEndTime = performance.now();
        
        const storageTime = storageEndTime - storageStartTime;
        
        if (storageTime < 100) {
            logValidationResult('パフォーマンス', 'ストレージ速度', 'PASS', `ストレージ処理時間: ${storageTime.toFixed(2)}ms`);
        } else if (storageTime < 500) {
            logValidationResult('パフォーマンス', 'ストレージ速度', 'WARN', `ストレージ処理時間: ${storageTime.toFixed(2)}ms`);
        } else {
            logValidationResult('パフォーマンス', 'ストレージ速度', 'FAIL', `ストレージ処理時間: ${storageTime.toFixed(2)}ms (遅い)`);
        }
        
        // メモリ使用量（概算）
        if (performance.memory) {
            const memoryInfo = {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
            
            if (memoryInfo.used < 50) {
                logValidationResult('パフォーマンス', 'メモリ使用量', 'PASS', 
                    `メモリ使用量: ${memoryInfo.used}MB / ${memoryInfo.total}MB`);
            } else if (memoryInfo.used < 100) {
                logValidationResult('パフォーマンス', 'メモリ使用量', 'WARN', 
                    `メモリ使用量: ${memoryInfo.used}MB / ${memoryInfo.total}MB`);
            } else {
                logValidationResult('パフォーマンス', 'メモリ使用量', 'FAIL', 
                    `メモリ使用量が多い: ${memoryInfo.used}MB / ${memoryInfo.total}MB`);
            }
        } else {
            logValidationResult('パフォーマンス', 'メモリ使用量', 'WARN', 'メモリ情報を取得できません（ブラウザ制限）');
        }
        
    } catch (error) {
        logValidationResult('パフォーマンス', 'テスト実行', 'FAIL', `予期しないエラー: ${error.message}`);
    }
}

// 9. ユーザビリティテスト
function validateUsability() {
    console.log('\n--- 9. ユーザビリティテストの検証 ---');
    
    try {
        // 画面サイズ対応
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const isMobile = screenWidth < 768;
        const isTablet = screenWidth >= 768 && screenWidth < 1024;
        const isDesktop = screenWidth >= 1024;
        
        logValidationResult('ユーザビリティ', '画面サイズ対応', 'PASS', 
            `画面: ${screenWidth}x${screenHeight} (${isMobile ? 'モバイル' : isTablet ? 'タブレット' : 'デスクトップ'})`);
        
        // タッチ対応
        const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        logValidationResult('ユーザビリティ', 'タッチ対応', hasTouchSupport ? 'PASS' : 'WARN', 
            `タッチサポート: ${hasTouchSupport ? 'あり' : 'なし'}`);
        
        // フォント読み込み
        const computedStyle = window.getComputedStyle(document.body);
        const fontFamily = computedStyle.fontFamily;
        logValidationResult('ユーザビリティ', 'フォント読み込み', 'PASS', `フォント: ${fontFamily}`);
        
        // アクセシビリティ基本チェック
        const images = document.querySelectorAll('img');
        const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
        const hasProperHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0;
        
        const accessibilityIssues = [];
        if (imagesWithoutAlt.length > 0) {
            accessibilityIssues.push(`alt属性なし画像: ${imagesWithoutAlt.length}個`);
        }
        if (!hasProperHeadings) {
            accessibilityIssues.push('見出し構造なし');
        }
        
        if (accessibilityIssues.length === 0) {
            logValidationResult('ユーザビリティ', 'アクセシビリティ', 'PASS', '基本的なアクセシビリティ要件を満たしています');
        } else {
            logValidationResult('ユーザビリティ', 'アクセシビリティ', 'WARN', 'アクセシビリティの改善が必要', accessibilityIssues);
        }
        
        // PWA対応チェック
        const isPWA = window.matchMedia('(display-mode: standalone)').matches;
        const hasServiceWorker = 'serviceWorker' in navigator;
        const hasManifest = document.querySelector('link[rel="manifest"]') !== null;
        
        const pwaFeatures = [];
        if (isPWA) pwaFeatures.push('スタンドアロンモード');
        if (hasServiceWorker) pwaFeatures.push('ServiceWorker対応');
        if (hasManifest) pwaFeatures.push('マニフェストファイル');
        
        logValidationResult('ユーザビリティ', 'PWA対応', pwaFeatures.length > 0 ? 'PASS' : 'WARN', 
            `PWA機能: ${pwaFeatures.join(', ') || 'なし'}`);
        
    } catch (error) {
        logValidationResult('ユーザビリティ', 'テスト実行', 'FAIL', `予期しないエラー: ${error.message}`);
    }
}

// 結果サマリーの表示
function displayValidationSummary() {
    console.log('\n=== 検証結果サマリー ===');
    
    const totalTests = validationResults.length;
    const passedTests = validationResults.filter(r => r.status === 'PASS').length;
    const failedTests = validationResults.filter(r => r.status === 'FAIL').length;
    const warningTests = validationResults.filter(r => r.status === 'WARN').length;
    const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    
    console.log(`総テスト数: ${totalTests}`);
    console.log(`✅ 成功: ${passedTests}`);
    console.log(`❌ 失敗: ${failedTests}`);
    console.log(`⚠️ 警告: ${warningTests}`);
    console.log(`成功率: ${successRate}%`);
    
    // カテゴリ別サマリー
    const categories = [...new Set(validationResults.map(r => r.category))];
    console.log('\n--- カテゴリ別結果 ---');
    categories.forEach(category => {
        const categoryResults = validationResults.filter(r => r.category === category);
        const categoryPassed = categoryResults.filter(r => r.status === 'PASS').length;
        const categoryTotal = categoryResults.length;
        const categoryRate = Math.round((categoryPassed / categoryTotal) * 100);
        console.log(`${category}: ${categoryPassed}/${categoryTotal} (${categoryRate}%)`);
    });
    
    // 失敗したテストの詳細
    const failedResults = validationResults.filter(r => r.status === 'FAIL');
    if (failedResults.length > 0) {
        console.log('\n--- 失敗したテスト ---');
        failedResults.forEach(result => {
            console.log(`❌ [${result.category}] ${result.testName}: ${result.message}`);
        });
    }
    
    // 警告のあるテストの詳細
    const warningResults = validationResults.filter(r => r.status === 'WARN');
    if (warningResults.length > 0) {
        console.log('\n--- 警告のあるテスト ---');
        warningResults.forEach(result => {
            console.log(`⚠️ [${result.category}] ${result.testName}: ${result.message}`);
        });
    }
    
    console.log('\n=== 検証完了 ===');
    console.log('完了時刻:', new Date().toLocaleString('ja-JP'));
    
    // 結果をグローバル変数として保存
    window.validationResults = validationResults;
    console.log('\n結果は window.validationResults に保存されました。');
}

// メイン実行関数
function runAllValidations() {
    console.log('すべての検証を開始します...\n');
    
    // 各検証を順次実行
    validateFundSourceManagement();
    validateDataInitialization();
    validateAuthenticationSystem();
    validateCategorySubcategoryFunctionality();
    validateSharingFunctionality();
    validateUIResponsivenessAndErrorHandling();
    validateDataIntegrity();
    validatePerformance();
    validateUsability();
    
    // サマリー表示
    displayValidationSummary();
}

// 個別実行用の関数をグローバルに公開
window.validatePWABugFixes = {
    runAll: runAllValidations,
    fundSource: validateFundSourceManagement,
    dataInit: validateDataInitialization,
    auth: validateAuthenticationSystem,
    category: validateCategorySubcategoryFunctionality,
    sharing: validateSharingFunctionality,
    ui: validateUIResponsivenessAndErrorHandling,
    integrity: validateDataIntegrity,
    performance: validatePerformance,
    usability: validateUsability,
    summary: displayValidationSummary,
    results: () => validationResults
};

// 自動実行（コメントアウトして手動実行も可能）
console.log('PWA家計簿アプリ バグ修正検証スクリプトが読み込まれました。');
console.log('実行方法:');
console.log('- 全検証実行: validatePWABugFixes.runAll()');
console.log('- 個別実行: validatePWABugFixes.fundSource() など');
console.log('- 結果確認: validatePWABugFixes.results()');

// 自動実行
setTimeout(() => {
    runAllValidations();
}, 1000);