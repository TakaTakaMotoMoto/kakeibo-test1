// UI Utility Functions
class UIUtils {
    static escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    static formatCurrency(amount) {
        return new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: 'JPY'
        }).format(amount);
    }

    static formatDate(date) {
        return new Date(date).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static getFundSourceIcon(type) {
        const icons = {
            cash: '💰',
            bank: '🏦',
            credit: '💳',
            savings: '🏛️',
            investment: '📈'
        };
        return icons[type] || '💳';
    }

    static getFundSourceTypeName(type) {
        const names = {
            cash: '現金',
            bank: '銀行口座',
            credit: 'クレジットカード',
            savings: '貯金口座',
            investment: '投資口座'
        };
        return names[type] || 'その他';
    }

    static showNotification(message, type = 'info') {
        // Enhanced notification system
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            success: '✅',
            warning: '⚠️',
            error: '❌',
            info: 'ℹ️'
        };
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 16px;">${icons[type] || icons.info}</span>
                <span>${message}</span>
            </div>
        `;
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            maxWidth: '300px',
            wordWrap: 'break-word',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(10px)',
            cursor: 'pointer'
        });
        
        const backgrounds = {
            success: 'linear-gradient(135deg, #34C759, #30D158)',
            warning: 'linear-gradient(135deg, #FF9500, #FF9F0A)',
            error: 'linear-gradient(135deg, #FF3B30, #FF453A)',
            info: 'linear-gradient(135deg, #007AFF, #0A84FF)'
        };
        notification.style.background = backgrounds[type] || backgrounds.info;
        
        notification.addEventListener('click', () => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 50);
        
        const delays = { success: 2000, warning: 4000, error: 5000, info: 3000 };
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, delays[type] || delays.info);
    }
}

// Export for use in other modules
window.UIUtils = UIUtils;