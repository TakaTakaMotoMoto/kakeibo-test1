import SwiftUI

struct CategoryFormView: View {
    @Environment(\.dismiss) private var dismiss
    let viewModel: CategoryViewModel
    let categoryToEdit: Category?
    
    @State private var name: String = ""
    @State private var selectedIcon: String = "folder.fill"
    @State private var selectedColor: String = "#007AFF"
    @State private var showingIconPicker = false
    
    // Predefined colors
    private let availableColors = [
        "#007AFF", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
        "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE"
    ]
    
    // Predefined icons
    private let availableIcons = [
        "folder.fill", "fork.knife", "car.fill", "bolt.fill", "gamecontroller.fill",
        "cross.fill", "house.fill", "cart.fill", "creditcard.fill", "gift.fill",
        "book.fill", "music.note", "camera.fill", "phone.fill", "envelope.fill"
    ]
    
    init(viewModel: CategoryViewModel, categoryToEdit: Category? = nil) {
        self.viewModel = viewModel
        self.categoryToEdit = categoryToEdit
        
        if let category = categoryToEdit {
            _name = State(initialValue: category.name)
            _selectedIcon = State(initialValue: category.iconName ?? "folder.fill")
            _selectedColor = State(initialValue: category.colorHex)
        }
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section("category.name".localized) {
                    TextField("category.name".localized, text: $name)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .font(.body)
                        .accessibilityLabel("category.name".localized)
                        .accessibilityHint("accessibility.hint.formField".localized)
                }
                
                Section("category.icon".localized) {
                    Button(action: { showingIconPicker = true }) {
                        HStack {
                            Image(systemName: selectedIcon)
                                .foregroundColor(Color(hex: selectedColor))
                                .frame(width: 24, height: 24)
                            
                            Text("アイコンを選択")
                                .foregroundColor(ColorManager.primaryText)
                                .font(.body)
                            
                            Spacer()
                            
                            Image(systemName: "chevron.right")
                                .foregroundColor(ColorManager.secondaryText)
                                .font(.caption)
                        }
                    }
                    .buttonStyle(PlainButtonStyle())
                    .accessibilityLabel("category.icon".localized)
                    .accessibilityValue(selectedIcon)
                }
                
                Section("category.color".localized) {
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 5), spacing: 16) {
                        ForEach(availableColors, id: \.self) { color in
                            Button(action: { selectedColor = color }) {
                                Circle()
                                    .fill(Color(hex: color))
                                    .frame(width: 40, height: 40)
                                    .overlay(
                                        Circle()
                                            .stroke(selectedColor == color ? Color.primary : Color.clear, lineWidth: 3)
                                    )
                            }
                            .accessibilityLabel("category.color".localized)
                            .accessibilityValue(selectedColor == color ? "accessibility.value.selected".localized : "accessibility.value.notSelected".localized)
                        }
                    }
                    .padding(.vertical, 8)
                }
                
                Section("プレビュー") {
                    HStack {
                        Image(systemName: selectedIcon)
                            .foregroundColor(Color(hex: selectedColor))
                            .frame(width: 24, height: 24)
                        
                        Text(name.isEmpty ? "カテゴリ名" : name)
                            .font(.headline)
                        
                        Spacer()
                    }
                    .padding(.vertical, 8)
                }
            }
            .navigationTitle(categoryToEdit == nil ? "新しいカテゴリ" : "カテゴリを編集")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("action.cancel".localized) {
                        dismiss()
                    }
                    .accessibilityLabel("action.cancel".localized)
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("action.save".localized) {
                        saveCategory()
                    }
                    .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    .accessibilityLabel(categoryToEdit == nil ? "accessibility.addCategory".localized : "accessibility.editCategory".localized)
                }
            }
        }
        .sheet(isPresented: $showingIconPicker) {
            IconPickerView(selectedIcon: $selectedIcon)
        }
    }
    
    private func saveCategory() {
        let trimmedName = name.trimmingCharacters(in: .whitespacesAndNewlines)
        
        if let category = categoryToEdit {
            viewModel.updateCategory(category, name: trimmedName, iconName: selectedIcon, colorHex: selectedColor)
        } else {
            viewModel.createCategory(name: trimmedName, iconName: selectedIcon, colorHex: selectedColor)
        }
        
        dismiss()
    }
}

struct IconPickerView: View {
    @Environment(\.dismiss) private var dismiss
    @Binding var selectedIcon: String
    
    private let availableIcons = [
        "folder.fill", "fork.knife", "car.fill", "bolt.fill", "gamecontroller.fill",
        "cross.fill", "house.fill", "cart.fill", "creditcard.fill", "gift.fill",
        "book.fill", "music.note", "camera.fill", "phone.fill", "envelope.fill",
        "airplane", "bicycle", "bus.fill", "tram.fill", "fuelpump.fill",
        "wrench.fill", "hammer.fill", "paintbrush.fill", "scissors", "paperclip",
        "heart.fill", "star.fill", "flag.fill", "bell.fill", "tag.fill"
    ]
    
    var body: some View {
        NavigationView {
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 4), spacing: 20) {
                ForEach(availableIcons, id: \.self) { icon in
                    Button(action: {
                        selectedIcon = icon
                        dismiss()
                    }) {
                        VStack {
                            Image(systemName: icon)
                                .font(.title2)
                                .foregroundColor(selectedIcon == icon ? .blue : .primary)
                                .frame(width: 40, height: 40)
                                .background(
                                    Circle()
                                        .fill(selectedIcon == icon ? Color.blue.opacity(0.1) : Color.clear)
                                )
                        }
                    }
                    .buttonStyle(PlainButtonStyle())
                    .accessibilityLabel(icon)
                    .accessibilityValue(selectedIcon == icon ? "accessibility.value.selected".localized : "accessibility.value.notSelected".localized)
                }
            }
            .padding()
            .navigationTitle("アイコンを選択")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("action.done".localized) {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    CategoryFormView(viewModel: CategoryViewModel(modelContext: ModelContext(try! ModelContainer(for: Category.self))))
}