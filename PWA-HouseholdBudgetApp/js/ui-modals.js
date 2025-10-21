// Modal Management System
class ModalManager {
    constructor() {
        this.currentModalEscapeHandler = null;
        this.activeModals = new Set();
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`Modal with ID '${modalId}' not found`);
            return;
        }

        modal.style.display = 'flex';
        modal.classList.add('show');
        document.body.classList.add('modal-open');
        this.activeModals.add(modalId);

        // Set up escape key handler
        this.currentModalEscapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModal(modalId);
            }
        };
        document.addEventListener('keydown', this.currentModalEscapeHandler);

        // Focus management
        const firstFocusable = modal.querySelector('input, select, textarea, button');
        if (firstFocusable) {
            setTimeout(() => firstFocusable.focus(), 100);
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
        this.activeModals.delete(modalId);

        // Remove escape key handler
        if (this.currentModalEscapeHandler) {
            document.removeEventListener('keydown', this.currentModalEscapeHandler);
            this.currentModalEscapeHandler = null;
        }

        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);

        // Clear form errors if form exists
        const form = modal.querySelector('form');
        if (form && window.formValidator) {
            window.formValidator.clearFormErrors(form.id);
        }
    }

    showInfoModal(title, content) {
        let modal = document.getElementById('info-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'info-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="info-modal-title">${title}</h2>
                        <button class="close-btn" data-modal="info-modal">×</button>
                    </div>
                    <div class="modal-body" id="info-modal-body">
                        ${content}
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Add event listeners
            modal.querySelector('.close-btn').addEventListener('click', () => {
                this.closeModal('info-modal');
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal('info-modal');
                }
            });
        } else {
            // Update existing modal
            document.getElementById('info-modal-title').textContent = title;
            document.getElementById('info-modal-body').innerHTML = content;
        }
        
        this.showModal('info-modal');
    }

    closeAllModals() {
        this.activeModals.forEach(modalId => {
            this.closeModal(modalId);
        });
    }

    isModalOpen(modalId) {
        return this.activeModals.has(modalId);
    }

    getActiveModals() {
        return Array.from(this.activeModals);
    }
}

// Export for use in other modules
window.ModalManager = ModalManager;