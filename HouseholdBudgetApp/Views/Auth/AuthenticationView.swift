import SwiftUI

struct AuthenticationView: View {
    @Environment(UserAccountViewModel.self) private var userAccountViewModel
    
    var body: some View {
        Group {
            if userAccountViewModel.isLoggedIn {
                MainTabView()
            } else {
                LoginView()
            }
        }
        .animation(.easeInOut, value: userAccountViewModel.isLoggedIn)
    }
}

#Preview {
    AuthenticationView()
        .environment(UserAccountViewModel(modelContext: PreviewContainer.shared.mainContext))
}