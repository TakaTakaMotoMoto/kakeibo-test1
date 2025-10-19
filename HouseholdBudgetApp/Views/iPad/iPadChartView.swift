import SwiftUI
import Charts

struct iPadChartView: View {
    @Environment(\.modelContext) private var modelContext
    @EnvironmentObject private var orientationManager: OrientationManager
    @State private var chartViewModel: ChartViewModel?
    
    var body: some View {
        NavigationView {
            Group {
                if let viewModel = chartViewModel {
                    if orientationManager.isLandscape {
                        // Landscape: Side-by-side layout
                        HStack(spacing: 0) {
                            // Left side: Chart
                            VStack(spacing: 20) {
                                // Period Selection
                                periodSelectionView(viewModel)
                                
                                // Chart Content
                                chartContentView(viewModel)
                                
                                Spacer()
                            }
                            .padding()
                            .frame(maxWidth: .infinity)
                            
                            Divider()
                            
                            // Right side: Summary and Details
                            VStack(alignment: .leading, spacing: 20) {
                                summaryView(viewModel)
                                
                                if !viewModel.chartData.isEmpty {
                                    detailsView(viewModel)
                                }
                                
                                Spacer()
                            }
                            .padding()
                            .frame(width: 320)
                            .background(Color(.systemGray6).opacity(0.3))
                        }
                    } else {
                        // Portrait: Stacked layout
                        VStack(spacing: 20) {
                            // Period Selection
                            periodSelectionView(viewModel)
                            
                            // Summary
                            summaryView(viewModel)
                            
                            // Chart Content
                            chartContentView(viewModel)
                            
                            // Details
                            if !viewModel.chartData.isEmpty {
                                detailsView(viewModel)
                            }
                            
                            Spacer()
                        }
                        .padding()
                    }
                } else {
                    ProgressView("loading".localized)
                }
            }
            .navigationTitle("nav.expenseChart".localized)
            .navigationBarTitleDisplayMode(.large)
            .onAppear {
                if chartViewModel == nil {
                    chartViewModel = ChartViewModel(modelContext: modelContext)
                }
            }
            .errorAlert(Binding(
                get: { chartViewModel?.currentError },
                set: { _ in chartViewModel?.clearError() }
            ))
        }
    }
    
    // MARK: - View Components
    
    private func periodSelectionView(_ viewModel: ChartViewModel) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("chart.displayPeriod".localized)
                .font(.headline)
            
