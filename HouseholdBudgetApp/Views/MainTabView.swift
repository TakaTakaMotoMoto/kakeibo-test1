import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            // 取引タブ
            TransactionListView()
                .tabItem {
                    Image(systemName: "list.bullet.rectangle")
                    Text("tab.transactions".localized)
                }
                .tag(0)
                .accessibilityLabel("accessibility.tabTransactions".localized)
            
            // グラフタブ
            ChartView()
                .tabItem {
                    Image(systemName: "chart.pie")
                    Text("tab.charts".localized)
                }
                .tag(1)
                .accessibilityLabel("accessibility.tabCharts".localized)
            
            // 資金元タブ
            FundSourceListView()
                .tabItem {
                    Image(systemName: "creditcard")
                    Text("tab.fundSources".localized)
                }
                .tag(2)
                .accessibilityLabel("accessibility.tabFundSources".localized)
            
            // 設定タブ
            SettingsView()
                .tabItem {
                    Image(systemName: "gearshape")
                    Text("tab.settings".localized)
                }
                .tag(3)
                .accessibilityLabel("accessibility.tabSettings".localized)
        }
        .adaptiveLayout(
            compact: {
                // iPhone: Standard tab view
                AnyView(EmptyView())
            },
            regular: {
                // iPad in landscape: Could use sidebar style
                AnyView(EmptyView())
            }
        )
    }
}

#Preview {
    MainTabView()
        .modelContainer(for: Transaction.self, inMemory: true)
}