import Foundation

/// Comprehensive error types for the Budget App
enum BudgetAppError: LocalizedError {
    // MARK: - Validation Errors
    case invalidAmount
    case missingCategory
    case missingFundSource
    case insufficientBalance
    case invalidAmountValue
    case formValidation
    
    // MARK: - Transaction Errors
    case transactionCreateFailed(Error)
    case transactionUpdateFailed(Error)
    case transactionDeleteFailed(Error)
    case transactionFetchFailed(Error)
    
    // MARK: - Category Errors
    case categoryCreateFailed(Error)
    case categoryUpdateFailed(Error)
    case categoryDeleteFailed(Error)
    case categoryFetchFailed(Error)
    case categoryPredefinedCheckFailed(Error)
    case categoryPredefinedInitFailed(Error)
    
    // MARK: - Subcategory Errors
    case subcategoryCreateFailed(Error)
    case subcategoryDeleteFailed(Error)
    
    // MARK: - Fund Source Errors
    case fundSourceCreateFailed(Error)
    case fundSourceUpdateFailed(Error)
    case fundSourceDeleteFailed(Error)
    case fundSourceFetchFailed(Error)
    case fundSourceBalanceUpdateFailed(Error)
    case fundSourceBalanceAdjustFailed(Error)
    case fundSourceShareFailed(Error)
    case fundSourceUnshareFailed(Error)
    
    // MARK: - User Account Errors
    case userAccountCreateFailed(Error)
    case userAccountUpdateFailed(Error)
    case userAccountDeleteFailed(Error)
    case userAccountFetchFailed(Error)
    case invalidInput(reason: String)
    
    // MARK: - Chart Errors
    case chartDataFetchFailed(Error)
    case chartCalculationFailed(Error)
    
    // MARK: - Data Persistence Errors
    case dataCorruption
    case syncFailure
    case migrationFailed(Error)
    case dataIntegrityCheckFailed(Error)
    
    // MARK: - LocalizedError Implementation
    var errorDescription: String? {
        switch self {
        // Validation Errors
        case .invalidAmount:
            return "error.invalidAmount".localized
        case .missingCategory:
            return "error.missingCategory".localized
        case .missingFundSource:
            return "error.missingFundSource".localized
        case .insufficientBalance:
            return "error.insufficientBalance".localized
        case .invalidAmountValue:
            return "error.invalidAmountValue".localized
        case .formValidation:
            return "error.formValidation".localized
            
        // Transaction Errors
        case .transactionCreateFailed(let error):
            return "error.transaction.createFailed".localized(with: error.localizedDescription)
        case .transactionUpdateFailed(let error):
            return "error.transaction.updateFailed".localized(with: error.localizedDescription)
        case .transactionDeleteFailed(let error):
            return "error.transaction.deleteFailed".localized(with: error.localizedDescription)
        case .transactionFetchFailed(let error):
            return "error.transaction.fetchFailed".localized(with: error.localizedDescription)
            
        // Category Errors
        case .categoryCreateFailed(let error):
            return "error.category.createFailed".localized(with: error.localizedDescription)
        case .categoryUpdateFailed(let error):
            return "error.category.updateFailed".localized(with: error.localizedDescription)
        case .categoryDeleteFailed(let error):
            return "error.category.deleteFailed".localized(with: error.localizedDescription)
        case .categoryFetchFailed(let error):
            return "error.category.fetchFailed".localized(with: error.localizedDescription)
        case .categoryPredefinedCheckFailed(let error):
            return "error.category.predefinedCheckFailed".localized(with: error.localizedDescription)
        case .categoryPredefinedInitFailed(let error):
            return "error.category.predefinedInitFailed".localized(with: error.localizedDescription)
            
        // Subcategory Errors
        case .subcategoryCreateFailed(let error):
            return "error.subcategory.createFailed".localized(with: error.localizedDescription)
        case .subcategoryDeleteFailed(let error):
            return "error.subcategory.deleteFailed".localized(with: error.localizedDescription)
            
        // Fund Source Errors
        case .fundSourceCreateFailed(let error):
            return "error.fundSource.createFailed".localized(with: error.localizedDescription)
        case .fundSourceUpdateFailed(let error):
            return "error.fundSource.updateFailed".localized(with: error.localizedDescription)
        case .fundSourceDeleteFailed(let error):
            return "error.fundSource.deleteFailed".localized(with: error.localizedDescription)
        case .fundSourceFetchFailed(let error):
            return "error.fundSource.fetchFailed".localized(with: error.localizedDescription)
        case .fundSourceBalanceUpdateFailed(let error):
            return "error.fundSource.balanceUpdateFailed".localized(with: error.localizedDescription)
        case .fundSourceBalanceAdjustFailed(let error):
            return "error.fundSource.balanceAdjustFailed".localized(with: error.localizedDescription)
        case .fundSourceShareFailed(let error):
            return "error.fundSource.shareFailed".localized(with: error.localizedDescription)
        case .fundSourceUnshareFailed(let error):
            return "error.fundSource.unshareFailed".localized(with: error.localizedDescription)
            
        // User Account Errors
        case .userAccountCreateFailed(let error):
            return "error.userAccount.createFailed".localized(with: error.localizedDescription)
        case .userAccountUpdateFailed(let error):
            return "error.userAccount.updateFailed".localized(with: error.localizedDescription)
        case .userAccountDeleteFailed(let error):
            return "error.userAccount.deleteFailed".localized(with: error.localizedDescription)
        case .userAccountFetchFailed(let error):
            return "error.userAccount.fetchFailed".localized(with: error.localizedDescription)
        case .invalidInput(let reason):
            return "error.invalidInput".localized(with: reason)
            
        // Chart Errors
        case .chartDataFetchFailed(let error):
            return "error.chart.dataFetchFailed".localized(with: error.localizedDescription)
        case .chartCalculationFailed(let error):
            return "error.chart.calculationFailed".localized(with: error.localizedDescription)
            
        // Data Persistence Errors
        case .dataCorruption:
            return "error.dataCorruption".localized
        case .syncFailure:
            return "error.syncFailure".localized
        case .migrationFailed(let error):
            return "error.migrationFailed".localized(with: error.localizedDescription)
        case .dataIntegrityCheckFailed(let error):
            return "error.dataIntegrityCheckFailed".localized(with: error.localizedDescription)
        }
    }
    
