import SwiftUI

struct iPadTestView: View {
    @EnvironmentObject private var orientationManager: OrientationManager
    
    var body: some View {
        VStack(spacing: 20) {
            Text("iPad Optimization Test")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            VStack(alignment: .leading, spacing: 12) {
                Text("Device Information:")
                    .font(.headline)
                
                HStack {
                    Text("Device Type:")
                    Spacer()
                    Text(DeviceHelper.isIPad ? "iPad" : "iPhone")
                        .fontWeight(.medium)
                }
                
                HStack {
                    Text("Screen Width:")
                    Spacer()
                    Text("\(Int(DeviceHelper.screenWidth))pt")
                        .fontWeight(.medium)
                }
                
                HStack {
                    Text("Screen Height:")
                    Spacer()
                    Text("\(Int(DeviceHelper.screenHeight))pt")
                        .fontWeight(.medium)
                }
                
                HStack {
                    Text("Orientation:")
                    Spacer()
                    Text(orientationManager.isLandscape ? "Landscape" : "Portrait")
                        .fontWeight(.medium)
                }
                
                HStack {
                    Text("Layout Mode:")
                    Spacer()
                    Text(DeviceHelper.isRegularWidth ? "Regular" : "Compact")
                        .fontWeight(.medium)
                }
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
            
            // Test adaptive spacing
            VStack(spacing: AdaptiveSpacing.medium) {
                Text("Adaptive Spacing Test")
                    .font(.headline)
                
                HStack(spacing: AdaptiveSpacing.small) {
                    ForEach(0..<3) { index in
                        RoundedRectangle(cornerRadius: AdaptiveSizes.cornerRadius)
                            .fill(Color.blue)
                            .frame(width: 60, height: AdaptiveSizes.buttonHeight)
                    }
                }
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
            
            Spacer()
        }
        .adaptivePadding()
        .navigationTitle("iPad Test")
    }
}

#Preview {
    NavigationView {
        iPadTestView()
            .environmentObject(OrientationManager())
    }
}