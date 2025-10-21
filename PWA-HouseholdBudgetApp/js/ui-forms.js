// Form Validation and Processing
class FormValidator {
    constructor() {
        this.validationRules = {};
    }

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const formGroup = field?.closest('.form-group');

        if (!formGroup) return;

        this.clearFieldError(fieldId);

        formGroup.classList.add('error');
        formGroup.classList.remove('success');

        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = message;
        formGroup.appendChild(errorMessage);

        setTimeout(() => {
            errorMessage.classList.add('show');
        }, 10);

        field.focus();
    }

    showFieldSuccess(fieldId) {
        const field = document.getElementById(fieldId);
        const formGroup = field?.closest('.form-group');

        if (!formGroup) return;

        this.clearFieldError(fieldId);
        formGroup.classList.add('success');
        formGroup.classList.remove('error');
    }

    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        const formGroup = field?.closest('.form-group');

        if (!formGroup) return;

        formGroup.classList.remove('error', 'success');

        const errorMessage = formGroup.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    clearFormErrors(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        const formGroups = form.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            group.classList.remove('error', 'success');
            const errorMessage = group.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.remove();
            }
        });
    }

    validateForm(formId, validationRules) {
        const form = document.getElementById(formId);
        if (!form) return false;

        let isValid = true;

        for (const [fieldId, rules] of Object.entries(validationRules)) {
            const field = document.getElementById(fieldId);
            if (!field) continue;

            const value = field.value.trim();

            // Required validation
            if (rules.required && !value) {
                this.showFieldError(fieldId, rules.requiredMessage || 'この項目は必須です');
                isValid = false;
                continue;
            }

            // Skip other validations if field is empty and not required
            if (!value && !rules.required) {
                this.clearFieldError(fieldId);
                continue;
            }

            // Length validation
            if (rules.minLength && value.length < rules.minLength) {
                this.showFieldError(fieldId, `${rules.minLength}文字以上で入力してください`);
                isValid = false;
                continue;
            }

            if (rules.maxLength && value.length > rules.maxLength) {
                this.showFieldError(fieldId, `${rules.maxLength}文字以内で入力してください`);
                isValid = false;
                continue;
            }

            // Pattern validation
            if (rules.pattern && !rules.pattern.test(value)) {
                this.showFieldError(fieldId, rules.patternMessage || '入力形式が正しくありません');
                isValid = false;
                continue;
            }

            // Custom validation
            if (rules.custom && typeof rules.custom === 'function') {
                const customResult = rules.custom(value);
                if (customResult !== true) {
                    this.showFieldError(fieldId, customResult || '入力値が無効です');
                    isValid = false;
                    continue;
                }
            }

            // If we get here, the field is valid
            this.showFieldSuccess(fieldId);
        }

        return isValid;
    }

    validateFieldOnBlur(field) {
        const formGroup = field.closest('.form-group');
        if (!formGroup) return;

        const value = field.value.trim();

        // Basic validation based on field attributes
        if (field.hasAttribute('required') && !value) {
            this.showFieldError(field.id, 'この項目は必須です');
            return;
        }

        if (field.type === 'email' && value && !UIUtils.isValidEmail(value)) {
            this.showFieldError(field.id, '有効なメールアドレスを入力してください');
            return;
        }

        if (field.type === 'number' && value) {
            const num = parseFloat(value);
            if (isNaN(num)) {
                this.showFieldError(field.id, '有効な数値を入力してください');
                return;
            }

            const min = field.getAttribute('min');
            const max = field.getAttribute('max');

            if (min !== null && num < parseFloat(min)) {
                this.showFieldError(field.id, `${min}以上の値を入力してください`);
                return;
            }

            if (max !== null && num > parseFloat(max)) {
                this.showFieldError(field.id, `${max}以下の値を入力してください`);
                return;
            }
        }

        // If we get here, the field is valid
        this.clearFieldError(field.id);
    }

    initializeFormValidation() {
        // Add form field validation on blur
        document.addEventListener('blur', (e) => {
            if (e.target.matches('input, select, textarea')) {
                this.validateFieldOnBlur(e.target);
            }
        }, true);
    }
}

// Export for use in other modules
window.FormValidator = FormValidator;