import SwiftUI

struct InviteAcceptanceView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var sharingViewModel: SharingViewModel
    @ObservedObject var userAccountViewModel: UserAccountViewModel
    
    @State private var inviteCode: String = ""
    @State private var isAccepting: Bool = false
    @State private var showingSuccessAlert: Bool = false
    @State private var showingErrorAlert: Bool = false
    @State private var errorMessage: String = ""
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                // Header
                VStack(spacing: 12) {
                    Image(systemName: "person.badge.plus")
                        .font(.system(size: 48))
                        .foregroundColor(.blue)
                    
                    Text("sharing.acceptInvitation".localized)
                        .font(.title2)
                        .fontWeight(.semibold)
                        .foregroundColor(ColorManager.primaryText)
                    
                    Text("sharing.acceptInvitation.description".localized)
                        .font(.body)
                        .foregroundColor(ColorManager.secondaryText)
                        .multilineTextAlignment(.center)
                }
                .padding(.top)
                
                // Invite Code Input
                VStack(alignment: .leading, spacing: 8) {
                    Text("sharing.inviteCode.label".localized)
                        .font(.headline)
                        .foregroundColor(ColorManager.primaryText)
                    
                    TextField("sharing.inviteCode.placeholder".localized, text: $inviteCode)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .autocapitalization(.allCharacters)
                        .disableAutocorrection(true)
                        .font(.monospaced(.body)())
                    
                    Text("sharing.inviteCode.hint".localized)
                        .font(.caption)
                        .foregroundColor(ColorManager.secondaryText)
                }
                .padding(.horizontal)
                
                Spacer()
                
                // Accept Button
                Button(action: acceptInvitation) {
                    HStack {
                        if isAccepting {
                            ProgressView()
                                .scaleEffect(0.8)
                        } else {
                            Image(systemName: "checkmark.circle")
                        }
                        Text("sharing.acceptInvitation.button".localized)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(inviteCode.isEmpty ? Color.gray : Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .disabled(inviteCode.isEmpty || isAccepting)
                .padding(.horizontal)
                
                // Error Display
                if let error = sharingViewModel.currentError {
                    Text(error.localizedDescription)
                        .foregroundColor(.red)
                        .font(.caption)
                        .padding(.horizontal)
                }
            }
            .navigationTitle("sharing.acceptInvitation".localized)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("action.cancel".localized) {
                        dismiss()
                    }
                }
            }
        }
        .alert("sharing.invitationAccepted.title".localized, isPresented: $showingSuccessAlert) {
            Button("action.ok".localized) {
                dismiss()
            }
        } message: {
            Text("sharing.invitationAccepted.message".localized)
        }
        .alert("sharing.invitationFailed.title".localized, isPresented: $showingErrorAlert) {
            Button("action.ok".localized) {
                showingErrorAlert = false
            }
        } message: {
            Text(errorMessage)
        }
    }
    
    private func acceptInvitation() {
        guard let currentAccount = userAccountViewModel.currentAccount else {
            errorMessage = "error.auth.notLoggedIn".localized
            showingErrorAlert = true
            return
        }
        
        isAccepting = true
        
        Task {
            let success = await sharingViewModel.processInvitationAcceptance(
                token: inviteCode.trimmingCharacters(in: .whitespacesAndNewlines),
                accountId: currentAccount.id
            )
            
            await MainActor.run {
                isAccepting = false
                
                if success {
                    showingSuccessAlert = true
                } else {
                    errorMessage = sharingViewModel.currentError?.localizedDescription ?? "sharing.invitationFailed.unknown".localized
                    showingErrorAlert = true
                }
            }
        }
    }
}

#Preview {
    InviteAcceptanceView(
        sharingViewModel: SharingViewModel(modelContext: PreviewContainer.shared.mainContext),
        userAccountViewModel: UserAccountViewModel(modelContext: PreviewContainer.shared.mainContext)
    )
}