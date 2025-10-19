import XCTest

final class VoiceOverTests: XCTestCase {
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }
    
    override func tearDownWithError() throws {
        app = nil
    }
    
    // MARK: - VoiceOver Accessibility Tests
    
    func testMainTabBarAccessibility() throws {
        // Test all tab bar buttons have proper accessibility labels
        let tabBar = app.tabBars.firstMatch
        XCTAssertTrue(tabBar.waitForExistence(timeout: 5))
        
        let expectedTabs = ["取引", "グラフ", "資金元", "設定"]
        
        for tabTitle in expectedTabs {
            let tabButton = app.tabBars.buttons[tabTitle]
            XCTAssertTrue(tabButton.exists, "Tab button '\(tabTitle)' should exist")
            
            // Verify accessibility label exists and is not empty
            XCTAssertNotNil(tabButton.label)
            XCTAssertFalse(tabButton.label.isEmpty, "Tab button '\(tabTitle)' should have accessibility label")
            
            // Verify accessibility traits
            XCTAssertTrue(tabButton.isAccessibilityElement)
        }
    }
    
    func testTransactionFormAccessibility() throws {
        // Navigate to transaction tab
        let transactionTab = app.tabBars.buttons["取引"]
        XCTAssertTrue(transactionTab.waitForExistence(timeout: 5))
        transactionTab.tap()
        
        // Tap add transaction button
        let addButton = app.navigationBars.buttons["追加"]
        XCTAssertTrue(addButton.waitForExistence(timeout: 5))
        
        // Verify add button has accessibility label
        XCTAssertNotNil(addButton.label)
        XCTAssertFalse(addButton.label.isEmpty)
        
        addButton.tap()
        
        // Test form field accessibility
        let amountField = app.textFields["金額を入力"]
        XCTAssertTrue(amountField.waitForExistence(timeout: 5))
        
        // Verify text field has proper accessibility properties
        XCTAssertTrue(amountField.isAccessibilityElement)
        XCTAssertNotNil(amountField.label)
        XCTAssertFalse(amountField.label.isEmpty)
        
        // Test category picker accessibility
        let categoryPicker = app.buttons["カテゴリを選択"]
        if categoryPicker.waitForExistence(timeout: 5) {
            XCTAssertTrue(categoryPicker.isAccessibilityElement)
            XCTAssertNotNil(categoryPicker.label)
            XCTAssertFalse(categoryPicker.label.isEmpty)
            
            // Verify accessibility hint if present
            if let hint = categoryPicker.accessibilityHint {
                XCTAssertFalse(hint.isEmpty)
            }
        }
        
        // Test fund source picker accessibility
        let fundSourcePicker = app.buttons["資金元を選択"]
        if fundSourcePicker.waitForExistence(timeout: 5) {
            XCTAssertTrue(fundSourcePicker.isAccessibilityElement)
            XCTAssertNotNil(fundSourcePicker.label)
            XCTAssertFalse(fundSourcePicker.label.isEmpty)
        }
        
        // Test save button accessibility
        let saveButton = app.buttons["保存"]
        XCTAssertTrue(saveButton.waitForExistence(timeout: 5))
        XCTAssertTrue(saveButton.isAccessibilityElement)
        XCTAssertNotNil(saveButton.label)
        XCTAssertFalse(saveButton.label.isEmpty)
    }
    
    func testTransactionListAccessibility() throws {
        // Navigate to transaction tab
        let transactionTab = app.tabBars.buttons["取引"]
        XCTAssertTrue(transactionTab.waitForExistence(timeout: 5))
        transactionTab.tap()
        
        // Test transaction list accessibility
        let transactionList = app.tables["TransactionList"]
        if transactionList.waitForExistence(timeout: 5) {
            XCTAssertTrue(transactionList.isAccessibilityElement)
            
            // Test individual transaction cells
            let cells = transactionList.cells
            if cells.count > 0 {
                let firstCell = cells.element(boundBy: 0)
                XCTAssertTrue(firstCell.isAccessibilityElement)
                XCTAssertNotNil(firstCell.label)
                XCTAssertFalse(firstCell.label.isEmpty)
                
                // Verify cell contains meaningful information in accessibility label
                let cellLabel = firstCell.label
                XCTAssertTrue(cellLabel.contains("¥") || cellLabel.contains("円"), "Cell should contain amount information")
            }
        }
    }
    
    func testChartAccessibility() throws {
        // Navigate to chart tab
        let chartTab = app.tabBars.buttons["グラフ"]
        XCTAssertTrue(chartTab.waitForExistence(timeout: 5))
        chartTab.tap()
        
        // Test chart view accessibility
        let chartView = app.otherElements["ChartView"]
        if chartView.waitForExistence(timeout: 5) {
            XCTAssertTrue(chartView.isAccessibilityElement)
            XCTAssertNotNil(chartView.label)
            XCTAssertFalse(chartView.label.isEmpty)
            
            // Verify chart has meaningful accessibility description
            let chartLabel = chartView.label
            XCTAssertTrue(chartLabel.contains("グラフ") || chartLabel.contains("chart"), "Chart should have descriptive label")
        }
        
        // Test chart control buttons accessibility
        let viewSwitchButtons = ["月次", "年次", "カテゴリ別"]
        
        for buttonTitle in viewSwitchButtons {
            let button = app.buttons[buttonTitle]
            if button.exists {
                XCTAssertTrue(button.isAccessibilityElement)
                XCTAssertNotNil(button.label)
                XCTAssertFalse(button.label.isEmpty)
            }
        }
        
        // Test total amount display accessibility
        let totalAmountLabel = app.staticTexts.matching(identifier: "TotalAmount").element
        if totalAmountLabel.waitForExistence(timeout: 3) {
            XCTAssertTrue(totalAmountLabel.isAccessibilityElement)
            XCTAssertNotNil(totalAmountLabel.label)
            XCTAssertFalse(totalAmountLabel.label.isEmpty)
        }
    }
    
    func testFundSourceAccessibility() throws {
        // Navigate to fund source tab
        let fundSourceTab = app.tabBars.buttons["資金元"]
        XCTAssertTrue(fundSourceTab.waitForExistence(timeout: 5))
        fundSourceTab.tap()
        
        // Test fund source list accessibility
        let fundSourceList = app.tables["FundSourceList"]
        if fundSourceList.waitForExistence(timeout: 5) {
            XCTAssertTrue(fundSourceList.isAccessibilityElement)
            
            // Test individual fund source cells
            let cells = fundSourceList.cells
            if cells.count > 0 {
                let firstCell = cells.element(boundBy: 0)
                XCTAssertTrue(firstCell.isAccessibilityElement)
                XCTAssertNotNil(firstCell.label)
                XCTAssertFalse(firstCell.label.isEmpty)
                
                // Verify cell contains balance information
                let cellLabel = firstCell.label
                XCTAssertTrue(cellLabel.contains("¥") || cellLabel.contains("円") || cellLabel.contains("残高"), 
                             "Fund source cell should contain balance information")
            }
        }
        
        // Test add fund source button accessibility
        let addButton = app.navigationBars.buttons["追加"]
        if addButton.waitForExistence(timeout: 5) {
            XCTAssertTrue(addButton.isAccessibilityElement)
            XCTAssertNotNil(addButton.label)
            XCTAssertFalse(addButton.label.isEmpty)
        }
    }
    
    func testSettingsAccessibility() throws {
        // Navigate to settings tab
        let settingsTab = app.tabBars.buttons["設定"]
        XCTAssertTrue(settingsTab.waitForExistence(timeout: 5))
        settingsTab.tap()
        
        // Test settings list accessibility
        let settingsList = app.tables["SettingsList"]
        if settingsList.waitForExistence(timeout: 5) {
            XCTAssertTrue(settingsList.isAccessibilityElement)
            
            // Test individual setting cells
            let cells = settingsList.cells
            if cells.count > 0 {
                for i in 0..<min(cells.count, 3) { // Test first 3 cells
                    let cell = cells.element(boundBy: i)
                    XCTAssertTrue(cell.isAccessibilityElement)
                    XCTAssertNotNil(cell.label)
                    XCTAssertFalse(cell.label.isEmpty)
                }
            }
        }
    }
    
    func testNavigationAccessibility() throws {
        // Test navigation bar accessibility
        let navigationBars = app.navigationBars
        if navigationBars.count > 0 {
            let firstNavBar = navigationBars.element(boundBy: 0)
            
            // Test navigation title
            let navTitle = firstNavBar.staticTexts.element(boundBy: 0)
            if navTitle.exists {
                XCTAssertTrue(navTitle.isAccessibilityElement)
                XCTAssertNotNil(navTitle.label)
                XCTAssertFalse(navTitle.label.isEmpty)
            }
            
            // Test back button if present
            let backButton = firstNavBar.buttons.element(boundBy: 0)
            if backButton.exists {
                XCTAssertTrue(backButton.isAccessibilityElement)
                XCTAssertNotNil(backButton.label)
            }
        }
    }
    
    func testErrorMessageAccessibility() throws {
        // Navigate to transaction form to test error messages
        let transactionTab = app.tabBars.buttons["取引"]
        XCTAssertTrue(transactionTab.waitForExistence(timeout: 5))
        transactionTab.tap()
        
        let addButton = app.navigationBars.buttons["追加"]
        XCTAssertTrue(addButton.waitForExistence(timeout: 5))
        addButton.tap()
        
        // Enter invalid amount to trigger error
        let amountField = app.textFields["金額を入力"]
        XCTAssertTrue(amountField.waitForExistence(timeout: 5))
        amountField.tap()
        amountField.typeText("invalid")
        
        // Look for error message
        let errorMessage = app.staticTexts["金額が無効です"]
        if errorMessage.waitForExistence(timeout: 3) {
            XCTAssertTrue(errorMessage.isAccessibilityElement)
            XCTAssertNotNil(errorMessage.label)
            XCTAssertFalse(errorMessage.label.isEmpty)
            
            // Verify error message has appropriate accessibility traits
            XCTAssertTrue(errorMessage.accessibilityTraits.contains(.staticText))
        }
    }
    
    func testAccessibilityElementOrdering() throws {
        // Navigate to transaction form
        let transactionTab = app.tabBars.buttons["取引"]
        XCTAssertTrue(transactionTab.waitForExistence(timeout: 5))
        transactionTab.tap()
        
        let addButton = app.navigationBars.buttons["追加"]
        XCTAssertTrue(addButton.waitForExistence(timeout: 5))
        addButton.tap()
        
        // Get all accessibility elements on the form
        let formElements = app.descendants(matching: .any).allElementsBoundByAccessibilityElement
        
        // Verify that form elements are in logical order
        var foundAmount = false
        var foundCategory = false
        var foundFundSource = false
        var foundSave = false
        
        for element in formElements {
            if element.label.contains("金額") {
                foundAmount = true
                XCTAssertFalse(foundSave, "Amount field should come before save button")
            } else if element.label.contains("カテゴリ") {
                foundCategory = true
                XCTAssertTrue(foundAmount, "Category should come after amount")
                XCTAssertFalse(foundSave, "Category should come before save button")
            } else if element.label.contains("資金元") {
                foundFundSource = true
                XCTAssertTrue(foundCategory, "Fund source should come after category")
                XCTAssertFalse(foundSave, "Fund source should come before save button")
            } else if element.label.contains("保存") {
                foundSave = true
                XCTAssertTrue(foundAmount && foundCategory && foundFundSource, 
                             "Save button should come after all form fields")
            }
        }
    }
}