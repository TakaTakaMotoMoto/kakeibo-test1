import Foundation
import SwiftData

enum ChartPeriod: String, CaseIterable {
    case monthly = "chart.monthly"
    case yearly = "chart.yearly"
    
    var localizedString: String {
        return self.rawValue.localized
    }
}

struct ChartDataPoint: Identifiable {
    let id = UUID()
    let name: String
    let value: Decimal
    let color: String?
    
    init(name: String, value: Decimal, color: String? = nil) {
        self.name = name
        self.value = value
        self.color = color
    }
}

struct MonthlyDataPoint: Identifiable {
    let id = UUID()
    let month: Int
    let monthName: String
    let totalAmount: Decimal
    
    init(month: Int, monthName: String, totalAmount: Decimal) {
        self.month = month
        self.monthName = monthName
        self.totalAmount = totalAmount
    }
}

@Observable
final class ChartViewModel {
    private let modelContext: ModelContext
    
    var chartData: [ChartDataPoint] = []
    var monthlyData: [MonthlyDataPoint] = []
    var selectedPeriod: ChartPeriod = .monthly
    var selectedMonth: Date = Date()
    var selectedYear: Int = Calendar.current.component(.year, from: Date())
    var selectedCategory: Category?
    var totalAmount: Decimal = 0
    var currentError: BudgetAppError?
    
    private let calendar = Calendar.current
    private let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ja_JP")
        return formatter
    }()
    
    init(modelContext: ModelContext) {
        self.modelContext = modelContext
        refreshData()
    }
    
    // MARK: - Public Methods
    
    func refreshData() {
        switch selectedPeriod {
        case .monthly:
            fetchCategoryBreakdown(for: selectedMonth)
        case .yearly:
            fetchMonthlyData(for: selectedYear)
        }
    }
    
    func selectPeriod(_ period: ChartPeriod) {
        selectedPeriod = period
        selectedCategory = nil // Clear category selection when switching periods
        refreshData()
    }
    
    func selectMonth(_ month: Date) {
        selectedMonth = month
        if selectedPeriod == .monthly {
            refreshData()
        }
    }
    
    func selectYear(_ year: Int) {
        selectedYear = year
        if selectedPeriod == .yearly {
            refreshData()
        }
    }
    
    func selectCategory(_ category: Category?) {
        selectedCategory = category
        if let category = category {
            fetchSubcategoryBreakdown(for: category, month: selectedMonth)
        } else {
            fetchCategoryBreakdown(for: selectedMonth)
        }
    }
    
    // MARK: - Data Fetching Methods
    
    func fetchMonthlyData(for year: Int) {
        do {
            let startOfYear = calendar.date(from: DateComponents(year: year, month: 1, day: 1))!
            let endOfYear = calendar.date(from: DateComponents(year: year + 1, month: 1, day: 1))!
            
            let descriptor = FetchDescriptor<Transaction>(
                predicate: #Predicate<Transaction> { transaction in
                    transaction.date >= startOfYear && transaction.date < endOfYear
                },
                sortBy: [SortDescriptor(\.date)]
            )
            
            let transactions = try modelContext.fetch(descriptor)
            
            // Group transactions by month
            var monthlyTotals: [Int: Decimal] = [:]
            
            for transaction in transactions {
                let month = calendar.component(.month, from: transaction.date)
                monthlyTotals[month, default: 0] += transaction.amount
            }
            
            // Create monthly data points
            monthlyData = (1...12).map { month in
                let monthName = getMonthName(month)
                let amount = monthlyTotals[month] ?? 0
                return MonthlyDataPoint(month: month, monthName: monthName, totalAmount: amount)
            }
            
            // Calculate total for the year
            totalAmount = monthlyTotals.values.reduce(0, +)
            
        } catch {
            currentError = BudgetAppError.from(error, context: .chartDataFetch)
        }
    }
    
    func fetchCategoryBreakdown(for month: Date) {
        do {
            let startOfMonth = calendar.dateInterval(of: .month, for: month)?.start ?? month
            let endOfMonth = calendar.dateInterval(of: .month, for: month)?.end ?? month
            
            let descriptor = FetchDescriptor<Transaction>(
                predicate: #Predicate<Transaction> { transaction in
                    transaction.date >= startOfMonth && transaction.date < endOfMonth
                },
                sortBy: [SortDescriptor(\.date)]
            )
            
            let transactions = try modelContext.fetch(descriptor)
            
            // Group transactions by category
            var categoryTotals: [String: (amount: Decimal, color: String)] = [:]
            var colorIndex = 0
            
            for transaction in transactions {
                let categoryName = transaction.category?.name ?? "未分類"
                let categoryColor = transaction.category?.colorHex ?? ColorManager.chartColorHex(for: colorIndex)
                
                if var existing = categoryTotals[categoryName] {
                    existing.amount += transaction.amount
                    categoryTotals[categoryName] = existing
                } else {
                    categoryTotals[categoryName] = (amount: transaction.amount, color: categoryColor)
                    colorIndex += 1
                }
            }
            
            // Create chart data points
            chartData = categoryTotals.map { (name, data) in
                ChartDataPoint(name: name, value: data.amount, color: data.color)
            }.sorted { $0.value > $1.value }
            
            // Calculate total for the month
            totalAmount = categoryTotals.values.reduce(0) { $0 + $1.amount }
            
        } catch {
            currentError = BudgetAppError.from(error, context: .chartDataFetch)
        }
    }
    
    func fetchSubcategoryBreakdown(for category: Category, month: Date) {
        do {
            let startOfMonth = calendar.dateInterval(of: .month, for: month)?.start ?? month
            let endOfMonth = calendar.dateInterval(of: .month, for: month)?.end ?? month
            
            let descriptor = FetchDescriptor<Transaction>(
                predicate: #Predicate<Transaction> { transaction in
                    transaction.date >= startOfMonth && 
                    transaction.date < endOfMonth &&
                    transaction.category?.id == category.id
                },
                sortBy: [SortDescriptor(\.date)]
            )
            
            let transactions = try modelContext.fetch(descriptor)
            
            // Group transactions by subcategory
            var subcategoryTotals: [String: Decimal] = [:]
            
            for transaction in transactions {
                let subcategoryName = transaction.subcategory?.name ?? "その他"
                subcategoryTotals[subcategoryName, default: 0] += transaction.amount
            }
            
            // Create chart data points
            chartData = subcategoryTotals.enumerated().map { (index, data) in
                let (name, amount) = data
                return ChartDataPoint(name: name, value: amount, color: ColorManager.chartColorHex(for: index))
            }.sorted { $0.value > $1.value }
            
            // Calculate total for the category
            totalAmount = subcategoryTotals.values.reduce(0, +)
            
        } catch {
            currentError = BudgetAppError.from(error, context: .chartDataFetch)
        }
    }
    
    // MARK: - Helper Methods
    
    private func getMonthName(_ month: Int) -> String {
        dateFormatter.dateFormat = "M月"
        let date = calendar.date(from: DateComponents(month: month))!
        return dateFormatter.string(from: date)
    }
    
    func getFormattedAmount(_ amount: Decimal) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = Locale(identifier: "ja_JP")
        return formatter.string(from: amount as NSDecimalNumber) ?? "¥0"
    }
    
    func getFormattedDate(_ date: Date) -> String {
        dateFormatter.dateFormat = "yyyy年M月"
        return dateFormatter.string(from: date)
    }
    
    func getAvailableYears() -> [Int] {
        let currentYear = calendar.component(.year, from: Date())
        return Array((currentYear - 5)...(currentYear + 1))
    }
    
    func clearError() {
        currentError = nil
    }
}