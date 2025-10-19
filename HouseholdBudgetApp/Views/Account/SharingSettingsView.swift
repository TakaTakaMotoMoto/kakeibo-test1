import SwiftUI

struct SharingSettingsView: View {
    @ObservedObject var userAccountViewModel: UserAccountViewModel
    @ObservedObject var fundSourceViewModel: FundSourceViewModel
    @State private var showingInviteGenerator = false
    @State private var showingInviteAcceptor = false
    
    var body: some View {
        NavigationView {
            List {
                if let currentAccount = userAccountViewModel.currentAccount {
                    Section("sharing.sharedFundSources".localized) {
                        if currentAccount.sharedFundSources.isEmpty {
                            Text("sharing.notShared".localized)
                                .foregroundColor(ColorManager.secondaryText)
                                .font(.body)
                        } else {
                            ForEach(currentAccount.sharedFundSources, id: \.id) { fundSource in
                                SharedFundSourceRowView(
                                    fundSource: fundSource,
                                    userAccountViewModel: userAccountViewModel,
                                    fundSourceViewModel: fundSourceViewModel
                                )
                            }
                        }
                    }
                    
                    Section("sharing.title".localized) {
                        Button("sharing.generateInvite".localized) {
                            showingInviteGenerator = true
                        }
                        .accessibilityLabel("sharing.generateInvite".localized)
                        
                        Button("sharing.acceptInvite".localized) {
                            showingInviteAcceptor = true
                        }
                        .accessibilityLabel("sharing.acceptInvite".localized)
                    }
                    
                    Section {
                        ForEach(fundSourceViewModel.fundSources, id: \.id) { fundSource in
                            FundSourceSharingRowView(
                                fundSource: fundSource,
                                userAccountViewModel: userAccountViewModel,
                                fundSourceViewModel: fundSourceViewModel
                            )
                        }
                    } header: {
                        Text("fundSource.list".localized)
                    }
                } else {
                    Section {
                        VStack(spacing: 16) {
                            Image(systemName: "person.2.slash")
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
                
                if let error = userAccountViewModel.currentError {
                    Section {
                        Text(error.localizedDescription)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }
            }
            .navigationTitle("sharing.title".localized)
            .sheet(isPresented: $showingInviteGenerator) {
                InviteGeneratorView(userAccountViewModel: userAccountViewModel)
            }
            .sheet(isPresented: $showingInviteAcceptor) {
                InviteAcceptorView(userAccountViewModel: userAccountViewModel)
            }
        }
    }
}

struct SharedFundSourceRowView: View {
    let fundSource: FundSource
    @ObservedObject var userAccountViewModel: UserAccountViewModel
    @ObservedObject var fundSourceViewModel: FundSourceViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(fundSource.name)
                    .font(.headline)
                    .foregroundColor(ColorManager.primaryText)
                
                Spacer()
                
                Text(CurrencyFormatter.shared.string(from: fundSource.currentBalance as NSDecimalNumber) ?? "¥0")
                    .font(.body)
                    .foregroundColor(ColorManager.primaryText)
            }
            
            let sharedAccounts = userAccountViewModel.getSharedAccounts(for: fundSource)
            if !sharedAccounts.isEmpty {
                Text("sharing.sharedWith".localized(with: sharedAccounts.map { $0.username }.joined(separator: ", ")))
                    .font(.caption)
                    .foregroundColor(ColorManager.secondaryText)
            }
        }
        .swipeActions(edge: .trailing) {
            if let currentAccount = userAccountViewModel.currentAccount {
                Button("sharing.stopSharing".localized, role: .destructive) {
                    userAccountViewModel.unshareFundSource(fundSource, from: currentAccount)
                }
            }
        }
    }
}

struct FundSourceSharingRowView: View {
    let fundSource: FundSource
    @ObservedObject var userAccountViewModel: UserAccountViewModel
    @ObservedObject var fundSourceViewModel: FundSourceViewModel
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(fundSource.name)
                    .font(.headline)
                    .foregroundColor(ColorManager.primaryText)
                
                Text(CurrencyFormatter.shared.string(from: fundSource.currentBalance as NSDecimalNumber) ?? "¥0")
                    .font(.body)
                    .foregroundColor(ColorManager.secondaryText)
            }
            
            Spacer()
            
            if fundSource.isShared {
                Image(systemName: "person.2.fill")
                    .foregroundColor(.green)
                    .accessibilityLabel("fundSource.shared".localized)
            } else {
                Image(systemName: "person")
                    .foregroundColor(ColorManager.secondaryText)
                    .accessibilityLabel("sharing.notShared".localized)
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(fundSource.name), \(fundSource.isShared ? "fundSource.shared".localized : "sharing.notShared".localized)")
    }
}

// MARK: - Placeholder Views for Future Implementation

struct InviteGeneratorView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var userAccountViewModel: UserAccountViewModel
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Image(systemName: "qrcode")
                    .font(.system(size: 64))
                    .foregroundColor(ColorManager.secondaryText)
                
                Text("sharing.generateInvite".localized)
                    .font(.headline)
                
                Text("This feature will be implemented in a future version.")
                    .font(.body)
                    .foregroundColor(ColorManager.secondaryText)
                    .multilineTextAlignment(.center)
                
                Spacer()
            }
            .padding()
            .navigationTitle("sharing.generateInvite".localized)
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

struct InviteAcceptorView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var userAccountViewModel: UserAccountViewModel
    @State private var inviteCode: String = ""
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Image(systemName: "person.badge.plus")
                    .font(.system(size: 64))
                    .foregroundColor(ColorManager.secondaryText)
                
                Text("sharing.acceptInvite".localized)
                    .font(.headline)
                
                TextField("sharing.inviteCode".localized, text: $inviteCode)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .autocapitalization(.none)
                
                Text("This feature will be implemented in a future version.")
                    .font(.body)
                    .foregroundColor(ColorManager.secondaryText)
                    .multilineTextAlignment(.center)
                
                Spacer()
            }
            .padding()
            .navigationTitle("sharing.acceptInvite".localized)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("action.cancel".localized) {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("action.done".localized) {
                        // Future implementation
                        dismiss()
                    }
                    .disabled(inviteCode.isEmpty)
                }
            }
        }
    }
}

#Preview {
    SharingSettingsView(
        userAccountViewModel: UserAccountViewModel(modelContext: PreviewContainer.shared.mainContext),
        fundSourceViewModel: FundSourceViewModel(modelContext: PreviewContainer.shared.mainContext)
    )
}