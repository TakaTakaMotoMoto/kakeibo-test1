import SwiftUI

struct UserAccountListView: View {
    @ObservedObject var viewModel: UserAccountViewModel
    @State private var showingCreateAccount = false
    @State private var accountToEdit: UserAccount?
    
    var body: some View {
        NavigationView {
            List {
                if let currentAccount = viewModel.currentAccount {
                    Section("account.currentAccount".localized) {
                        AccountRowView(account: currentAccount, isCurrent: true) {
                            accountToEdit = currentAccount
                        }
                    }
                }
                
                if !viewModel.allAccounts.isEmpty {
                    Section("account.switchAccount".localized) {
                        ForEach(viewModel.allAccounts.filter { $0.id != viewModel.currentAccount?.id }, id: \.id) { account in
                            AccountRowView(account: account, isCurrent: false) {
                                viewModel.setCurrentAccount(account)
                            }
                            .swipeActions(edge: .trailing) {
                                Button("action.edit".localized) {
                                    accountToEdit = account
                                }
                                .tint(.blue)
                                
                                Button("action.delete".localized, role: .destructive) {
                                    viewModel.deleteAccount(account)
                                }
                            }
                        }
                    }
                } else if viewModel.currentAccount == nil {
                    Section {
                        VStack(spacing: 16) {
                            Image(systemName: "person.circle")
                                .font(.system(size: 48))
                                .foregroundColor(ColorManager.secondaryText)
                            
                            Text("account.noAccount".localized)
                                .font(.headline)
                                .foregroundColor(ColorManager.primaryText)
                            
                            Text("account.createFirst".localized)
                                .font(.body)
                                .foregroundColor(ColorManager.secondaryText)
                                .multilineTextAlignment(.center)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 32)
                    }
                }
                
                if let error = viewModel.currentError {
                    Section {
                        Text(error.localizedDescription)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }
            }
            .navigationTitle("settings.account".localized)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("action.add".localized) {
                        showingCreateAccount = true
                    }
                    .accessibilityLabel("accessibility.addAccount".localized)
                }
            }
            .sheet(isPresented: $showingCreateAccount) {
                UserAccountFormView(viewModel: viewModel, account: nil)
            }
            .sheet(item: $accountToEdit) { account in
                UserAccountFormView(viewModel: viewModel, account: account)
            }
        }
    }
}

struct AccountRowView: View {
    let account: UserAccount
    let isCurrent: Bool
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(account.username)
                        .font(.headline)
                        .foregroundColor(ColorManager.primaryText)
                    
                    Text(account.email)
                        .font(.caption)
                        .foregroundColor(ColorManager.secondaryText)
                }
                
                Spacer()
                
                if isCurrent {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                        .accessibilityLabel("accessibility.value.selected".localized)
                }
            }
        }
        .buttonStyle(PlainButtonStyle())
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(account.username), \(account.email)")
        .accessibilityValue(isCurrent ? "accessibility.value.selected".localized : "accessibility.value.notSelected".localized)
    }
}

#Preview {
    UserAccountListView(viewModel: UserAccountViewModel(modelContext: PreviewContainer.shared.mainContext))
}