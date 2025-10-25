// Fund Source Type Selector - Manages fund source type selection
class FundSourceTypeSelector {
    constructor() {
        this.availableTypes = [
            { id: 'bank', name: '銀行口座', icon: '🏦' },
            { id: 'cash', name: '現金', icon: '💵' },
            { id: 'credit', name: 'クレジットカード', icon: '💳' },
            { id: 'digital', name: 'デジタル決済', icon: '📱' }
        ];
    }

    // Get all available fund source types
    getAvailableTypes() {
        return this.availableTypes;
    }

    // Get type display information by ID
    getTypeById(typeId) {
        return this.availableTypes.find(type => type.id === typeId);
    }

    // Get type display name
    getTypeDisplayName(typeId) {
        const type = this.getTypeById(typeId);
        return type ? `${type.icon} ${type.name}` : typeId;
    }

    // Render type selector HTML
    renderTypeSelector(selectedType = null, elementId = 'fs-type') {
        const options = this.availableTypes.map(type => 
            `<option value="${type.id}" ${selectedType === type.id ? 'selected' : ''}>
                ${type.icon} ${type.name}
            </option>`
        ).join('');

        return `
            <select id="${elementId}" name="type" required>
                <option value="">タイプを選択してください</option>
                ${options}
            </select>
        `;
    }

    // Initialize type selector in existing form
    initializeTypeSelector(formId, selectedType = null) {
        const form = document.getElementById(formId);
        if (!form) {
            console.error(`Form with ID ${formId} not found`);
            return false;
        }

        // Find the balance input to insert type selector before it
        const balanceGroup = form.querySelector('.form-group:has(#fs-balance)') || 
                           form.querySelector('input[name="balance"]')?.closest('.form-group');
        
        if (!balanceGroup) {
            console.error('Balance input group not found');
            return false;
        }

        // Create type selector group
        const typeGroup = document.createElement('div');
        typeGroup.className = 'form-group';
        typeGroup.innerHTML = `
            <label for="fs-type">タイプ</label>
            ${this.renderTypeSelector(selectedType, 'fs-type')}
        `;

        // Insert before balance group
        balanceGroup.parentNode.insertBefore(typeGroup, balanceGroup);

        return true;
    }

    // Update existing type selector
    updateTypeSelector(selectedType, elementId = 'fs-type') {
        const selector = document.getElementById(elementId);
        if (selector) {
            selector.value = selectedType || '';
            return true;
        }
        return false;
    }

    // Validate type selection
    validateTypeSelection(typeId) {
        if (!typeId) {
            return '資金元タイプを選択してください';
        }

        const type = this.getTypeById(typeId);
        if (!type) {
            return '無効な資金元タイプです';
        }

        return null; // No error
    }

    // Get type statistics from fund sources
    getTypeStatistics(fundSources) {
        const stats = {};
        
        // Initialize stats for all types
        this.availableTypes.forEach(type => {
            stats[type.id] = {
                count: 0,
                totalBalance: 0,
                name: type.name,
                icon: type.icon
            };
        });

        // Count fund sources by type
        fundSources.forEach(fs => {
            const type = fs.type || 'bank'; // Default to bank for legacy data
            if (stats[type]) {
                stats[type].count++;
                stats[type].totalBalance += fs.balance || 0;
            }
        });

        return stats;
    }

    // Format balance for display
    formatBalance(balance) {
        return new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: 'JPY'
        }).format(balance);
    }

    // Get type color for UI styling
    getTypeColor(typeId) {
        const colorMap = {
            'bank': '#007AFF',
            'cash': '#34C759',
            'credit': '#FF9500',
            'digital': '#AF52DE'
        };
        return colorMap[typeId] || '#8E8E93';
    }

    // Get type description for help text
    getTypeDescription(typeId) {
        const descriptions = {
            'bank': '銀行口座、信用金庫、郵便局などの金融機関の口座',
            'cash': '現金、小銭、お財布の中のお金',
            'credit': 'クレジットカード、デビットカード',
            'digital': 'PayPay、楽天Pay、Suicaなどのデジタル決済'
        };
        return descriptions[typeId] || '';
    }
}

// Export for global use
window.FundSourceTypeSelector = FundSourceTypeSelector;