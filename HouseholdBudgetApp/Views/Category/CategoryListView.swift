import SwiftUI
import SwiftData

struct CategoryListView: View {
    @Environment(\.modelContext) private var modelContext
    @State private var categoryViewModel: CategoryViewModel?
    @State private var showingAddCategory = false
    @State private var selectedCategory: Category?
    @State private var showingSubcategories = false
    
    var body: some View {
        NavigationView {
            Group {
                if let viewModel = categoryViewModel {
                    categoryContent(viewModel)
                } else {
                    ProgressView("読み込み中...")
                        .onAppear {
                            categoryViewModel = CategoryViewModel(modelContext: modelContext)
                        }
                }
            }
            .navigationTitle("nav.categoryManagement".localized)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("action.add".localized) {
                        showingAddCategory = true
                    }
                    .accessibilityLabel("accessibility.addCategory".localized)
                    .accessibilityHint("accessibility.hint.addCategory".localized)
                }
            }
        }
        .sheet(isPresented: $showingAddCategory) {
            if let viewModel = categoryViewModel {
                CategoryFormView(viewModel: viewModel)
            }
        }
        .sheet(item: $selectedCategory) { category in
            if let viewModel = categoryViewModel {
                SubcategoryListView(category: category, viewModel: viewModel)
            }
        }
    }
    
    @ViewBuilder
    private func categoryContent(_ viewModel: CategoryViewModel) -> some View {
        List {
            if !viewModel.categories.filter({ !$0.isCustom }).isEmpty {
                Section("category.predefined".localized) {
                    ForEach(viewModel.categories.filter { !$0.isCustom }, id: \.id) { category in
                        CategoryRowView(category: category) {
                            selectedCategory = category
                        }
                    }
                }
            }
            
            if !viewModel.categories.filter({ $0.isCustom }).isEmpty {
                Section("category.custom".localized) {
                    ForEach(viewModel.categories.filter { $0.isCustom }, id: \.id) { category in
                        CategoryRowView(category: category) {
                            selectedCategory = category
                        }
                        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                            Button("action.delete".localized, role: .destructive) {
                                viewModel.deleteCategory(category)
                            }
                            .accessibilityLabel("accessibility.deleteCategory".localized)
                        }
                    }
                }
            }
            
            if viewModel.categories.isEmpty {
                ContentUnavailableView(
                    "category.noCategories".localized,
                    systemImage: "folder.badge.plus",
                    description: Text("category.addCategoryHint".localized)
                )
            }
        }
        .refreshable {
            viewModel.fetchCategories()
        }
        .errorAlert($viewModel.currentError)
    }
}

struct CategoryRowView: View {
    let category: Category
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack {
                // Category icon
                if let iconName = category.iconName {
                    Image(systemName: iconName)
                        .foregroundColor(Color(hex: category.colorHex))
                        .frame(width: 24, height: 24)
                } else {
                    Circle()
                        .fill(Color(hex: category.colorHex))
                        .frame(width: 24, height: 24)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(category.name)
                        .font(.headline)
                        .foregroundColor(ColorManager.primaryText)
                    
                    Text("category.subcategoriesCount".localized(with: category.subcategories.count))
                        .font(.caption)
                        .foregroundColor(ColorManager.secondaryText)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .foregroundColor(ColorManager.secondaryText)
                    .font(.caption)
            }
            .padding(.vertical, 4)
        }
        .buttonStyle(PlainButtonStyle())
        .accessibilityLabel("\(category.name), \("accessibility.value.subcategoryCount".localized(with: category.subcategories.count))")
        .accessibilityHint("accessibility.hint.categoryDetails".localized)
    }
}

// Color extension to support hex colors
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

#Preview {
    CategoryListView()
        .modelContainer(for: [Category.self, Subcategory.self], inMemory: true)
}