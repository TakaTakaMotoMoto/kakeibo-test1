import XCTest

final class DynamicTypeTests: XCTestCase {
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
    }
    
    override func tearDownWithError() throws {
        app = nil
    }
    
    // MARK: - Dynamic Type Tests
    
    func testDynamicTypeSupport() throws {
        // Test with different Dynamic Type sizes
        let dynamicTypeSizes: [String] = [
            "UICTContentSizeCategoryXS",
            "UICTContentSizeCategoryS", 
            "UICTContentSizeCategoryM",
            "UICTContentSizeCategoryL",
            "UICTContentSizeCategoryXL",
            "UICTContentSizeCategoryXXL",
            "UICTContentSizeCategoryXXXL"
        ]
        
        for size in dynamicTypeSizes {
            // Set Dynamic Type size
            app.launchArguments = ["-UIPreferredContentSizeCategoryName", size]
            app.launch()
            
            // Test main tab bar with current size
            try testTabBarWithDynamicType(size: size)
            
            // Test transaction form with current size
            try testTransactionFormWithDynamicType(size: size)
            
            // Test chart view with current size
            try testChartViewWithDynamicType(size: size)
            
            app.terminate()
        }
    }
    
    func testAccessibilityDynamicTypeSupport() throws {
        // Test with accessibility Dynamic Type sizes
        let accessibilityTypeSizes: [String] = [
            "UICTContentSizeCategoryAccessibilityM",
            "UICTContentSizeCategoryAccessibilityL",
            "UICTContentSizeCategoryAccessibilityXL",
            "UICTContentSizeCategoryAccessibilityXXL",
            "UICTContentSizeCategoryAccessibilityXXXL"
        ]
        
        for size in accessibilityTypeSizes {
            // Set accessibility Dynamic Type size
            app.launchArguments = ["-UIPreferredContentSizeCategoryName", size]
            app.launch()
            
            // Test that UI remains functional with large text
            try testUIFunctionalityWithLargeText(size: size)
            
            app.terminate()
        }
    }
    
    private func testTabBarWithDynamicType(size: String) throws {
        // Verify tab bar is still functional
        let tabBar = app.tabBars.firstMatch
        XCTAssertTrue(tabBar.waitForExistence(timeout: 5), "Tab bar should exist with Dynamic Type size: \(size)")
        
        let expectedTabs = ["取引", "グラフ", "資金元", "設定"]
        
        for tabTitle in expectedTabs {
            let tabButton = app.tabBars.buttons[tabTitle]
            XCTAssertTrue(tabButton.exists, "Tab button '\(tabTitle)' should exist with size: \(size)")
            
            // Verify tab button is still tappable
            XCTAssertTrue(tabButton.isHittable, "Tab button '\(tabTitle)' should be hittable with size: \(size)")
            
            // Test tapping the tab
            tabButton.tap()
            
            // Verify navigation worked
            XCTAssertTrue(tabButton.isSelected || app.navigationBars.count > 0, 
                         "Tab navigation should work with size: \(size)")
        }
    }
    
    private func testTransactionFormWithDynamicType(size: String) throws {
        // Navigate to transaction tab
        let transactionTab = app.tabBars.buttons["取引"]
        XCTAssertTrue(transactionTab.waitForExistence(timeout: 5))
        transactionTab.tap()
        
        // Tap add transaction button
        let addButton = app.navigationBars.buttons["追加"]
        XCTAssertTrue(addButton.waitForExistence(timeout: 5), "Add button should exist with size: \(size)")
        XCTAssertTrue(addButton.isHittable, "Add button should be hittable with size: \(size)")
        addButton.tap()
        
        // Test form fields with Dynamic Type
        let amountField = app.textFields["金額を入力"]
        XCTAssertTrue(amountField.waitForExistence(timeout: 5), "Amount field should exist with size: \(size)")
        XCTAssertTrue(amountField.isHittable, "Amount field should be hittable with size: \(size)")
        
        // Verify text field can receive input
        amountField.tap()
        amountField.typeText("100")
        
        // Test category picker
        let categoryPicker = app.buttons["カテゴリを選択"]
        if categoryPicker.waitForExistence(timeout: 5) {
            XCTAssertTrue(categoryPicker.isHittable, "Category picker should be hittable with size: \(size)")
            
            // Verify picker button has reasonable size
            let pickerFrame = categoryPicker.frame
            XCTAssertGreaterThan(pickerFrame.height, 20, "Category picker should have minimum height with size: \(size)")
        }
        
        // Test fund source picker
        let fundSourcePicker = app.buttons["資金元を選択"]
        if fundSourcePicker.waitForExistence(timeout: 5) {
            XCTAssertTrue(fundSourcePicker.isHittable, "Fund source picker should be hittable with size: \(size)")
        }
        
        // Test save button
        let saveButton = app.buttons["保存"]
        XCTAssertTrue(saveButton.waitForExistence(timeout: 5), "Save button should exist with size: \(size)")
        XCTAssertTrue(saveButton.isHittable, "Save button should be hittable with size: \(size)")
        
        // Verify button has reasonable size
        let saveButtonFrame = saveButton.frame
        XCTAssertGreaterThan(saveButtonFrame.height, 30, "Save button should have minimum height with size: \(size)")
    }
    
    private func testChartViewWithDynamicType(size: String) throws {
        // Navigate to chart tab
        let chartTab = app.tabBars.buttons["グラフ"]
        XCTAssertTrue(chartTab.waitForExistence(timeout: 5))
        chartTab.tap()
        
        // Test chart view exists and is functional
        let chartView = app.otherElements["ChartView"]
        if chartView.waitForExistence(timeout: 5) {
            XCTAssertTrue(chartView.exists, "Chart view should exist with size: \(size)")
        }
        
        // Test chart control buttons
        let viewSwitchButtons = ["月次", "年次", "カテゴリ別"]
        
        for buttonTitle in viewSwitchButtons {
            let button = app.buttons[buttonTitle]
            if button.exists {
                XCTAssertTrue(button.isHittable, "Chart button '\(buttonTitle)' should be hittable with size: \(size)")
                
                // Verify button has reasonable size
                let buttonFrame = button.frame
                XCTAssertGreaterThan(buttonFrame.height, 20, "Chart button should have minimum height with size: \(size)")
                
                // Test button functionality
                button.tap()
                
                // Verify chart updates
                XCTAssertTrue(chartView.waitForExistence(timeout: 3), "Chart should update when button tapped with size: \(size)")
            }
        }
        
        // Test total amount display readability
        let totalAmountLabel = app.staticTexts.matching(identifier: "TotalAmount").element
        if totalAmountLabel.waitForExistence(timeout: 3) {
            XCTAssertTrue(totalAmountLabel.exists, "Total amount should be visible with size: \(size)")
            
            // Verify text is not truncated (basic check)
            let labelText = totalAmountLabel.label
            XCTAssertFalse(labelText.contains("..."), "Total amount text should not be truncated with size: \(size)")
        }
    }
    
    private func testUIFunctionalityWithLargeText(size: String) throws {
        // Test that critical UI elements remain functional with very large text
        
        // Test transaction creation flow
        let transactionTab = app.tabBars.buttons["取引"]
        XCTAssertTrue(transactionTab.waitForExistence(timeout: 5))
        transactionTab.tap()
        
        let addButton = app.navigationBars.buttons["追加"]
        if addButton.waitForExistence(timeout: 5) {
            XCTAssertTrue(addButton.isHittable, "Add button should remain functional with accessibility size: \(size)")
            addButton.tap()
            
            // Verify form is still usable
            let amountField = app.textFields["金額を入力"]
            if amountField.waitForExistence(timeout: 5) {
                XCTAssertTrue(amountField.isHittable, "Amount field should remain functional with accessibility size: \(size)")
                
                // Test text input
                amountField.tap()
                amountField.typeText("50")
                
                // Verify text was entered
                XCTAssertTrue(amountField.value as? String == "50" || 
                             (amountField.value as? String)?.contains("50") == true,
                             "Text input should work with accessibility size: \(size)")
            }
        }
        
        // Test navigation between tabs
        let chartTab = app.tabBars.buttons["グラフ"]
        if chartTab.exists {
            XCTAssertTrue(chartTab.isHittable, "Chart tab should remain functional with accessibility size: \(size)")
            chartTab.tap()
            
            // Verify navigation worked
            XCTAssertTrue(app.otherElements["ChartView"].waitForExistence(timeout: 5) || 
                         app.staticTexts["データがありません"].waitForExistence(timeout: 5),
                         "Chart navigation should work with accessibility size: \(size)")
        }
    }
    
    func testTextTruncationPrevention() throws {
        // Test with largest accessibility size to ensure text doesn't get truncated
        app.launchArguments = ["-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]
        app.launch()
        
        // Navigate through different screens and check for text truncation
        let screens = [
            ("取引", "TransactionList"),
            ("グラフ", "ChartView"),
            ("資金元", "FundSourceList"),
            ("設定", "SettingsList")
        ]
        
        for (tabName, screenIdentifier) in screens {
            let tab = app.tabBars.buttons[tabName]
            XCTAssertTrue(tab.waitForExistence(timeout: 5))
            tab.tap()
            
            // Look for any text elements that might be truncated
            let textElements = app.staticTexts.allElementsBoundByAccessibilityElement
            
            for textElement in textElements {
                if textElement.exists && !textElement.label.isEmpty {
                    // Check if text contains ellipsis indicating truncation
                    XCTAssertFalse(textElement.label.contains("..."), 
                                  "Text should not be truncated in \(tabName) screen: '\(textElement.label)'")
                    XCTAssertFalse(textElement.label.contains("…"), 
                                  "Text should not be truncated in \(tabName) screen: '\(textElement.label)'")
                }
            }
        }
    }
    
    func testScrollingWithLargeText() throws {
        // Test that scrolling works properly with large text
        app.launchArguments = ["-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXL"]
        app.launch()
        
        // Test transaction list scrolling
        let transactionTab = app.tabBars.buttons["取引"]
        XCTAssertTrue(transactionTab.waitForExistence(timeout: 5))
        transactionTab.tap()
        
        let transactionList = app.tables["TransactionList"]
        if transactionList.waitForExistence(timeout: 5) && transactionList.cells.count > 1 {
            // Test scrolling
            let firstCell = transactionList.cells.element(boundBy: 0)
            let lastCell = transactionList.cells.element(boundBy: transactionList.cells.count - 1)
            
            if firstCell.exists && lastCell.exists {
                // Scroll to make sure last cell is visible
                lastCell.scrollToElement()
                XCTAssertTrue(lastCell.isHittable, "Last cell should be accessible after scrolling with large text")
                
                // Scroll back to first cell
                firstCell.scrollToElement()
                XCTAssertTrue(firstCell.isHittable, "First cell should be accessible after scrolling with large text")
            }
        }
    }
}

// MARK: - XCUIElement Extension for Scrolling

extension XCUIElement {
    func scrollToElement() {
        while !self.isHittable {
            let app = XCUIApplication()
            app.swipeUp()
        }
    }
}