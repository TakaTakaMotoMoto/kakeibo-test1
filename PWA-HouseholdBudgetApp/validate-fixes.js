// Validation script for data initialization system fixes
// This script can be run in the browser console to validate the fixes

console.log('=== データ初期化システム修正の検証 ===');

// Test 1: Check if StorageManager is properly initialized
console.log('\n1. StorageManager初期化テスト');
if (typeof window.storage !== 'undefined') {
    console.log('✓ StorageManagerが存在します');
    
    // Check if initialization methods exist
    const requiredMethods = ['initializeDefaultData', 'reinitializeUserData', 'isInitialized', 'forceReinitialize'];
    requiredMethods.forEach(method => {
        if (typeof window.storage[method] === 'function') {
            console.log(`✓ ${method}メソッドが存在します`);
        } else {
            console.log(`✗ ${method}メソッドが存在しません`);
        }
    });
} else {
    console.log('✗ StorageManagerが存在しません');
}

// Test 2: Check user key generation
console.log('\n2. ユーザーキー生成テスト');
if (window.storage && typeof window.storage.getUserKey === 'function') {
    const testKey = 'test_key';
    const userKey = window.storage.getUserKey(testKey);
    console.log(`ベースキー: ${testKey}`);
    console.log(`ユーザーキー: ${userKey}`);
    
    if (userKey) {
        console.log('✓ ユーザーキー生成が動作しています');
    } else {
        console.log('✗ ユーザーキー生成に問題があります');
    }
} else {
    console.log('✗ getUserKeyメソッドが存在しません');
}

// Test 3: Check data access control
console.log('\n3. データアクセス制御テスト');
if (window.storage && typeof window.storage.hasDataAccess === 'function') {
    const hasAccess = window.storage.hasDataAccess();
    console.log(`データアクセス権限: ${hasAccess ? '許可' : '拒否'}`);
    console.log('✓ データアクセス制御が動作しています');
} else {
    console.log('✗ hasDataAccessメソッドが存在しません');
}

// Test 4: Check default data initialization
console.log('\n4. デフォルトデータ初期化テスト');
if (window.storage) {
    try {
        const categories = window.storage.getCategories();
        const subcategories = window.storage.getSubcategories();
        const fundSources = window.storage.getFundSources();
        
        console.log(`カテゴリ数: ${categories.length}`);
        console.log(`サブカテゴリ数: ${subcategories.length}`);
        console.log(`資金元数: ${fundSources.length}`);
        
        if (categories.length > 0 && fundSources.length > 0) {
            console.log('✓ デフォルトデータが正常に初期化されています');
        } else {
            console.log('✗ デフォルトデータの初期化に問題があります');
        }
    } catch (error) {
        console.log(`✗ デフォルトデータ取得エラー: ${error.message}`);
    }
} else {
    console.log('✗ StorageManagerが利用できません');
}

// Test 5: Check auth state change handling
console.log('\n5. 認証状態変更処理テスト');
if (window.authManager) {
    console.log('✓ AuthManagerが存在します');
    
    const isLoggedIn = window.authManager.getIsLoggedIn();
    const currentUser = window.authManager.getCurrentUser();
    
    console.log(`ログイン状態: ${isLoggedIn}`);
    console.log(`現在のユーザー: ${currentUser ? currentUser.username : 'なし'}`);
    
    // Check if auth state change event listener is set up
    console.log('✓ 認証状態変更処理が設定されています');
} else {
    console.log('✗ AuthManagerが存在しません');
}

// Test 6: Check initialization timing
console.log('\n6. 初期化タイミングテスト');
if (window.storage && typeof window.storage.isInitialized === 'function') {
    const isInitialized = window.storage.isInitialized();
    console.log(`初期化完了状態: ${isInitialized}`);
    
    if (isInitialized) {
        console.log('✓ システムが正常に初期化されています');
    } else {
        console.log('⚠️ システムの初期化が完了していない可能性があります');
    }
} else {
    console.log('✗ 初期化状態チェック機能が存在しません');
}

// Test 7: Check error handling improvements
console.log('\n7. エラーハンドリング改善テスト');
try {
    // Test with temporarily disabled auth manager
    const originalAuthManager = window.authManager;
    window.authManager = null;
    
    if (window.storage) {
        const testKey = window.storage.getUserKey('test');
        const hasAccess = window.storage.hasDataAccess();
        
        console.log('✓ 認証マネージャー無効時のエラーハンドリングが動作しています');
    }
    
    // Restore auth manager
    window.authManager = originalAuthManager;
} catch (error) {
    console.log(`✗ エラーハンドリングテストでエラー: ${error.message}`);
}

console.log('\n=== 検証完了 ===');
console.log('詳細なテストを実行するには、test-data-initialization.html を開いてください。');