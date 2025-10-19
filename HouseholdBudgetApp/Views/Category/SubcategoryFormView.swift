import SwiftUI

struct SubcategoryFormView: View {
    @Environment(\.dismiss) private var dismiss
    let category: Category
    let viewModel: CategoryViewModel
    let onSave: () -> Void
    
    @State private var name: String = ""
    
    var body: some View {
        NavigationView {
            Form {
                Section("基本情報") {
                    HStack {
                        if let iconName = category.iconName {
                            Image(systemName: iconName)
                                .foregroundColor(Color(hex: category.colorHex))
                                .frame(width: 24, height: 24)
                        }
                        
                        VStack(alignment: .leading) {
                            Text("親カテゴリ")
                                .font(.caption)
                                .foregroundColor(ColorManager.secondaryText)
                            Text(category.name)
                                .font(.headline)
                        }
                    }
                    .padding(.vertical, 4)
                    
                    TextField("サブカテゴリ名", text: $name)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                }
                
                if !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    Section("プレビュー") {
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
            .navigationTitle("新しいサブカテゴリ")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("キャンセル") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("保存") {
                        saveSubcategory()
                    }
                    .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }
    
    private func saveSubcategory() {
        let trimmedName = name.trimmingCharacters(in: .whitespacesAndNewlines)
        viewModel.createSubcategory(name: trimmedName, for: category)
        onSave()
        dismiss()
    }
}

#Preview {
    let category = Category(name: "食費", iconName: "fork.knife", colorHex: "#FF6B6B", isCustom: false)
    let viewModel = CategoryViewModel(modelContext: ModelContext(try! ModelContainer(for: Category.self)))
    
    SubcategoryFormView(category: category, viewModel: viewModel) {}
}