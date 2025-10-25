// Chart Management using Chart.js
class ChartManager {
    constructor() {
        this.currentChart = null;
        this.currentChartType = 'category';
        this.currentDataType = 'expense'; // 'expense' or 'income'
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const chartType = e.currentTarget.dataset.chart;
                this.switchChart(chartType);
            });
        });

        // Add event listeners for income/expense tabs
        document.querySelectorAll('.data-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dataType = e.currentTarget.dataset.dataType;
                this.switchDataType(dataType);
            });
        });
    }

    switchChart(chartType) {
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.chart === chartType);
        });

        this.currentChartType = chartType;
        this.renderCurrentChart();
    }

    switchDataType(dataType) {
        document.querySelectorAll('.data-type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.dataType === dataType);
        });

        this.currentDataType = dataType;
        this.renderCurrentChart();
    }

    renderCurrentChart() {
        if (this.currentChartType === 'category') {
            this.renderCategoryChart();
        } else if (this.currentChartType === 'monthly') {
            this.renderMonthlyChart();
        }
    }

    renderCategoryChart() {
        const allTransactions = window.dataManager.getTransactions();
        
        // Filter transactions based on current data type (income or expense)
        const filteredTransactions = this.currentDataType === 'income' 
            ? allTransactions.filter(t => t.amount > 0)
            : allTransactions.filter(t => t.amount < 0);

        const categoryTotals = window.dataManager.getCategoryTotals(filteredTransactions);

        if (categoryTotals.length === 0) {
            const dataTypeLabel = this.currentDataType === 'income' ? '収入' : '支出';
            this.renderEmptyChart(`カテゴリ別の${dataTypeLabel}データがありません`);
            return;
        }

        const data = {
            labels: categoryTotals.map(item => item.category.name),
            datasets: [{
                data: categoryTotals.map(item => item.total),
                backgroundColor: categoryTotals.map(item => item.category.color),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = window.dataManager.formatCurrency(context.raw);
                            const percentage = ((context.raw / categoryTotals.reduce((sum, item) => sum + item.total, 0)) * 100).toFixed(1);
                            return `${context.label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        };

        this.renderChart('doughnut', data, options);
        this.renderCategoryLegend(categoryTotals);
    }

    renderMonthlyChart() {
        const monthlyData = this.getMonthlyTotalsByType(6);

        if (monthlyData.every(item => item.total === 0)) {
            const dataTypeLabel = this.currentDataType === 'income' ? '収入' : '支出';
            this.renderEmptyChart(`月次の${dataTypeLabel}データがありません`);
            return;
        }

        const dataTypeLabel = this.currentDataType === 'income' ? '収入' : '支出';
        const color = this.currentDataType === 'income' ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)';
        const backgroundColor = this.currentDataType === 'income' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';

        const data = {
            labels: monthlyData.map(item => item.month),
            datasets: [{
                label: dataTypeLabel,
                data: monthlyData.map(item => item.total),
                backgroundColor: backgroundColor,
                borderColor: color,
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            return `${dataTypeLabel}: ${window.dataManager.formatCurrency(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => {
                            return window.dataManager.formatCurrency(value);
                        }
                    }
                }
            }
        };

        this.renderChart('line', data, options);
        this.renderMonthlyLegend(monthlyData);
    }

    renderChart(type, data, options) {
        const canvas = document.getElementById('main-chart');
        const ctx = canvas.getContext('2d');

        // Destroy existing chart
        if (this.currentChart) {
            this.currentChart.destroy();
        }

        // Create new chart
        this.currentChart = new Chart(ctx, {
            type: type,
            data: data,
            options: options
        });
    }

    renderEmptyChart(message) {
        const container = document.querySelector('.chart-container');
        container.innerHTML = `
            <div class="empty-chart">
                <div class="empty-icon">📊</div>
                <p>${message}</p>
            </div>
        `;
    }

    renderCategoryLegend(categoryTotals) {
        const legendContainer = document.getElementById('chart-legend');
        const total = categoryTotals.reduce((sum, item) => sum + item.total, 0);

        const html = categoryTotals.map(item => {
            const percentage = ((item.total / total) * 100).toFixed(1);
            return `
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${item.category.color}"></div>
                    <div class="legend-info">
                        <div class="legend-name">${item.category.icon} ${item.category.name}</div>
                        <div class="legend-value">
                            ${window.dataManager.formatCurrency(item.total)} (${percentage}%)
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        legendContainer.innerHTML = html;
    }

    renderMonthlyLegend(monthlyData) {
        const legendContainer = document.getElementById('chart-legend');
        const totalExpenses = monthlyData.reduce((sum, item) => sum + item.total, 0);
        const averageExpenses = totalExpenses / monthlyData.length;

        const html = `
            <div class="monthly-summary">
                <div class="summary-item">
                    <div class="summary-label">合計支出</div>
                    <div class="summary-value">${window.dataManager.formatCurrency(totalExpenses)}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">月平均</div>
                    <div class="summary-value">${window.dataManager.formatCurrency(averageExpenses)}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">今月</div>
                    <div class="summary-value">${window.dataManager.formatCurrency(monthlyData[monthlyData.length - 1]?.total || 0)}</div>
                </div>
            </div>
        `;

        legendContainer.innerHTML = html;
    }

    // Get monthly totals filtered by income/expense type
    getMonthlyTotalsByType(months = 6) {
        const now = new Date();
        const result = [];

        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const transactions = window.dataManager.getTransactionsByMonth(date.getFullYear(), date.getMonth());
            
            // Filter by current data type
            const filteredTransactions = this.currentDataType === 'income' 
                ? transactions.filter(t => t.amount > 0)
                : transactions.filter(t => t.amount < 0);

            const total = filteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

            result.push({
                month: `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`,
                total: total
            });
        }

        return result;
    }

    // Utility method to generate colors
    generateColors(count) {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F4A261', '#E76F51', '#2A9D8F'
        ];
        
        const result = [];
        for (let i = 0; i < count; i++) {
            result.push(colors[i % colors.length]);
        }
        return result;
    }
}

// Initialize Chart Manager when dependencies are ready
document.addEventListener('DOMContentLoaded', () => {
    const initCharts = () => {
        if (window.dataManager && typeof Chart !== 'undefined') {
            window.chartManager = new ChartManager();
            
            // Set initial active state for data type buttons
            const expenseBtn = document.querySelector('.data-type-btn[data-data-type="expense"]');
            if (expenseBtn) {
                expenseBtn.classList.add('active');
            }
        } else {
            setTimeout(initCharts, 100);
        }
    };
    initCharts();
});