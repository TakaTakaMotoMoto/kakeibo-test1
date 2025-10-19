import SwiftUI

struct SubcategoryListView: View {
    @Environment(\.dismiss) private var dismiss
    let category: Category
    let viewModel: CategoryViewModel
    
    @State private var showingAddSubcategory = false
    @State private var subcategories: [Subcategory] = []
    
    var body: some View {
        NavigationView {
            List {
                Section {
                    ForEach(subcategories, id: \.id) { subcategory in
                        SubcategoryRowView(subcategory: subcategory)
                            .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                Button("削除", role: .destructive) {
                                    viewModel.deleteSubcategory(subcategory)
                                    updateSubcategories()
                                }
                            }
                    }
                    
                    if subcategories.isEmpty {
                        ContentUnavailableView(
                            "サブカテゴリがありません",
                            systemImage: "folder.badge.plus",
                            description: Text("新しいサブカテゴリを追加してください")
                        )
                    }
                } header: {
                    HStack {
                        if let iconName = category.iconName {
                            Image(systemName: iconName)
                                .foregroundColor(Color(hex: category.colorHex))
                        }
                        Text(category.name)
                    }
                }
            }
            .navigationTitle("サブカテゴリ")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("閉じる") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("追加") {
                        showingAddSubcategory = true
                    }
                }
            }
        }
        .onAppear {
            updateSubcategories()
        }
        .sheet(isPresented: $showingAddSubcategory) {
            SubcategoryFormView(category: category, viewModel: viewModel) {
                updateSubcategories()
            }
        }
    }
    
    private func updateSubcategories() {
        subcategories = viewModel.getSubcategories(for: category)
    }
}

struct SubcategoryRowView: View {
    let subcategory: Subcategory
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(subcategory.name)
                    .font(.headline)
                
                Text("\(subcategory.transactions.count)件の取引")
                    .font(.caption)
                    .foregroundColor(ColorManager.secondaryText)
            }
            
            Spacer()
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    let category = Category(name: "食費", iconName: "fork.knife", colorHex: "#FF6B6B", isCustom: false)
    let viewModel = CategoryViewModel(modelContext: ModelContext(try! ModelContainer(for: Category.self)))
    
    SubcategoryListView(category: category, viewModel: viewModel)
}