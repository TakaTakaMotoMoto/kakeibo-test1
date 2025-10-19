import SwiftData
import Foundation

@MainActor
class PreviewContainer {
    static let shared = PreviewContainer()
    
    let container: ModelContainer
    let mainContext: ModelContext
    
    private init() {
        do {
            let schema = Schema([
                Transaction.self,
                Category.self,
                Subcategory.self,
                FundSource.self,
                UserAccount.self
            ])
            
            let configuration = ModelConfiguration(
                schema: schema,
                isStoredInMemoryOnly: true
            )
            
            container = try ModelContainer(
                for: schema,
                configurations: [configuration]
            )
            
            mainContext = container.mainContext
            
            // Add sample data for previews
            addSampleData()
        } catch {
            fatalError("Failed to create preview container: \(error)")
        }
    }
    
    private func addSampleData() {
        // Add sample user account
        let sampleAccount = UserAccount(username: "Sample User", email: "user@example.com")
        mainContext.insert(sampleAccount)
        
        // Add sample fund sources
        let householdFund = FundSource(name: "家計", initialBalance: 100000, isShared: true)
        let personalFund = FundSource(name: "お小遣い", initialBalance: 50000, isShared: false)
        
        mainContext.insert(householdFund)
        mainContext.insert(personalFund)
        
        // Link shared fund source to account
        sampleAccount.sharedFundSources.append(householdFund)
        
        // Add sample categories
        let foodCategory = Category(name: "食費", iconName: "fork.knife", colorHex: "#FF6B6B", isCustom: false)
        let transportCategory = Category(name: "交通費", iconName: "car", colorHex: "#4ECDC4", isCustom: false)
        
        mainContext.insert(foodCategory)
        mainContext.insert(transportCategory)
        
        // Add sample subcategories
        let groceriesSubcategory = Subcategory(name: "食品", category: foodCategory)
        let beveragesSubcategory = Subcategory(name: "飲料", category: foodCategory)
        
        mainContext.insert(groceriesSubcategory)
        mainContext.insert(beveragesSubcategory)
        
        // Add sample transactions
        let transaction1 = Transaction(
            amount: 2500,
            date: Date(),
            note: "スーパーでの買い物",
            category: foodCategory,
            subcategory: groceriesSubcategory,
            fundSource: householdFund
        )
        
        let transaction2 = Transaction(
            amount: 300,
            date: Calendar.current.date(byAdding: .day, value: -1, to: Date()) ?? Date(),
            note: "コーヒー",
            category: foodCategory,
            subcategory: beveragesSubcategory,
            fundSource: personalFund
        )
        
        mainContext.insert(transaction1)
        mainContext.insert(transaction2)
        
        // Update fund source balances
        householdFund.currentBalance -= transaction1.amount
        personalFund.currentBalance -= transaction2.amount
        
        try? mainContext.save()
    }
}