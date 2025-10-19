import SwiftUI

struct iPadMainView: View {
    @EnvironmentObject private var orientationManager: OrientationManager
    @State private var selectedTab: MainTab = .transactions
    @State private var columnVisibility: NavigationSplitViewVisibility = .all
    
    var body: some View {
        NavigationSplitView(columnVisibility: $columnVisibility) {
            // Sidebar
            SidebarView(selectedTab: $selectedTab)
                .navigationSplitViewColumnWidth(
                    min: orientationManager.isLandscape ? 180 : 200,
                    ideal: orientationManager.isLandscape ? 220 : 250,
                    max: orientationManager.isLandscape ? 280 : 300
                )
        } detail: {
            // Detail view
            DetailView(selectedTab: selectedTab)
        }
        .navigationSplitViewStyle(.balanced)
        .onChange(of: orientationManager.isLandscape) { _, isLandscape in
            // Adjust column visibility based on orientation
            if isLandscape {
                columnVisibility = .all
            } else {
                // In portrait, we might want to hide sidebar on smaller screens
                columnVisibility = .automatic
            }
        }
    }
}

// MARK: - Sidebar View
struct SidebarView: View {
    @Binding var selectedTab: MainTab
    
    var body: some View {
        List(MainTab.allCases, id: \.self, selection: $selectedTab) { tab in
            NavigationLink(value: tab) {
                HStack {
                    Image(systemName: tab.iconName)
                        .foregroundColor(tab.color)
                        .frame(width: 24)
                    
                    Text(tab.title)
                        .font(.body)
                }
                .padding(.vertical, 4)
            }
            .accessibilityLabel(tab.accessibilityLabel)
        }
        .navigationTitle("HouseholdBudget")
        .navigationBarTitleDisplayMode(.large)
        .listStyle(SidebarListStyle())
    }
}

// MARK: - Detail View
struct DetailView: View {
    let selectedTab: MainTab
    
    var body: some View {
        Group {
            switch selectedTab {
            case .transactions:
                iPadTransactionView()
            case .charts:
                iPadChartView()
            case .fundSources:
                iPadFundSourceView()
            case .settings:
                iPadSettingsView()
            }
        }
    }
}

// MARK: - Main Tab Enum
enum MainTab: String, CaseIterable {
    case transactions = "transactions"
    case charts = "charts"
    case fundSources = "fundSources"
    case settings = "settings"
    
    var title: String {
        switch self {
        case .transactions:
            return "tab.transactions".localized
        case .charts:
            return "tab.charts".localized
        case .fundSources:
            return "tab.fundSources".localized
        case .settings:
            return "tab.settings".localized
        }
    }
    
    var iconName: String {
        switch self {
        case .transactions:
            return "list.bullet.rectangle"
        case .charts:
            return "chart.pie"
        case .fundSources:
            return "creditcard"
        case .settings:
            return "gearshape"
        }
    }
    
    var color: Color {
        switch self {
        case .transactions:
            return .blue
        case .charts:
            return .green
        case .fundSources:
            return .orange
        case .settings:
            return .gray
        }
    }
    
    var accessibilityLabel: String {
        switch self {
        case .transactions:
            return "accessibility.tabTransactions".localized
        case .charts:
            return "accessibility.tabCharts".localized
        case .fundSources:
            return "accessibility.tabFundSources".localized
        case .settings:
            return "accessibility.tabSettings".localized
        }
    }
}

#Preview {
    iPadMainView()
        .modelContainer(for: [Transaction.self, Category.self, FundSource.self, UserAccount.self])
}