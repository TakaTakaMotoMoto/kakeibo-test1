import SwiftUI
import Charts

struct CategoryChartView: View {
    let chartData: [ChartDataPoint]
    let selectedMonth: Date
    let selectedCategory: Category?
    let totalAmount: Decimal
    let onCategoryTap: (String) -> Void
    
    private let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ja_JP")
        formatter.dateFormat = "yyyy年M月"
        return formatter
    }()
    
    var body: some View {
        VStack(spacing: 16) {
            // Title
            Text(chartTitle)
                .font(.headline)
                .padding(.horizontal)
                .accessibilityAddTraits(.isHeader)
            
            // Total Amount
            Text(formatAmount(totalAmount))
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(ColorManager.primaryText)
                .accessibilityLabel("accessibility.value.totalExpense".localized(with: formatAmount(totalAmount)))
            
            if !chartData.isEmpty {
                // Pie Chart
                Chart(chartData) { dataPoint in
                    SectorMark(
                        angle: .value("金額", dataPoint.value as NSDecimalNumber),
                        innerRadius: .ratio(0.4),
                        angularInset: 1.5
                    )
                    .foregroundStyle(ColorManager.categoryColor(from: dataPoint.color ?? ColorManager.chartColorHex(for: 0)))
                    .opacity(0.8)
                }
                .frame(height: 250)
                .padding(.horizontal)
                .accessibilityLabel("accessibility.categoryChart".localized)
                .accessibilityValue(buildChartAccessibilityValue())
                
                // Legend
                LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
                    ForEach(chartData) { dataPoint in
                        HStack {
                            Circle()
                                .fill(ColorManager.categoryColor(from: dataPoint.color ?? ColorManager.chartColorHex(for: 0)))
                                .frame(width: 12, height: 12)
                            
                            VStack(alignment: .leading, spacing: 2) {
                                Text(dataPoint.name)
                                    .font(.caption)
                                    .lineLimit(1)
                                
                                Text(formatAmount(dataPoint.value))
                                    .font(.caption2)
                                    .fontWeight(.medium)
                                    .foregroundColor(ColorManager.secondaryText)
                            }
                            
                            Spacer()
                        }
                        .contentShape(Rectangle())
                        .onTapGesture {
                            if selectedCategory == nil {
                                onCategoryTap(dataPoint.name)
                            }
                        }
                        .accessibilityElement(children: .combine)
                        .accessibilityLabel("\(dataPoint.name), \(formatAmount(dataPoint.value))")
                        .accessibilityHint(selectedCategory == nil ? "accessibility.hint.chartDrillDown".localized : "")
                    }
                }
                .padding(.horizontal)
            } else {
                // Empty State
                VStack(spacing: 12) {
                    Image(systemName: "chart.pie")
                        .font(.system(size: 60))
                        .foregroundColor(ColorManager.secondaryText)
                        .accessibilityHidden(true)
                    
                    Text("データがありません")
                        .font(.headline)
                        .foregroundColor(ColorManager.secondaryText)
                    
                    Text("選択した期間に取引がありません")
                        .font(.caption)
                        .foregroundColor(ColorManager.secondaryText)
                }
                .frame(height: 250)
            }
        }
    }
    
    private var chartTitle: String {
        if let category = selectedCategory {
            return "\(category.name)のサブカテゴリ別内訳"
        } else {
            return "\(dateFormatter.string(from: selectedMonth))のカテゴリ別内訳"
        }
    }
    
    private func formatAmount(_ amount: Decimal) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = Locale(identifier: "ja_JP")
        return formatter.string(from: amount as NSDecimalNumber) ?? "¥0"
    }
    
    private func buildChartAccessibilityValue() -> String {
        let categoryValues = chartData.map { dataPoint in
            "\(dataPoint.name): \(formatAmount(dataPoint.value))"
        }
        return categoryValues.joined(separator: ", ")
    }
}

#Preview {
    let sampleData = [
        ChartDataPoint(name: "食費", value: 30000, color: "#FF6B6B"),
        ChartDataPoint(name: "交通費", value: 15000, color: "#4ECDC4"),
        ChartDataPoint(name: "光熱費", value: 12000, color: "#45B7D1"),
        ChartDataPoint(name: "娯楽費", value: 8000, color: "#96CEB4"),
        ChartDataPoint(name: "医療費", value: 5000, color: "#FFEAA7")
    ]
    
    CategoryChartView(
        chartData: sampleData,
        selectedMonth: Date(),
        selectedCategory: nil,
        totalAmount: 70000,
        onCategoryTap: { _ in }
    )
}