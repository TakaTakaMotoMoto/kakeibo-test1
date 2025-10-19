import SwiftUI
import SwiftData

@main
struct HouseholdBudgetApp: App {
    var sharedModelContainer: ModelContainer = {
        do {
            return try DataMigrationManager.createModelContainer()
        } catch {
            fatalError("Could not create ModelContainer: \(error)")
        }
    }()

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(sharedModelContainer)
    }
}