            Picker("chart.displayPeriod".localized, selection: Binding(
                get: { viewModel.selectedPeriod },
                set: { viewModel.selectPeriod($0) }
            )) {
                ForEach(ChartPeriod.allCases, id: \.self) { period in
                    Text(period.localizedString)
                        .font(.body)
                        .tag(period)
                }
            }
            .pickerStyle(SegmentedPickerStyle())
            .accessibilityLabel("accessibility.chartPeriodSelector".localized)
        }
    }
    
    private func chartContentView(_ viewModel: ChartViewModel) -> some View {
        Group {
            switch viewModel.selectedPeriod {
            case .yearly:
                yearlyChartView(viewModel)
            case .monthly:
                monthlyChartView(viewModel)
            }
        }
    }
    
    private func yearlyChartView(_ viewModel: ChartViewModel) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            // Year Selection
            HStack {
                Text("chart.year".localized)
                    .font(.headline)
                
                Picker("chart.year".localized, selection: Binding(
                    get: { viewModel.selectedYear },
                    set: { viewModel.selectYear($0) }
                )) {
                    ForEach(viewModel.getAvailableYears(), id: \.self) { year in
                        Text("chart.yearSuffix".localized(with: year))
                            .font(.body)
                            .tag(year)
                    }
                }
                .pickerStyle(MenuPickerStyle())
                
                Spacer()
            }
            
            // Chart
            MonthlyChartView(
                monthlyData: viewModel.monthlyData,
                selectedYear: viewModel.selectedYear,
                totalAmount: viewModel.totalAmount
            )
            .frame(height: 400)
        }
    }
    
    private func monthlyChartView(_ viewModel: ChartViewModel) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            // Month Selection
            HStack {
                Text("chart.month".localized)
                    .font(.headline)
                
                DatePicker(
                    "chart.selectMonth".localized,
                    selection: Binding(
                        get: { viewModel.selectedMonth },
                        set: { viewModel.selectMonth($0) }
                    ),
                    displayedComponents: [.date]
                )
                .datePickerStyle(CompactDatePickerStyle())
                
                Spacer()
            }
            
            // Category Selection (for drill-down)
            if viewModel.selectedCategory != nil {
                HStack {
                    Button("chart.backToCategories".localized) {
                        viewModel.selectCategory(nil)
                    }
                    .foregroundColor(ColorManager.primaryAccent)
                    .font(.body)
                    
                    Spacer()
                }
            }
            
            // Chart
            CategoryChartView(
                chartData: viewModel.chartData,
                selectedMonth: viewModel.selectedMonth,
                selectedCategory: viewModel.selectedCategory,
                totalAmount: viewModel.totalAmount,
                onCategoryTap: { categoryName in
                    selectCategoryForDrillDown(named: categoryName, viewModel: viewModel)
                }
            )
            .frame(height: 400)
        }
    }
    
    private func summaryView(_ viewModel: ChartViewModel) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("chart.summary".localized)
                .font(.title2)
                .fontWeight(.bold)
            
            VStack(alignment: .leading, spacing: 8) {
                Text("chart.totalExpense".localized)
                    .font(.subheadline)
                    .foregroundColor(ColorManager.secondaryText)
                
                Text(CurrencyFormatter.shared.string(from: viewModel.totalAmount))
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(ColorManager.primaryAccent)
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(radius: 2)
            
            if viewModel.selectedPeriod == .monthly {
                VStack(alignment: .leading, spacing: 8) {
                    Text("chart.period".localized)
                        .font(.subheadline)
                        .foregroundColor(ColorManager.secondaryText)
                    
                    Text(DateFormatter.monthYear(from: viewModel.selectedMonth))
                        .font(.body)
                        .fontWeight(.medium)
                }
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    Text("chart.period".localized)
                        .font(.subheadline)
                        .foregroundColor(ColorManager.secondaryText)
                    
                    Text("chart.yearSuffix".localized(with: viewModel.selectedYear))
                        .font(.body)
                        .fontWeight(.medium)
                }
            }
        }
    }
    
    private func detailsView(_ viewModel: ChartViewModel) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("chart.breakdown".localized)
                .font(.title3)
                .fontWeight(.semibold)
            
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 8) {
                    ForEach(viewModel.chartData.prefix(10), id: \.name) { dataPoint in
                        HStack {
                            Circle()
                                .fill(dataPoint.color)
                                .frame(width: 12, height: 12)
                            
                            VStack(alignment: .leading, spacing: 2) {
                                Text(dataPoint.name)
                                    .font(.caption)
                                    .fontWeight(.medium)
                                    .lineLimit(1)
                                
                                Text(CurrencyFormatter.shared.string(from: dataPoint.value))
                                    .font(.caption2)
                                    .foregroundColor(ColorManager.secondaryText)
                            }
                            
                            Spacer()
                            
                            Text(String(format: "%.1f%%", (dataPoint.value / viewModel.totalAmount) * 100))
                                .font(.caption2)
                                .foregroundColor(ColorManager.secondaryText)
                        }
                        .padding(.vertical, 2)
                    }
                }
            }
            .frame(maxHeight: 300)
        }
    }
    
    // MARK: - Helper Methods
    
    private func selectCategoryForDrillDown(named categoryName: String, viewModel: ChartViewModel) {
        Task {
            do {
                let descriptor = FetchDescriptor<Category>(
                    predicate: #Predicate<Category> { category in
                        category.name == categoryName
                    }
                )
                let categories = try modelContext.fetch(descriptor)
                if let category = categories.first {
                    await MainActor.run {
                        viewModel.selectCategory(category)
                    }
                }
            } catch {
                print("Failed to fetch category: \(error)")
            }
        }
    }
}

#Preview {
    iPadChartView()
        .modelContainer(for: [Transaction.self, Category.self, FundSource.self])
}