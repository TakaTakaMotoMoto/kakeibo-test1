// Authentication Manager for PWA
class AuthManager {
    constructor() {
        this.storageKey = 'budget_auth';
        this.currentUser = null;
        this.isLoggedIn = false;
        this.initialize();
    }

    initialize() {
        // Check if user is already logged in
        this.checkLoginStatus();
        
        // Initialize event listeners
        this.initializeEventListeners();
    }

    // Check if user is logged in from localStorage
    checkLoginStatus() {
        const authData = this.getAuthData();
        if (authData && authData.isLoggedIn && authData.user) {
            this.currentUser = authData.user;
            this.isLoggedIn = true;
            this.updateLastLogin();
        }
    }

    // Initialize event listeners for auth forms
    initializeEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Password reset form
        const resetForm = document.getElementById('reset-form');
        if (resetForm) {
            resetForm.addEventListener('submit', (e) => this.handlePasswordReset(e));
        }

        // Reset password with token form
        const resetPasswordForm = document.getElementById('reset-password-form');
        if (resetPasswordForm) {
            resetPasswordForm.addEventListener('submit', (e) => this.handleResetPasswordWithToken(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    // Password validation
    validatePassword(password) {
        // Password must be at least 8 characters and contain both letters and numbers
        if (password.length < 8) return false;
        
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        
        return hasLetter && hasNumber;
    }

    // Hash password (simple implementation for demo - in production use proper hashing)
    hashPassword(password) {
        // Simple hash function for demo purposes
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    // Register new user
    async handleRegister(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const email = formData.get('email').trim().toLowerCase();
        const username = formData.get('username').trim();
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        try {
            // Validation
            if (!email || !username || !password) {
                throw new Error('すべての項目を入力してください');
            }

            if (!this.isValidEmail(email)) {
                throw new Error('有効なメールアドレスを入力してください');
            }

            if (!this.validatePassword(password)) {
                throw new Error('パスワードは8文字以上で、英字と数字を含む必要があります');
            }

            if (password !== confirmPassword) {
                throw new Error('パスワードが一致しません');
            }

            // Check if user already exists
            const users = this.getUsers();
            if (users.find(user => user.email === email)) {
                throw new Error('このメールアドレスは既に使用されています');
            }

            // Create new user
            const newUser = {
                id: this.generateId(),
                email: email,
                username: username,
                passwordHash: this.hashPassword(password),
                createdAt: new Date().toISOString(),
                lastLoginDate: null,
                isLoggedIn: false
            };

            // Save user
            users.push(newUser);
            this.saveUsers(users);

            // Auto-login after registration
            this.loginUser(newUser);

            this.showMessage('アカウントが作成されました', 'success');
            this.hideAuthModal();

        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    // Login user
    async handleLogin(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const email = formData.get('email').trim().toLowerCase();
        const password = formData.get('password');

        try {
            if (!email || !password) {
                throw new Error('メールアドレスとパスワードを入力してください');
            }

            const users = this.getUsers();
            const user = users.find(u => u.email === email);

            if (!user) {
                throw new Error('ユーザーが見つかりません');
            }

            if (user.passwordHash !== this.hashPassword(password)) {
                throw new Error('メールアドレスまたはパスワードが正しくありません');
            }

            this.loginUser(user);
            this.showMessage('ログインしました', 'success');
            this.hideAuthModal();

        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    // Login user (internal method)
    loginUser(user) {
        this.currentUser = user;
        this.isLoggedIn = true;
        
        // Update user's login status
        user.isLoggedIn = true;
        user.lastLoginDate = new Date().toISOString();
        
        // Update users array
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
            users[userIndex] = user;
            this.saveUsers(users);
        }

        // Save auth state
        this.saveAuthData({
            isLoggedIn: true,
            user: user
        });

        // Update UI
        this.updateAuthUI();
        
        // Trigger auth state change event
        this.dispatchAuthEvent('login', user);
    }

    // Logout user
    logout() {
        if (this.currentUser) {
            // Update user's login status
            const users = this.getUsers();
            const userIndex = users.findIndex(u => u.id === this.currentUser.id);
            if (userIndex !== -1) {
                users[userIndex].isLoggedIn = false;
                this.saveUsers(users);
            }
        }

        this.currentUser = null;
        this.isLoggedIn = false;

        // Clear auth state
        this.saveAuthData({
            isLoggedIn: false,
            user: null
        });

        // Update UI
        this.updateAuthUI();
        
        // Trigger auth state change event
        this.dispatchAuthEvent('logout');

        this.showMessage('ログアウトしました', 'info');
    }

    // Password reset
    async handlePasswordReset(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const email = formData.get('email').trim().toLowerCase();

        try {
            if (!email) {
                throw new Error('メールアドレスを入力してください');
            }

            const users = this.getUsers();
            const user = users.find(u => u.email === email);

            if (!user) {
                throw new Error('ユーザーが見つかりません');
            }

            // Generate reset token (for demo purposes)
            const resetToken = this.generateResetToken();
            user.resetToken = resetToken;
            user.resetTokenExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour

            // Update users
            const userIndex = users.findIndex(u => u.id === user.id);
            users[userIndex] = user;
            this.saveUsers(users);

            // Show token to user (in production, this would be sent via email)
            this.showResetToken(resetToken);
            
            // Show the reset password section
            setTimeout(() => {
                document.getElementById('reset-password-section').style.display = 'block';
            }, 2000);

        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    // Handle reset password with token form submission
    async handleResetPasswordWithToken(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const token = formData.get('token').trim();
        const newPassword = formData.get('newPassword');

        const success = await this.resetPasswordWithToken(token, newPassword);
        
        if (success) {
            // Switch back to login view
            this.switchAuthMode('login');
            
            // Clear the reset form
            document.getElementById('reset-form').reset();
            document.getElementById('reset-password-form').reset();
            document.getElementById('reset-token-display').style.display = 'none';
            document.getElementById('reset-password-section').style.display = 'none';
        }
    }

    // Reset password with token
    async resetPasswordWithToken(token, newPassword) {
        try {
            if (!this.validatePassword(newPassword)) {
                throw new Error('パスワードは8文字以上で、英字と数字を含む必要があります');
            }

            const users = this.getUsers();
            const user = users.find(u => 
                u.resetToken === token && 
                u.resetTokenExpiry && 
                new Date(u.resetTokenExpiry) > new Date()
            );

            if (!user) {
                throw new Error('無効なリセットトークンです');
            }

            // Update password
            user.passwordHash = this.hashPassword(newPassword);
            user.resetToken = null;
            user.resetTokenExpiry = null;

            // Update users
            const userIndex = users.findIndex(u => u.id === user.id);
            users[userIndex] = user;
            this.saveUsers(users);

            this.showMessage('パスワードが更新されました', 'success');
            return true;

        } catch (error) {
            this.showMessage(error.message, 'error');
            return false;
        }
    }

    // Update last login time
    updateLastLogin() {
        if (this.currentUser) {
            this.currentUser.lastLoginDate = new Date().toISOString();
            
            const users = this.getUsers();
            const userIndex = users.findIndex(u => u.id === this.currentUser.id);
            if (userIndex !== -1) {
                users[userIndex] = this.currentUser;
                this.saveUsers(users);
            }

            this.saveAuthData({
                isLoggedIn: true,
                user: this.currentUser
            });
        }
    }

    // Update UI based on auth state
    updateAuthUI() {
        const authModal = document.getElementById('auth-modal');
        const mainApp = document.getElementById('main-app');
        const userInfo = document.getElementById('user-info');
        const loginBtn = document.getElementById('show-login');
        const logoutBtn = document.getElementById('logout-btn');

        if (this.isLoggedIn) {
            // Hide auth modal, show main app
            if (authModal) authModal.style.display = 'none';
            if (mainApp) mainApp.style.display = 'flex';
            
            // Update user info
            if (userInfo && this.currentUser) {
                userInfo.innerHTML = `
                    <div class="user-avatar">👤</div>
                    <div class="user-details">
                        <div class="user-name">${this.currentUser.username}</div>
                        <div class="user-email">${this.currentUser.email}</div>
                    </div>
                `;
            }
            
            // Show logout button, hide login button
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (loginBtn) loginBtn.style.display = 'none';
            
        } else {
            // Show auth modal, hide main app
            if (authModal) authModal.style.display = 'flex';
            if (mainApp) mainApp.style.display = 'none';
            
            // Clear user info
            if (userInfo) userInfo.innerHTML = '';
            
            // Hide logout button, show login button
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (loginBtn) loginBtn.style.display = 'block';
        }
    }

    // Show auth modal
    showAuthModal(mode = 'login') {
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.style.display = 'flex';
            this.switchAuthMode(mode);
        }
    }

    // Hide auth modal
    hideAuthModal() {
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.style.display = 'none';
        }
    }

    // Switch between login/register/reset modes
    switchAuthMode(mode) {
        const loginView = document.getElementById('login-view');
        const registerView = document.getElementById('register-view');
        const resetView = document.getElementById('reset-view');

        // Hide all views
        [loginView, registerView, resetView].forEach(view => {
            if (view) view.style.display = 'none';
        });

        // Show selected view
        const targetView = document.getElementById(`${mode}-view`);
        if (targetView) {
            targetView.style.display = 'block';
        }
    }

    // Show reset token (for demo purposes)
    showResetToken(token) {
        const tokenDisplay = document.getElementById('reset-token-display');
        if (tokenDisplay) {
            tokenDisplay.innerHTML = `
                <div class="reset-token-info">
                    <h4>リセットトークン（デモ用）:</h4>
                    <code>${token}</code>
                    <p>実際のアプリでは、このトークンはメールで送信されます。</p>
                </div>
            `;
            tokenDisplay.style.display = 'block';
        }
    }

    // Utility methods
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    generateResetToken() {
        return Math.random().toString(36).substr(2) + Date.now().toString(36);
    }

    // Storage methods
    getAuthData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Auth data retrieval error:', error);
            return null;
        }
    }

    saveAuthData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Auth data save error:', error);
        }
    }

    getUsers() {
        try {
            const users = localStorage.getItem('budget_users');
            return users ? JSON.parse(users) : [];
        } catch (error) {
            console.error('Users retrieval error:', error);
            return [];
        }
    }

    saveUsers(users) {
        try {
            localStorage.setItem('budget_users', JSON.stringify(users));
        } catch (error) {
            console.error('Users save error:', error);
        }
    }

    // Event handling
    dispatchAuthEvent(type, user = null) {
        const event = new CustomEvent('authStateChange', {
            detail: { type, user, isLoggedIn: this.isLoggedIn }
        });
        window.dispatchEvent(event);
    }

    // Message display
    showMessage(message, type = 'info') {
        if (window.budgetApp && window.budgetApp.showNotification) {
            window.budgetApp.showNotification(message, type);
        } else {
            // Fallback alert
            alert(message);
        }
    }

    // Public API
    getCurrentUser() {
        return this.currentUser;
    }

    getIsLoggedIn() {
        return this.isLoggedIn;
    }

    // Data access control
    hasDataAccess() {
        return this.isLoggedIn;
    }

    // Get user-specific data key
    getUserDataKey(baseKey) {
        if (!this.currentUser) return baseKey;
        return `${baseKey}_${this.currentUser.id}`;
    }
}

// Create global instance
window.authManager = new AuthManager();

// Listen for auth state changes
window.addEventListener('authStateChange', (event) => {
    console.log('Auth state changed:', event.detail);
    
    // Update UI components that depend on auth state
    if (window.uiManager) {
        window.uiManager.updateAuthDependentUI();
    }
    
    // Refresh data if user logged in
    if (event.detail.type === 'login' && window.dataManager) {
        window.dataManager.refreshData();
    }
});