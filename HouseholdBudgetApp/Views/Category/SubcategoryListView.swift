import SwiftUI

struct SubcategoryListView: View {
    @Environment(\.dismiss) private var dismiss
    let category: Category
    let viewModel: CategoryViewModel
    
    @State private var showingAddSubcategory = false
    @State private var editingSubcategory: Subcategory?
    @State private var subcategories: [Subcategory] = []
    
    var body: some View {
        NavigationView {
            List {
                Section {
                    ForEach(subcategories, id: \.id) { subcategory in
                        SubcategoryRowView(subcategory: subcategory)
                            .contentShape(Rectangle())
                            .onTapGesture {
                                editingSubcategory = subcategory
                            }
                            .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                Button("action.edit".localized) {
                                    editingSubcategory = subcategory
                                }
                                .tint(.blue)
                                .accessibilityLabel("accessibility.editSubcategory".localized)
                                
                                Button("action.delete".localized, role: .destructive) {
                                    viewModel.confirmDeleteSubcategory(subcategory)
                                }
                                .disabled(!viewModel.canDeleteSubcategory(subcategory))
                                .accessibilityLabel("accessibility.deleteSubcategory".localized)
                            }
                    }
                    
                    if subcategories.isEmpty {
                        ContentUnavailableView(
                            "subcategory.noSubcategories".localized,
                            systemImage: "folder.badge.plus",
                            description: Text("subcategory.addSubcategoryHint".localized)
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
            .navigationTitle("nav.subcategories".localized)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("action.cancel".localized) {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("action.add".localized) {
                        showingAddSubcategory = true
                    }
                    .accessibilityLabel("accessibility.addSubcategory".localized)
                }
            }
            .errorAlert($viewModel.currentError)
            .alert("subcategory.deleteConfirmation".localized, isPresented: $viewModel.showingDeleteConfirmation) {
                Button("subcategory.deleteButton".localized, role: .destructive) {
                    viewModel.executeDeleteSubcategory()
                    updateSubcategories()
                }
                Button("subcategory.cancelDelete".localized, role: .cancel) {
                    viewModel.cancelDeleteSubcategory()
                }
            } message: {
                if let subcategory = viewModel.subcategoryToDelete {
                    Text(viewModel.canDeleteSubcategory(subcategory) ? "subcategory.deleteMessage".localized : "subcategory.deleteInUseMessage".localized)
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
        .sheet(item: $editingSubcategory) { subcategory in
            SubcategoryFormView(category: category, subcategory: subcategory, viewModel: viewModel) {
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
    
    private var canDelete: Bool {
        subcategory.transactions.isEmpty
    }
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(subcategory.name)
                    .font(.headline)
                
                HStack {
                    Text("subcategory.usageCount".localized(with: subcategory.transactions.count))
                        .font(.caption)
                        .foregroundColor(ColorManager.secondaryText)
                    
                    Spacer()
                    
                    if !canDelete {
                        Text("subcategory.cannotDelete".localized)
                            .font(.caption2)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.red.opacity(0.1))
                            .foregroundColor(.red)
                            .cornerRadius(4)
                    }
                }
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(ColorManager.secondaryText)
        }
        .padding(.vertical, 4)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(subcategory.name), \("subcategory.usageCount".localized(with: subcategory.transactions.count))")
        .accessibilityHint("accessibility.hint.editSubcategory".localized)
    }
}

#Preview {
    let category = Category(name: "食費", iconName: "fork.knife", colorHex: "#FF6B6B", isCustom: false)
    let viewModel = CategoryViewModel(modelContext: ModelContext(try! ModelContainer(for: Category.self)))
    
    SubcategoryListView(category: category, viewModel: viewModel)
}