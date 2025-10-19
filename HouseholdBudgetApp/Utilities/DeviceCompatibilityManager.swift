import SwiftUI
import UIKit

/// Manages device compatibility testing and optimization
@MainActor
final class DeviceCompatibilityManager: ObservableObject {
    @Published var deviceInfo: DeviceInfo
    @Published var compatibilityResults: [CompatibilityTestResult] = []
    @Published var isRunningCompatibilityTests = false
    
    init() {
        self.deviceInfo = DeviceInfo()
    }
    
    /// Runs comprehensive device compatibility tests
    func runCompatibilityTests() async {
        isRunningCompatibilityTests = true
        compatibilityResults.removeAll()
        
        let tests: [(String, () async -> CompatibilityTestResult)] = [
            ("iOS Version Compatibility", testIOSVersionCompatibility),
            ("Device Type Support", testDeviceTypeSupport),
            ("Screen Size Adaptation", testScreenSizeAdaptation),
            ("Orientation Support", testOrientationSupport),
            ("Memory Constraints", testMemoryConstraints),
            ("Performance on Device", testDevicePerformance)
        ]
        
        for (testName, testFunction) in tests {
            let result = await testFunction()
            compatibilityResults.append(result)
        }
        
        isRunningCompatibilityTests = false
    }
    
    private func testIOSVersionCompatibility() async -> CompatibilityTestResult {
        let currentVersion = deviceInfo.iOSVersion
        let minimumVersion = "17.0"
        
        let isCompatible = currentVersion.compare(minimumVersion, options: .numeric) != .orderedAscending
        
        return CompatibilityTestResult(
            testName: "iOS Version Compatibility",
            status: isCompatible ? .passed : .failed,
            message: isCompatible ? 
                "iOS \(currentVersion) is supported (minimum: \(minimumVersion))" :
                "iOS \(currentVersion) is below minimum requirement (\(minimumVersion))",
            deviceSpecific: true
        )
    }
    
    private func testDeviceTypeSupport() async -> CompatibilityTestResult {
        let deviceType = deviceInfo.deviceType
        let supportedTypes: [UIUserInterfaceIdiom] = [.phone, .pad]
        
        let isSupported = supportedTypes.contains(deviceType)
        
        return CompatibilityTestResult(
            testName: "Device Type Support",
            status: isSupported ? .passed : .failed,
            message: isSupported ?
                "\(deviceInfo.deviceTypeString) is supported" :
                "\(deviceInfo.deviceTypeString) is not supported",
            deviceSpecific: true
        )
    }
    
    private func testScreenSizeAdaptation() async -> CompatibilityTestResult {
        let screenSize = deviceInfo.screenSize
        let screenScale = deviceInfo.screenScale
        
        // Test if screen dimensions are reasonable for the app
        let minWidth: CGFloat = 320  // iPhone SE width
        let minHeight: CGFloat = 568 // iPhone SE height
        
        let isAdequateSize = screenSize.width >= minWidth && screenSize.height >= minHeight
        
        return CompatibilityTestResult(
            testName: "Screen Size Adaptation",
            status: isAdequateSize ? .passed : .warning,
            message: "Screen: \(Int(screenSize.width))×\(Int(screenSize.height)) @\(screenScale)x",
            deviceSpecific: true
        )
    }
}   
 private func testOrientationSupport() async -> CompatibilityTestResult {
        // App is designed for portrait orientation primarily
        let supportedOrientations = deviceInfo.supportedOrientations
        let hasPortrait = supportedOrientations.contains(.portrait)
        
        return CompatibilityTestResult(
            testName: "Orientation Support",
            status: hasPortrait ? .passed : .failed,
            message: hasPortrait ?
                "Portrait orientation supported (primary requirement met)" :
                "Portrait orientation not supported",
            deviceSpecific: true
        )
    }
    
    private func testMemoryConstraints() async -> CompatibilityTestResult {
        let availableMemory = deviceInfo.availableMemory
        let totalMemory = deviceInfo.totalMemory
        let memoryPressure = 1.0 - (Double(availableMemory) / Double(totalMemory))
        
        let status: CompatibilityTestResult.Status
        let message: String
        
        if memoryPressure < 0.7 {
            status = .passed
            message = "Memory usage is healthy (\(Int(memoryPressure * 100))% used)"
        } else if memoryPressure < 0.9 {
            status = .warning
            message = "Memory usage is high (\(Int(memoryPressure * 100))% used)"
        } else {
            status = .failed
            message = "Memory usage is critical (\(Int(memoryPressure * 100))% used)"
        }
        
        return CompatibilityTestResult(
            testName: "Memory Constraints",
            status: status,
            message: message,
            deviceSpecific: true
        )
    }
    
    private func testDevicePerformance() async -> CompatibilityTestResult {
        let startTime = CFAbsoluteTimeGetCurrent()
        
        // Perform a CPU-intensive task to test performance
        var result = 0
        for i in 1...100000 {
            result += i % 1000
        }
        
        let duration = CFAbsoluteTimeGetCurrent() - startTime
        
        let status: CompatibilityTestResult.Status
        let message: String
        
        if duration < 0.1 {
            status = .passed
            message = "Performance is excellent (\(String(format: "%.3f", duration))s)"
        } else if duration < 0.5 {
            status = .warning
            message = "Performance is acceptable (\(String(format: "%.3f", duration))s)"
        } else {
            status = .failed
            message = "Performance is poor (\(String(format: "%.3f", duration))s)"
        }
        
        return CompatibilityTestResult(
            testName: "Device Performance",
            status: status,
            message: message,
            deviceSpecific: true
        )
    }
}

