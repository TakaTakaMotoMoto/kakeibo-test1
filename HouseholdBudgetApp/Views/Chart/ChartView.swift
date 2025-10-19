import SwiftUI
import Charts

struct ChartView: View {
    @Environment(\.modelContext) private var modelContext
    @State private var chartViewModel: ChartViewModel?
    
    var body: some View {
        NavigationView {
            Group {
                if let viewModel = chartViewModel {
                    VStack(spacing: 20) {
                        // Period Selection
                        periodSelectionView(viewModel)
                        
                        // Chart Content
                        chartContentView(viewModel)
                        
                        Spacer()
                    }
                    .padding()
                } else {
                    ProgressView("loading".localized)
                }
            }
            .navigationTitle("nav.expenseChart".localized)
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
        .accessibilityHint("accessibility.hint.periodSelector".localized)
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
        VStack {
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
                .accessibilityLabel("accessibility.yearSelector".localized)
                
                Spacer()
            }
            .padding(.horizontal)
            
            // Use the dedicated MonthlyChartView
            MonthlyChartView(
                monthlyData: viewModel.monthlyData,
                selectedYear: viewModel.selectedYear,
                totalAmount: viewModel.totalAmount
            )
        }
    }
    
    private func monthlyChartView(_ viewModel: ChartViewModel) -> some View {
        VStack {
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
                .accessibilityLabel("accessibility.monthSelector".localized)
                
                Spacer()
            }
            .padding(.horizontal)
            
            // Category Selection (for drill-down)
            if viewModel.selectedCategory != nil {
                HStack {
                    Button("chart.backToCategories".localized) {
                        viewModel.selectCategory(nil)
                    }
                    .foregroundColor(ColorManager.primaryAccent)
                    .font(.body)
                    .accessibilityLabel("chart.backToCategories".localized)
                    
                    Spacer()
                }
                .padding(.horizontal)
            }
            
            // Use the dedicated CategoryChartView
            CategoryChartView(
                chartData: viewModel.chartData,
                selectedMonth: viewModel.selectedMonth,
                selectedCategory: viewModel.selectedCategory,
                totalAmount: viewModel.totalAmount,
                onCategoryTap: { categoryName in
                    selectCategoryForDrillDown(named: categoryName, viewModel: viewModel)
                }
            )
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
    ChartView()
}