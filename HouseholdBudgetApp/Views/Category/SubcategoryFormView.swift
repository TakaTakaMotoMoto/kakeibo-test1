import SwiftUI

struct SubcategoryFormView: View {
    @Environment(\.dismiss) private var dismiss
    let category: Category
    let viewModel: CategoryViewModel
    let onSave: () -> Void
    
    // Optional subcategory for editing
    let subcategory: Subcategory?
    
    @State private var name: String = ""
    @State private var showingValidationError = false
    @State private var validationErrorMessage = ""
    
    // Computed properties
    private var isEditing: Bool {
        subcategory != nil
    }
    
    private var navigationTitle: String {
        isEditing ? "nav.editSubcategory".localized : "nav.newSubcategory".localized
    }
    
    private var saveButtonTitle: String {
        isEditing ? "action.update".localized : "action.save".localized
    }
    
    // Initializers
    init(category: Category, viewModel: CategoryViewModel, onSave: @escaping () -> Void) {
        self.category = category
        self.viewModel = viewModel
        self.onSave = onSave
        self.subcategory = nil
    }
    
    init(category: Category, subcategory: Subcategory, viewModel: CategoryViewModel, onSave: @escaping () -> Void) {
        self.category = category
        self.subcategory = subcategory
        self.viewModel = viewModel
        self.onSave = onSave
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section("subcategory.basicInfo".localized) {
                    HStack {
                        if let iconName = category.iconName {
                            Image(systemName: iconName)
                                .foregroundColor(Color(hex: category.colorHex))
                                .frame(width: 24, height: 24)
                        }
                        
                        VStack(alignment: .leading) {
                            Text("subcategory.parentCategory".localized)
                                .font(.caption)
                                .foregroundColor(ColorManager.secondaryText)
                            Text(category.name)
                                .font(.headline)
                        }
                    }
                    .padding(.vertical, 4)
                    
                    TextField("subcategory.name".localized, text: $name)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .accessibilityLabel("subcategory.name".localized)
                    
                    if showingValidationError {
                        Text(validationErrorMessage)
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                }
                
                if !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    Section("subcategory.preview".localized) {
                        HStack {
                            if let iconName = category.iconName {
                                Image(systemName: iconName)
                                    .foregroundColor(Color(hex: category.colorHex))
                                    .frame(width: 20, height: 20)
                            }
                            
                            Text(category.name)
                                .font(.subheadline)
                                .foregroundColor(ColorManager.secondaryText)
                            
                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundColor(ColorManager.secondaryText)
                            
                            Text(name)
                                .font(.headline)
                            
                            Spacer()
                        }
                        .padding(.vertical, 4)
                    }
                }
            }
            .navigationTitle(navigationTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("action.cancel".localized) {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(saveButtonTitle) {
                        saveSubcategory()
                    }
                    .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
            .onAppear {
                if let subcategory = subcategory {
                    name = subcategory.name
                }
            }
            .errorAlert($viewModel.currentError)
        }
    }
    
    private func saveSubcategory() {
        let trimmedName = name.trimmingCharacters(in: .whitespacesAndNewlines)
        
        // Clear previous validation errors
        showingValidationError = false
        validationErrorMessage = ""
        
        // Validate name is not empty
        guard !trimmedName.isEmpty else {
            validationErrorMessage = "error.invalidInput".localized(with: "subcategory.name".localized)
            showingValidationError = true
            return
        }
        
        // Check for duplicate names
        if viewModel.validateSubcategoryName(trimmedName, in: category, excluding: subcategory) {
            validationErrorMessage = "error.duplicateSubcategoryName".localized
            showingValidationError = true
            return
        }
        
        if let subcategory = subcategory {
            // Update existing subcategory
            viewModel.updateSubcategory(subcategory, name: trimmedName)
        } else {
            // Create new subcategory
            viewModel.createSubcategory(name: trimmedName, for: category)
        }
        
        // Check if there was an error during save
        if viewModel.currentError == nil {
            onSave()
            dismiss()
        }
    }
}

#Preview {
    let category = Category(name: "食費", iconName: "fork.knife", colorHex: "#FF6B6B", isCustom: false)
    let viewModel = CategoryViewModel(modelContext: ModelContext(try! ModelContainer(for: Category.self)))
    
    SubcategoryFormView(category: category, viewModel: viewModel) {}
}