    var failureReason: String? {
        switch self {
        case .invalidAmount, .invalidAmountValue:
            return "error.reason.invalidAmount".localized
        case .missingCategory:
            return "error.reason.missingCategory".localized
        case .missingFundSource:
            return "error.reason.missingFundSource".localized
        case .insufficientBalance:
            return "error.reason.insufficientBalance".localized
        case .formValidation:
            return "error.reason.formValidation".localized
        case .dataCorruption:
            return "error.reason.dataCorruption".localized
        case .syncFailure:
            return "error.reason.syncFailure".localized
        default:
            return nil
        }
    }
    
    var recoverySuggestion: String? {
        switch self {
        case .invalidAmount, .invalidAmountValue:
            return "error.recovery.invalidAmount".localized
        case .missingCategory:
            return "error.recovery.missingCategory".localized
        case .missingFundSource:
            return "error.recovery.missingFundSource".localized
        case .insufficientBalance:
            return "error.recovery.insufficientBalance".localized
        case .formValidation:
            return "error.recovery.formValidation".localized
        case .dataCorruption:
            return "error.recovery.dataCorruption".localized
        case .syncFailure:
            return "error.recovery.syncFailure".localized
        default:
            return "error.recovery.general".localized
        }
    }
}

// MARK: - Error Conversion Helper
extension BudgetAppError {
    /// Converts a generic Error to a BudgetAppError based on context
    static func from(_ error: Error, context: ErrorContext) -> BudgetAppError {
        switch context {
        case .transactionCreate:
            return .transactionCreateFailed(error)
        case .transactionUpdate:
            return .transactionUpdateFailed(error)
        case .transactionDelete:
            return .transactionDeleteFailed(error)
        case .transactionFetch:
            return .transactionFetchFailed(error)
        case .categoryCreate:
            return .categoryCreateFailed(error)
        case .categoryUpdate:
            return .categoryUpdateFailed(error)
        case .categoryDelete:
            return .categoryDeleteFailed(error)
        case .categoryFetch:
            return .categoryFetchFailed(error)
        case .subcategoryCreate:
            return .subcategoryCreateFailed(error)
        case .subcategoryDelete:
            return .subcategoryDeleteFailed(error)
        case .fundSourceCreate:
            return .fundSourceCreateFailed(error)
        case .fundSourceUpdate:
            return .fundSourceUpdateFailed(error)
        case .fundSourceDelete:
            return .fundSourceDeleteFailed(error)
        case .fundSourceFetch:
            return .fundSourceFetchFailed(error)
        case .fundSourceBalanceUpdate:
            return .fundSourceBalanceUpdateFailed(error)
        case .fundSourceBalanceAdjust:
            return .fundSourceBalanceAdjustFailed(error)
        case .fundSourceShare:
            return .fundSourceShareFailed(error)
        case .fundSourceUnshare:
            return .fundSourceUnshareFailed(error)
        case .userAccountCreate:
            return .userAccountCreateFailed(error)
        case .userAccountUpdate:
            return .userAccountUpdateFailed(error)
        case .userAccountDelete:
            return .userAccountDeleteFailed(error)
        case .userAccountFetch:
            return .userAccountFetchFailed(error)
        case .chartDataFetch:
            return .chartDataFetchFailed(error)
        case .chartCalculation:
            return .chartCalculationFailed(error)
        case .migration:
            return .migrationFailed(error)
        case .dataIntegrityCheck:
            return .dataIntegrityCheckFailed(error)
        }
    }
}

// MARK: - Error Context
enum ErrorContext {
    case transactionCreate, transactionUpdate, transactionDelete, transactionFetch
    case categoryCreate, categoryUpdate, categoryDelete, categoryFetch
    case subcategoryCreate, subcategoryDelete
    case fundSourceCreate, fundSourceUpdate, fundSourceDelete, fundSourceFetch
    case fundSourceBalanceUpdate, fundSourceBalanceAdjust
    case fundSourceShare, fundSourceUnshare
    case userAccountCreate, userAccountUpdate, userAccountDelete, userAccountFetch
    case chartDataFetch, chartCalculation
    case migration, dataIntegrityCheck
}