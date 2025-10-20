import SwiftUI

struct SubcategoryManagementView: View {
    @Environment(\.dismiss) private var dismiss
    let viewModel: CategoryViewModel
    
    @State private var selectedCategory: Category?
    @State private var showingAddSubcategory = false
    @State private var editingSubcategory: Subcategory?
    
    var body: some View {
        NavigationView {
            List {
                ForEach(viewModel.categories, id: \.id) { category in
                    CategorySectionView(
                        category: category,
                        viewModel: viewModel,
                        onAddSubcategory: {
                            selectedCategory = category
                            showingAddSubcategory = true
                        },
                        onEditSubcategory: { subcategory in
                            selectedCategory = category
                            editingSubcategory = subcategory
                        }
                    )
                }
            }
            .navigationTitle("nav.subcategoryManagement".localized)
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("action.done".localized) {
                        dismiss()
                    }
                }
            }
            .errorAlert($viewModel.currentError)
            .alert("subcategory.deleteConfirmation".localized, isPresented: $viewModel.showingDeleteConfirmation) {
                Button("subcategory.deleteButton".localized, role: .destructive) {
                    viewModel.executeDeleteSubcategory()
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
        .sheet(isPresented: $showingAddSubcategory) {
            if let category = selectedCategory {
                SubcategoryFormView(category: category, viewModel: viewModel) {
                    // Refresh is handled automatically by the ViewModel
                }
            }
        }
        .sheet(item: $editingSubcategory) { subcategory in
            if let category = selectedCategory {
                SubcategoryFormView(category: category, subcategory: subcategory, viewModel: viewModel) {
                    // Refresh is handled automatically by the ViewModel
                }
            }
        }
    }
}

struct CategorySectionView: View {
    let category: Category
    let viewModel: CategoryViewModel
    let onAddSubcategory: () -> Void
    let onEditSubcategory: (Subcategory) -> Void
    
    private var subcategories: [Subcategory] {
        viewModel.getSubcategories(for: category)
    }
    
    var body: some View {
        Section {
            if subcategories.isEmpty {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("subcategory.noSubcategories".localized)
                            .font(.subheadline)
                            .foregroundColor(ColorManager.secondaryText)
                        
                        Text("subcategory.addSubcategoryHint".localized)
                            .font(.caption)
                            .foregroundColor(ColorManager.secondaryText)
                    }
                    
                    Spacer()
                    
                    Button("action.add".localized) {
                        onAddSubcategory()
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                }
                .padding(.vertical, 8)
            } else {
                ForEach(subcategories, id: \.id) { subcategory in
                    SubcategoryManagementRowView(
                        subcategory: subcategory,
                        viewModel: viewModel,
                        onEdit: {
                            onEditSubcategory(subcategory)
                        }
                    )
                }
                
                // Add subcategory button
                Button {
                    onAddSubcategory()
                } label: {
                    HStack {
                        Image(systemName: "plus.circle.fill")
                            .foregroundColor(.blue)
                        
                        Text("action.add".localized)
                            .foregroundColor(.blue)
                        
                        Spacer()
                    }
                }
                .padding(.vertical, 4)
            }
        } header: {
            HStack {
                if let iconName = category.iconName {
                    Image(systemName: iconName)
                        .foregroundColor(Color(hex: category.colorHex))
                }
                
                Text(category.name)
                
                Spacer()
                
                Text("\(subcategories.count)")
                    .font(.caption)
                    .foregroundColor(ColorManager.secondaryText)
            }
        }
    }
}

struct SubcategoryManagementRowView: View {
    let subcategory: Subcategory
    let viewModel: CategoryViewModel
    let onEdit: () -> Void
    
    private var canDelete: Bool {
        viewModel.canDeleteSubcategory(subcategory)
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
                    } else {
                        Text("subcategory.canDelete".localized)
                            .font(.caption2)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.green.opacity(0.1))
                            .foregroundColor(.green)
                            .cornerRadius(4)
                    }
                }
            }
            
            Spacer()
        }
        .contentShape(Rectangle())
        .onTapGesture {
            onEdit()
        }
        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
            Button("action.edit".localized) {
                onEdit()
            }
            .tint(.blue)
            .accessibilityLabel("accessibility.editSubcategory".localized)
            
            Button("action.delete".localized, role: .destructive) {
                viewModel.confirmDeleteSubcategory(subcategory)
            }
            .disabled(!canDelete)
            .accessibilityLabel("accessibility.deleteSubcategory".localized)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(subcategory.name), \("subcategory.usageCount".localized(with: subcategory.transactions.count))")
        .accessibilityHint("accessibility.hint.editSubcategory".localized)
    }
}

#Preview {
    let viewModel = CategoryViewModel(modelContext: ModelContext(try! ModelContainer(for: Category.self)))
    
    SubcategoryManagementView(viewModel: viewModel)
}