// Calendar Management
class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('prev-month').addEventListener('click', () => {
            this.previousMonth();
        });

        document.getElementById('next-month').addEventListener('click', () => {
            this.nextMonth();
        });
    }

    renderCalendar() {
        this.updateMonthHeader();
        this.renderCalendarDays();
        this.renderSelectedDateTransactions();
    }

    updateMonthHeader() {
        const monthHeader = document.getElementById('current-month');
        const monthName = this.currentDate.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long'
        });
        monthHeader.textContent = monthName;
    }

    renderCalendarDays() {
        const container = document.getElementById('calendar-days');
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        // Get previous month's last days
        const prevMonth = new Date(year, month - 1, 0);
        const daysInPrevMonth = prevMonth.getDate();
        
        // Get daily transaction data
        const dailyData = window.dataManager.getDailyTotals(year, month);
        
        let html = '';
        
        // Previous month's days
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            html += this.renderCalendarDay(new Date(year, month - 1, day), true);
        }
        
        // Current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayData = dailyData[day];
            html += this.renderCalendarDay(date, false, dayData);
        }
        
        // Next month's days to fill the grid
        const totalCells = Math.ceil((startingDayOfWeek + daysInMonth) / 7) * 7;
        const remainingCells = totalCells - (startingDayOfWeek + daysInMonth);
        
        for (let day = 1; day <= remainingCells; day++) {
            html += this.renderCalendarDay(new Date(year, month + 1, day), true);
        }
        
        container.innerHTML = html;
        
        // Add click handlers
        container.querySelectorAll('.calendar-day').forEach(dayElement => {
            dayElement.addEventListener('click', () => {
                const dateStr = dayElement.dataset.date;
                if (dateStr) {
                    this.selectDate(new Date(dateStr));
                }
            });
        });
    }

    renderCalendarDay(date, isOtherMonth, dayData = null) {
        const today = new Date();
        const isToday = this.isSameDay(date, today);
        const isSelected = this.isSameDay(date, this.selectedDate);
        const dayNumber = date.getDate();
        
        let classes = ['calendar-day'];
        if (isOtherMonth) classes.push('other-month');
        if (isToday) classes.push('today');
        if (isSelected) classes.push('selected');
        
        let transactionDots = '';
        if (dayData && dayData.transactions.length > 0) {
            const categories = window.storage.getCategories();
            const uniqueCategories = [...new Set(dayData.transactions.map(t => t.categoryId))];
            
            transactionDots = `
                <div class="transaction-dots">
                    ${uniqueCategories.slice(0, 3).map(categoryId => {
                        const category = categories.find(c => c.id === categoryId);
                        return `<div class="transaction-dot" style="background-color: ${category?.color || '#007AFF'}"></div>`;
                    }).join('')}
                    ${uniqueCategories.length > 3 ? '<div class="transaction-dot-more">+</div>' : ''}
                </div>
            `;
        }
        
        return `
            <div class="${classes.join(' ')}" data-date="${date.toISOString()}">
                <div class="calendar-day-number">${dayNumber}</div>
                ${transactionDots}
            </div>
        `;
    }

    renderSelectedDateTransactions() {
        const container = document.getElementById('selected-date-transactions');
        const transactions = window.dataManager.getTransactionsByDate(this.selectedDate);
        const categories = window.storage.getCategories();
        const fundSources = window.storage.getFundSources();
        
        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="empty-date">
                    <div class="empty-icon">📅</div>
                    <h4>この日に取引はありません</h4>
                    <p>${this.formatDate(this.selectedDate)}</p>
                </div>
            `;
            return;
        }
        
        const total = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        const header = `
            <div class="selected-date-header">
                <div class="selected-date-title">${this.formatDate(this.selectedDate)}</div>
                <div class="selected-date-total">合計: ${window.dataManager.formatCurrency(total)}</div>
            </div>
        `;
        
        const transactionsList = transactions.map(transaction => {
            const category = categories.find(c => c.id === transaction.categoryId);
            const fundSource = fundSources.find(fs => fs.id === transaction.fundSourceId);
            
            return `
                <div class="transaction-item" data-id="${transaction.id}">
                    <div class="transaction-info">
                        <div class="transaction-category">
                            ${category ? category.icon : '📦'} ${category ? category.name : 'カテゴリなし'}
                        </div>
                        <div class="transaction-date">
                            ${fundSource ? fundSource.name : ''}
                            ${transaction.note ? `・${transaction.note}` : ''}
                        </div>
                    </div>
                    <div class="transaction-amount ${transaction.amount < 0 ? 'expense' : 'income'}">
                        ${window.dataManager.formatCurrency(transaction.amount)}
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = header + transactionsList;
        
        // Add click handlers for transactions
        container.querySelectorAll('.transaction-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                window.uiManager.editTransaction(id);
            });
        });
    }

    selectDate(date) {
        this.selectedDate = new Date(date);
        
        // Update visual selection
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.classList.remove('selected');
        });
        
        document.querySelectorAll('.calendar-day').forEach(day => {
            const dayDate = new Date(day.dataset.date);
            if (this.isSameDay(dayDate, this.selectedDate)) {
                day.classList.add('selected');
            }
        });
        
        this.renderSelectedDateTransactions();
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }

    // Utility methods
    isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }

    formatDate(date) {
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    }

    // Public methods for external use
    goToDate(date) {
        this.currentDate = new Date(date);
        this.selectedDate = new Date(date);
        this.renderCalendar();
    }

    goToToday() {
        const today = new Date();
        this.goToDate(today);
    }
}

// Initialize Calendar Manager
document.addEventListener('DOMContentLoaded', () => {
    window.calendarManager = new CalendarManager();
});