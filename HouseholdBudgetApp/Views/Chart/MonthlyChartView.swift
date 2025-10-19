import SwiftUI
import Charts

struct MonthlyChartView: View {
    let monthlyData: [MonthlyDataPoint]
    let selectedYear: Int
    let totalAmount: Decimal
    
    var body: some View {
        VStack(spacing: 16) {
            // Title
            Text("\(selectedYear)年の月別支出")
                .font(.headline)
                .padding(.horizontal)
                .accessibilityAddTraits(.isHeader)
            
            // Total Amount
            Text(formatAmount(totalAmount))
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(ColorManager.primaryText)
                .accessibilityLabel("accessibility.value.totalExpense".localized(with: formatAmount(totalAmount)))
            
            // Bar Chart
            Chart(monthlyData) { dataPoint in
                BarMark(
                    x: .value("月", dataPoint.monthName),
                    y: .value("金額", dataPoint.totalAmount as NSDecimalNumber)
                )
                .foregroundStyle(ColorManager.primaryAccent.gradient)
                .cornerRadius(4)
            }
            .frame(height: 250)
            .chartYAxis {
                AxisMarks(position: .leading) { value in
                    AxisGridLine()
                    AxisTick()
                    AxisValueLabel {
                        if let amount = value.as(NSDecimalNumber.self) {
                            Text(formatAxisAmount(Decimal(amount.doubleValue)))
                                .font(.caption)
                        }
                    }
                }
            }
            .chartXAxis {
                AxisMarks { value in
                    AxisGridLine()
                    AxisTick()
                    AxisValueLabel {
                        if let month = value.as(String.self) {
                            Text(month)
                                .font(.caption)
                        }
                    }
                }
            }
            .padding(.horizontal)
            .accessibilityLabel("accessibility.monthlyChart".localized)
            .accessibilityValue(buildChartAccessibilityValue())
        }
    }
    
    private func formatAmount(_ amount: Decimal) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = Locale(identifier: "ja_JP")
        return formatter.string(from: amount as NSDecimalNumber) ?? "¥0"
    }
    
    private func formatAxisAmount(_ amount: Decimal) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = Locale(identifier: "ja_JP")
        formatter.maximumFractionDigits = 0
        
        let value = amount as NSDecimalNumber
        if value.doubleValue >= 10000 {
            formatter.positiveSuffix = "万"
            return formatter.string(from: NSDecimalNumber(value: value.doubleValue / 10000)) ?? "¥0"
        } else {
            return formatter.string(from: value) ?? "¥0"
        }
    }
    
    private func buildChartAccessibilityValue() -> String {
        let monthlyValues = monthlyData.map { dataPoint in
            "\(dataPoint.monthName): \(formatAmount(dataPoint.totalAmount))"
        }
        return monthlyValues.joined(separator: ", ")
    }
}

#Preview {
    let sampleData = [
        MonthlyDataPoint(month: 1, monthName: "1月", totalAmount: 50000),
        MonthlyDataPoint(month: 2, monthName: "2月", totalAmount: 45000),
        MonthlyDataPoint(month: 3, monthName: "3月", totalAmount: 60000),
        MonthlyDataPoint(month: 4, monthName: "4月", totalAmount: 55000),
        MonthlyDataPoint(month: 5, monthName: "5月", totalAmount: 48000),
        MonthlyDataPoint(month: 6, monthName: "6月", totalAmount: 52000)
    ]
    
    MonthlyChartView(
        monthlyData: sampleData,
        selectedYear: 2024,
        totalAmount: 310000
    )
}