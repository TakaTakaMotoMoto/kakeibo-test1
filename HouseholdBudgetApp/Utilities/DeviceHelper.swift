import SwiftUI
import UIKit

struct DeviceHelper {
    static var isIPad: Bool {
        UIDevice.current.userInterfaceIdiom == .pad
    }
    
    static var isIPhone: Bool {
        UIDevice.current.userInterfaceIdiom == .phone
    }
    
    static var isLandscape: Bool {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene else {
            return false
        }
        return windowScene.interfaceOrientation.isLandscape
    }
    
    static var screenWidth: CGFloat {
        UIScreen.main.bounds.width
    }
    
    static var screenHeight: CGFloat {
        UIScreen.main.bounds.height
    }
    
    static var isCompactWidth: Bool {
        screenWidth < 768
    }
    
    static var isRegularWidth: Bool {
        screenWidth >= 768
    }
}

// MARK: - View Extensions for Responsive Design
extension View {
    @ViewBuilder
    func adaptiveLayout<Content: View>(
        compact: () -> Content,
        regular: () -> Content
    ) -> some View {
        if DeviceHelper.isCompactWidth {
            compact()
        } else {
            regular()
        }
    }
    
    @ViewBuilder
    func iPadOnly<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        if DeviceHelper.isIPad {
            content()
        } else {
            self
        }
    }
    
    @ViewBuilder
    func iPhoneOnly<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        if DeviceHelper.isIPhone {
            content()
        } else {
            self
        }
    }
    
    func adaptivePadding() -> some View {
        self.padding(DeviceHelper.isIPad ? 24 : 16)
    }
    
    func adaptiveFont(_ style: Font.TextStyle) -> some View {
        self.font(.system(style, design: .default))
            .dynamicTypeSize(DeviceHelper.isIPad ? .medium...(.accessibility3) : .small...(.accessibility2))
    }
}

// MARK: - Adaptive Spacing
struct AdaptiveSpacing {
    static var small: CGFloat {
        DeviceHelper.isIPad ? 12 : 8
    }
    
    static var medium: CGFloat {
        DeviceHelper.isIPad ? 20 : 16
    }
    
    static var large: CGFloat {
        DeviceHelper.isIPad ? 32 : 24
    }
    
    static var extraLarge: CGFloat {
        DeviceHelper.isIPad ? 48 : 32
    }
}

// MARK: - Adaptive Sizes
struct AdaptiveSizes {
    static var buttonHeight: CGFloat {
        DeviceHelper.isIPad ? 50 : 44
    }
    
    static var iconSize: CGFloat {
        DeviceHelper.isIPad ? 28 : 24
    }
    
    static var cornerRadius: CGFloat {
        DeviceHelper.isIPad ? 12 : 8
    }
    
    static var shadowRadius: CGFloat {
        DeviceHelper.isIPad ? 4 : 2
    }
}