// MARK: - Supporting Types

struct DeviceInfo {
    let deviceType: UIUserInterfaceIdiom
    let deviceModel: String
    let iOSVersion: String
    let screenSize: CGSize
    let screenScale: CGFloat
    let availableMemory: UInt64
    let totalMemory: UInt64
    let supportedOrientations: [UIInterfaceOrientation]
    
    init() {
        self.deviceType = UIDevice.current.userInterfaceIdiom
        self.deviceModel = UIDevice.current.model
        self.iOSVersion = UIDevice.current.systemVersion
        
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first {
            self.screenSize = window.screen.bounds.size
            self.screenScale = window.screen.scale
        } else {
            self.screenSize = UIScreen.main.bounds.size
            self.screenScale = UIScreen.main.scale
        }
        
        // Get memory info
        var info = mach_task_basic_info()
        var count = mach_msg_type_number_t(MemoryLayout<mach_task_basic_info>.size)/4
        
        let kerr: kern_return_t = withUnsafeMutablePointer(to: &info) {
            $0.withMemoryRebound(to: integer_t.self, capacity: 1) {
                task_info(mach_task_self_,
                         task_flavor_t(MACH_TASK_BASIC_INFO),
                         $0,
                         &count)
            }
        }
        
        if kerr == KERN_SUCCESS {
            self.availableMemory = info.resident_size
        } else {
            self.availableMemory = 0
        }
        
        // Estimate total memory (simplified)
        self.totalMemory = ProcessInfo.processInfo.physicalMemory
        
        // Supported orientations (app supports portrait primarily)
        self.supportedOrientations = [.portrait, .portraitUpsideDown]
    }
    
    var deviceTypeString: String {
        switch deviceType {
        case .phone:
            return "iPhone"
        case .pad:
            return "iPad"
        case .tv:
            return "Apple TV"
        case .carPlay:
            return "CarPlay"
        case .mac:
            return "Mac"
        case .vision:
            return "Vision Pro"
        @unknown default:
            return "Unknown Device"
        }
    }
}struct Comp
atibilityTestResult {
    let testName: String
    let status: Status
    let message: String
    let deviceSpecific: Bool
    
    enum Status {
        case passed
        case warning
        case failed
        
        var color: Color {
            switch self {
            case .passed:
                return .green
            case .warning:
                return .orange
            case .failed:
                return .red
            }
        }
        
        var icon: String {
            switch self {
            case .passed:
                return "checkmark.circle.fill"
            case .warning:
                return "exclamationmark.triangle.fill"
            case .failed:
                return "xmark.circle.fill"
            }
        }
    }
}