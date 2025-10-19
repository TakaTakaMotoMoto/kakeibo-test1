// Chart Management using Chart.js
class ChartManager {
    constructor() {
        this.currentChart = null;
        this.currentChartType = 'category';
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const chartType = e.currentTarget.dataset.chart;
                this.switchChart(chartType);
            });
        });
    }

    switchChart(chartType) {
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.chart === chartType);
        });

        this.currentChartType = chartType;

        if (chartType === 'category') {
            this.renderCategoryChart();
        } else if (chartType === 'monthly') {
            this.renderMonthlyChart();
        }
    }

    renderCategoryChart() {
        const transactions = window.dataManager.getTransactions();
        const categoryTotals = window.dataManager.getCategoryTotals(transactions);

        if (categoryTotals.length === 0) {
            this.renderEmptyChart('カテゴリ別の支出データがありません');
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
        const monthlyData = window.dataManager.getMonthlyTotals(6);

        if (monthlyData.every(item => item.total === 0)) {
            this.renderEmptyChart('月次の支出データがありません');
            return;
        }

        const data = {
            labels: monthlyData.map(item => item.month),
            datasets: [{
                label: '支出',
                data: monthlyData.map(item => item.total),
                backgroundColor: 'rgba(0, 122, 255, 0.2)',
                borderColor: 'rgba(0, 122, 255, 1)',
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
                            return `支出: ${window.dataManager.formatCurrency(context.raw)}`;
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
        } else {
            setTimeout(initCharts, 100);
        }
    };
    initCharts();
});