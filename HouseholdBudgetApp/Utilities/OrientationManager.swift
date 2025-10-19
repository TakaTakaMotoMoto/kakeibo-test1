import SwiftUI
import UIKit

/// Manages device orientation and provides orientation-related utilities
final class OrientationManager: ObservableObject {
    @Published var currentOrientation: UIDeviceOrientation = UIDevice.current.orientation
    @Published var isPortrait: Bool = true
    @Published var isLandscape: Bool = false
    
    private var orientationObserver: NSObjectProtocol?
    
    init() {
        updateOrientation()
        startOrientationObserver()
    }
    
    deinit {
        stopOrientationObserver()
    }
    
    private func startOrientationObserver() {
        orientationObserver = NotificationCenter.default.addObserver(
            forName: UIDevice.orientationDidChangeNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.updateOrientation()
        }
    }
    
    private func stopOrientationObserver() {
        if let observer = orientationObserver {
            NotificationCenter.default.removeObserver(observer)
            orientationObserver = nil
        }
    }
    
    private func updateOrientation() {
        currentOrientation = UIDevice.current.orientation
        
        switch currentOrientation {
        case .portrait, .portraitUpsideDown:
            isPortrait = true
            isLandscape = false
        case .landscapeLeft, .landscapeRight:
            isPortrait = false
            isLandscape = true
        default:
            // For unknown orientations, maintain current state
            break
        }
    }
    
    /// Returns true if the device is in a supported orientation
    var isSupportedOrientation: Bool {
        switch currentOrientation {
        case .portrait, .portraitUpsideDown:
            return true
        case .landscapeLeft, .landscapeRight:
            // App primarily supports portrait, but landscape is acceptable on iPad
            return UIDevice.current.userInterfaceIdiom == .pad
        default:
            return false
        }
    }
    
    /// Returns the appropriate layout configuration for the current orientation
    var layoutConfiguration: LayoutConfiguration {
        if UIDevice.current.userInterfaceIdiom == .pad {
            return isLandscape ? .iPadLandscape : .iPadPortrait
        } else {
            return .iPhone
        }
    }
}

enum LayoutConfiguration {
    case iPhone
    case iPadPortrait
    case iPadLandscape
    
    var usesCompactLayout: Bool {
        switch self {
        case .iPhone:
            return true
        case .iPadPortrait, .iPadLandscape:
            return false
        }
    }
    
    var prefersSidebar: Bool {
        switch self {
        case .iPhone, .iPadPortrait:
            return false
        case .iPadLandscape:
            return true
        }
    }
}