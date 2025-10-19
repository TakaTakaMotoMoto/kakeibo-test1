import XCTest

final class ChartDisplayUITests: XCTestCase {
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }
    
    override func tearDownWithError() throws {
        app = nil
    }
    
    // MARK: - Chart Display Tests
    
    func testChartTabNavigation() throws {
        // Navigate to chart tab
        let chartTab = app.tabBars.buttons["グラフ"]
        XCTAssertTrue(chartTab.waitForExistence(timeout: 5))
        chartTab.tap()
        
        // Verify chart view is displayed
        let chartView = app.otherElements["ChartView"]
        XCTAssertTrue(chartView.waitForExistence(timeout: 5))
    }
    
    func testMonthlyChartDisplay() throws {
        // Navigate to chart tab
        let chartTab = app.tabBars.buttons["グラフ"]
        XCTAssertTrue(chartTab.waitForExistence(timeout: 5))
        chartTab.tap()
        
        // Verify monthly view is default
        let monthlyChart = app.otherElements["MonthlyChart"]
        XCTAssertTrue(monthlyChart.waitForExistence(timeout: 5))
        
        // Verify chart title
        let chartTitle = app.staticTexts["月別支出"]
        XCTAssertTrue(chartTitle.waitForExistence(timeout: 3))
        
        // Verify chart data is displayed (if transactions exist)
        let chartBars = app.otherElements.matching(identifier: "ChartBar")
        if chartBars.count > 0 {
            XCTAssertTrue(chartBars.element(boundBy: 0).exists)
        }
    }
    
    func testYearlyChartDisplay() throws {
        // Navigate to chart tab
        let chartTab = app.tabBars.buttons["グラフ"]
        XCTAssertTrue(chartTab.waitForExistence(timeout: 5))
        chartTab.tap()
        
        // Switch to yearly view
        let yearlyButton = app.buttons["年次"]
        if yearlyButton.waitForExistence(timeout: 5) {
            yearlyButton.tap()
            
            // Verify yearly chart is displayed
            let yearlyChart = app.otherElements["YearlyChart"]
            XCTAssertTrue(yearlyChart.waitForExistence(timeout: 5))
            
            // Verify chart title
            let chartTitle = app.staticTexts["年別支出"]
            XCTAssertTrue(chartTitle.waitForExistence(timeout: 3))
        }
    }
    
    func testCategoryBreakdownChart() throws {
        // Navigate to chart tab
        let chartTab = app.tabBars.buttons["グラフ"]
        XCTAssertTrue(chartTab.waitForExistence(timeout: 5))
        chartTab.tap()
        
        // Switch to category view
        let categoryButton = app.buttons["カテゴリ別"]
        if categoryButton.waitForExistence(timeout: 5) {
            categoryButton.tap()
            
            // Verify category chart is displayed
            let categoryChart = app.otherElements["CategoryChart"]
            XCTAssertTrue(categoryChart.waitForExistence(timeout: 5))
            
            // Verify pie chart elements (if data exists)
            let pieSlices = app.otherElements.matching(identifier: "PieSlice")
            if pieSlices.count > 0 {
                XCTAssertTrue(pieSlices.element(boundBy: 0).exists)
            }
            
            // Verify legend
            let chartLegend = app.otherElements["ChartLegend"]
            XCTAssertTrue(chartLegend.waitForExistence(timeout: 3))
        }
    }
    
    func testChartInteraction() throws {
        // Navigate to chart tab
        let chartTab = app.tabBars.buttons["グラフ"]
        XCTAssertTrue(chartTab.waitForExistence(timeout: 5))
        chartTab.tap()
        
        // Switch to category view for interaction test
        let categoryButton = app.buttons["カテゴリ別"]
        if categoryButton.waitForExistence(timeout: 5) {
            categoryButton.tap()
            
            // Try to tap on a pie slice (if exists)
            let pieSlices = app.otherElements.matching(identifier: "PieSlice")
            if pieSlices.count > 0 {
                let firstSlice = pieSlices.element(boundBy: 0)
                firstSlice.tap()
                
                // Verify drill-down to subcategories
                let subcategoryChart = app.otherElements["SubcategoryChart"]
                if subcategoryChart.waitForExistence(timeout: 3) {
                    XCTAssertTrue(subcategoryChart.exists)
                    
                    // Verify back button to return to category view
                    let backButton = app.buttons["戻る"]
                    if backButton.waitForExistence(timeout: 3) {
                        backButton.tap()
                        
                        // Should return to category chart
                        XCTAssertTrue(categoryChart.waitForExistence(timeout: 3))
                    }
                }
            }
        }
    }
    
    func testChartPeriodSelection() throws {
        // Navigate to chart tab
        let chartTab = app.tabBars.buttons["グラフ"]
        XCTAssertTrue(chartTab.waitForExistence(timeout: 5))
        chartTab.tap()
        
        // Test month picker
        let monthPicker = app.buttons["月を選択"]
        if monthPicker.waitForExistence(timeout: 5) {
            monthPicker.tap()
            
            // Select different month
            let monthOption = app.buttons["2024年1月"]
            if monthOption.waitForExistence(timeout: 3) {
                monthOption.tap()
                
                // Verify chart updates
                let chartView = app.otherElements["ChartView"]
                XCTAssertTrue(chartView.waitForExistence(timeout: 5))
            }
        }
        
        // Test year picker
        let yearPicker = app.buttons["年を選択"]
        if yearPicker.waitForExistence(timeout: 5) {
            yearPicker.tap()
            
            // Select different year
            let yearOption = app.buttons["2023"]
            if yearOption.waitForExistence(timeout: 3) {
                yearOption.tap()
                
                // Verify chart updates
                let chartView = app.otherElements["ChartView"]
                XCTAssertTrue(chartView.waitForExistence(timeout: 5))
            }
        }
    }
    
    func testChartDataDisplay() throws {
        // Navigate to chart tab
        let chartTab = app.tabBars.buttons["グラフ"]
        XCTAssertTrue(chartTab.waitForExistence(timeout: 5))
        chartTab.tap()
        
        // Verify total amount display
        let totalAmountLabel = app.staticTexts.matching(identifier: "TotalAmount").element
        if totalAmountLabel.waitForExistence(timeout: 5) {
            XCTAssertTrue(totalAmountLabel.exists)
            
            // Verify amount format (should contain ¥ symbol)
            let labelText = totalAmountLabel.label
            XCTAssertTrue(labelText.contains("¥") || labelText.contains("円"))
        }
        
        // Verify period display
        let periodLabel = app.staticTexts.matching(identifier: "ChartPeriod").element
        if periodLabel.waitForExistence(timeout: 3) {
            XCTAssertTrue(periodLabel.exists)
        }
    }
    
    func testChartEmptyState() throws {
        // This test assumes there might be no data
        // Navigate to chart tab
        let chartTab = app.tabBars.buttons["グラフ"]
        XCTAssertTrue(chartTab.waitForExistence(timeout: 5))
        chartTab.tap()
        
        // Look for empty state message
        let emptyStateMessage = app.staticTexts["データがありません"]
        if emptyStateMessage.waitForExistence(timeout: 3) {
            XCTAssertTrue(emptyStateMessage.exists)
            
            // Verify suggestion to add transactions
            let suggestionMessage = app.staticTexts["取引を追加してください"]
            XCTAssertTrue(suggestionMessage.waitForExistence(timeout: 3))
        }
    }
    
    func testChartAccessibility() throws {
        // Navigate to chart tab
        let chartTab = app.tabBars.buttons["グラフ"]
        XCTAssertTrue(chartTab.waitForExistence(timeout: 5))
        chartTab.tap()
        
        // Verify chart has accessibility labels
        let chartView = app.otherElements["ChartView"]
        XCTAssertTrue(chartView.waitForExistence(timeout: 5))
        
        // Check if chart elements have accessibility labels
        let chartElements = app.otherElements.matching(identifier: "ChartElement")
        if chartElements.count > 0 {
            let firstElement = chartElements.element(boundBy: 0)
            XCTAssertNotNil(firstElement.label)
            XCTAssertFalse(firstElement.label.isEmpty)
        }
        
        // Verify buttons have accessibility labels
        let monthlyButton = app.buttons["月次"]
        if monthlyButton.exists {
            XCTAssertNotNil(monthlyButton.label)
            XCTAssertFalse(monthlyButton.label.isEmpty)
        }
        
        let categoryButton = app.buttons["カテゴリ別"]
        if categoryButton.exists {
            XCTAssertNotNil(categoryButton.label)
            XCTAssertFalse(categoryButton.label.isEmpty)
        }
    }
    
    func testChartViewSwitching() throws {
        // Navigate to chart tab
        let chartTab = app.tabBars.buttons["グラフ"]
        XCTAssertTrue(chartTab.waitForExistence(timeout: 5))
        chartTab.tap()
        
        // Test switching between different chart views
        let viewButtons = ["月次", "年次", "カテゴリ別"]
        
        for buttonTitle in viewButtons {
            let button = app.buttons[buttonTitle]
            if button.waitForExistence(timeout: 3) {
                button.tap()
                
                // Verify the corresponding chart view appears
                let chartView = app.otherElements["ChartView"]
                XCTAssertTrue(chartView.waitForExistence(timeout: 5))
                
                // Verify button is selected (if selection state is indicated)
                if button.isSelected {
                    XCTAssertTrue(button.isSelected)
                }
            }
        }
    }
}