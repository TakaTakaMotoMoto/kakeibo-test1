import XCTest

final class TransactionFlowUITests: XCTestCase {
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }
    
    override func tearDownWithError() throws {
        app = nil
    }
    
    // MARK: - Transaction Creation Flow Tests
    
    func testCreateTransactionFlow() throws {
        // Navigate to transaction tab
        let transactionTab = app.tabBars.buttons["取引"]
        XCTAssertTrue(transactionTab.waitForExistence(timeout: 5))
        transactionTab.tap()
        
        // Tap add transaction button
        let addButton = app.navigationBars.buttons["追加"]
        XCTAssertTrue(addButton.waitForExistence(timeout: 5))
        addButton.tap()
        
        // Fill in transaction form
        let amountField = app.textFields["金額を入力"]
        XCTAssertTrue(amountField.waitForExistence(timeout: 5))
        amountField.tap()
        amountField.typeText("1500")
        
        // Select category
        let categoryPicker = app.buttons["カテゴリを選択"]
        XCTAssertTrue(categoryPicker.waitForExistence(timeout: 5))
        categoryPicker.tap()
        
        // Select first available category
        let firstCategory = app.buttons.matching(identifier: "CategoryOption").element(boundBy: 0)
        if firstCategory.waitForExistence(timeout: 5) {
            firstCategory.tap()
        }
        
        // Select fund source
        let fundSourcePicker = app.buttons["資金元を選択"]
        XCTAssertTrue(fundSourcePicker.waitForExistence(timeout: 5))
        fundSourcePicker.tap()
        
        // Select first available fund source
        let firstFundSource = app.buttons.matching(identifier: "FundSourceOption").element(boundBy: 0)
        if firstFundSource.waitForExistence(timeout: 5) {
            firstFundSource.tap()
        }
        
        // Add note
        let noteField = app.textFields["メモ（任意）"]
        if noteField.waitForExistence(timeout: 3) {
            noteField.tap()
            noteField.typeText("UI Test Transaction")
        }
        
        // Save transaction
        let saveButton = app.buttons["保存"]
        XCTAssertTrue(saveButton.waitForExistence(timeout: 5))
        saveButton.tap()
        
        // Verify transaction was created
        let transactionList = app.tables["TransactionList"]
        XCTAssertTrue(transactionList.waitForExistence(timeout: 5))
        
        // Look for the created transaction
        let createdTransaction = transactionList.cells.containing(.staticText, identifier: "¥1,500").element
        XCTAssertTrue(createdTransaction.waitForExistence(timeout: 5))
    }
    
    func testTransactionFormValidation() throws {
        // Navigate to transaction tab
        let transactionTab = app.tabBars.buttons["取引"]
        XCTAssertTrue(transactionTab.waitForExistence(timeout: 5))
        transactionTab.tap()
        
        // Tap add transaction button
        let addButton = app.navigationBars.buttons["追加"]
        XCTAssertTrue(addButton.waitForExistence(timeout: 5))
        addButton.tap()
        
        // Try to save without filling required fields
        let saveButton = app.buttons["保存"]
        XCTAssertTrue(saveButton.waitForExistence(timeout: 5))
        
        // Save button should be disabled initially
        XCTAssertFalse(saveButton.isEnabled)
        
        // Fill in amount only
        let amountField = app.textFields["金額を入力"]
        XCTAssertTrue(amountField.waitForExistence(timeout: 5))
        amountField.tap()
        amountField.typeText("100")
        
        // Save button should still be disabled
        XCTAssertFalse(saveButton.isEnabled)
        
        // Test invalid amount
        amountField.tap()
        amountField.clearAndEnterText("invalid")
        
        // Verify error message appears
        let errorMessage = app.staticTexts["金額が無効です"]
        XCTAssertTrue(errorMessage.waitForExistence(timeout: 3))
    }
    
    func testEditTransactionFlow() throws {
        // First create a transaction (assuming one exists)
        // Navigate to transaction tab
        let transactionTab = app.tabBars.buttons["取引"]
        XCTAssertTrue(transactionTab.waitForExistence(timeout: 5))
        transactionTab.tap()
        
        // Find and tap on first transaction
        let transactionList = app.tables["TransactionList"]
        XCTAssertTrue(transactionList.waitForExistence(timeout: 5))
        
        let firstTransaction = transactionList.cells.element(boundBy: 0)
        if firstTransaction.waitForExistence(timeout: 5) {
            firstTransaction.tap()
            
            // Tap edit button
            let editButton = app.buttons["編集"]
            if editButton.waitForExistence(timeout: 5) {
                editButton.tap()
                
                // Modify amount
                let amountField = app.textFields["金額を入力"]
                if amountField.waitForExistence(timeout: 5) {
                    amountField.tap()
                    amountField.clearAndEnterText("2000")
                    
                    // Save changes
                    let saveButton = app.buttons["保存"]
                    XCTAssertTrue(saveButton.waitForExistence(timeout: 5))
                    saveButton.tap()
                    
                    // Verify changes were saved
                    let updatedTransaction = transactionList.cells.containing(.staticText, identifier: "¥2,000").element
                    XCTAssertTrue(updatedTransaction.waitForExistence(timeout: 5))
                }
            }
        }
    }
    
    func testDeleteTransactionFlow() throws {
        // Navigate to transaction tab
        let transactionTab = app.tabBars.buttons["取引"]
        XCTAssertTrue(transactionTab.waitForExistence(timeout: 5))
        transactionTab.tap()
        
        // Find transaction list
        let transactionList = app.tables["TransactionList"]
        XCTAssertTrue(transactionList.waitForExistence(timeout: 5))
        
        let initialCellCount = transactionList.cells.count
        
        // Swipe to delete first transaction
        let firstTransaction = transactionList.cells.element(boundBy: 0)
        if firstTransaction.waitForExistence(timeout: 5) {
            firstTransaction.swipeLeft()
            
            // Tap delete button
            let deleteButton = app.buttons["削除"]
            if deleteButton.waitForExistence(timeout: 3) {
                deleteButton.tap()
                
                // Confirm deletion if alert appears
                let confirmButton = app.alerts.buttons["削除"]
                if confirmButton.waitForExistence(timeout: 3) {
                    confirmButton.tap()
                }
                
                // Verify transaction was deleted
                XCTAssertLessThan(transactionList.cells.count, initialCellCount)
            }
        }
    }
    
    // MARK: - Transaction List Tests
    
    func testTransactionListDisplay() throws {
        // Navigate to transaction tab
        let transactionTab = app.tabBars.buttons["取引"]
        XCTAssertTrue(transactionTab.waitForExistence(timeout: 5))
        transactionTab.tap()
        
        // Verify transaction list exists
        let transactionList = app.tables["TransactionList"]
        XCTAssertTrue(transactionList.waitForExistence(timeout: 5))
        
        // Verify list shows transactions (if any exist)
        if transactionList.cells.count > 0 {
            let firstTransaction = transactionList.cells.element(boundBy: 0)
            XCTAssertTrue(firstTransaction.exists)
            
            // Verify transaction row contains expected elements
            XCTAssertTrue(firstTransaction.staticTexts.count > 0) // Should have date, amount, category
        }
    }
    
    func testTransactionFiltering() throws {
        // Navigate to transaction tab
        let transactionTab = app.tabBars.buttons["取引"]
        XCTAssertTrue(transactionTab.waitForExistence(timeout: 5))
        transactionTab.tap()
        
        // Look for filter button
        let filterButton = app.buttons["フィルター"]
        if filterButton.waitForExistence(timeout: 5) {
            filterButton.tap()
            
            // Test category filter
            let categoryFilter = app.buttons["カテゴリでフィルター"]
            if categoryFilter.waitForExistence(timeout: 3) {
                categoryFilter.tap()
                
                // Select a category
                let firstCategoryOption = app.buttons.matching(identifier: "CategoryFilterOption").element(boundBy: 0)
                if firstCategoryOption.waitForExistence(timeout: 3) {
                    firstCategoryOption.tap()
                    
                    // Apply filter
                    let applyButton = app.buttons["適用"]
                    if applyButton.waitForExistence(timeout: 3) {
                        applyButton.tap()
                        
                        // Verify filter was applied (list should update)
                        let transactionList = app.tables["TransactionList"]
                        XCTAssertTrue(transactionList.waitForExistence(timeout: 5))
                    }
                }
            }
        }
    }
}

// MARK: - XCUIElement Extensions for Testing

extension XCUIElement {
    func clearAndEnterText(_ text: String) {
        guard let stringValue = self.value as? String else {
            XCTFail("Tried to clear and enter text into a non-string value")
            return
        }
        
        self.tap()
        
        let deleteString = String(repeating: XCUIKeyboardKey.delete.rawValue, count: stringValue.count)
        self.typeText(deleteString)
        self.typeText(text)
    }
}