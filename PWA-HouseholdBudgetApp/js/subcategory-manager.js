// Subcategory Manager - Handles all subcategory-related operations
class SubcategoryManager {
    constructor(storage) {
        this.storage = storage;
    }

    // Core subcategory operations
    getSubcategories(categoryId = null) {
        const subcategories = this.storage.getSubcategories();
        if (categoryId) {
            return subcategories.filter(sc => sc.categoryId === categoryId);
        }
        return subcategories;
    }

    addSubcategory(subcategoryData) {
        // Validate input data
        const validationErrors = this.validateSubcategory(subcategoryData);
        if (validationErrors.length > 0) {
            throw new Error(`Subcategory validation failed: ${validationErrors.join(', ')}`);
        }

        // Normalize the name
        const normalizedName = subcategoryData.name.trim();

        // Check for duplicate names within the same category (case-insensitive)
        const existingSubcategories = this.getSubcategories(subcategoryData.categoryId);
        const isDuplicate = existingSubcategories.some(sc =>
            sc.name.toLowerCase().trim() === normalizedName.toLowerCase()
        );

        if (isDuplicate) {
            throw new Error('同じカテゴリ内に同じ名前のサブカテゴリが既に存在します');
        }

        // Create the subcategory with normalized name
        const subcategoryToAdd = {
            ...subcategoryData,
            name: normalizedName
        };

        return this.storage.addSubcategory(subcategoryToAdd);
    }

    updateSubcategory(id, updates) {
        // Validate input
        if (!id) {
            throw new Error('サブカテゴリIDが指定されていません');
        }

        // Get existing subcategory
        const subcategories = this.storage.getSubcategories();
        const existingSubcategory = subcategories.find(sc => sc.id === id);
        if (!existingSubcategory) {
            throw new Error('更新対象のサブカテゴリが見つかりません');
        }

        // Validate updated data
        const updatedData = { ...existingSubcategory, ...updates };
        const validationErrors = this.validateSubcategory(updatedData);
        if (validationErrors.length > 0) {
            throw new Error(`Subcategory validation failed: ${validationErrors.join(', ')}`);
        }

        // Check for duplicate names if name is being updated
        if (updates.name) {
            const normalizedName = updates.name.trim();

            if (!normalizedName) {
                throw new Error('サブカテゴリ名を入力してください');
            }

            const existingSubcategories = this.getSubcategories(existingSubcategory.categoryId);
            const isDuplicate = existingSubcategories.some(sc =>
                sc.id !== id && sc.name.toLowerCase().trim() === normalizedName.toLowerCase()
            );

            if (isDuplicate) {
                throw new Error('同じカテゴリ内に同じ名前のサブカテゴリが既に存在します');
            }

            // Normalize the name in updates
            updates = {
                ...updates,
                name: normalizedName
            };
        }

        return this.storage.updateSubcategory(id, updates);
    }

    deleteSubcategory(id) {
        // Check if subcategory is being used by transactions
        if (!this.canDeleteSubcategory(id)) {
            throw new Error('このサブカテゴリは取引で使用されているため削除できません');
        }

        return this.storage.deleteSubcategory(id);
    }

    canDeleteSubcategory(id) {
        const transactions = this.storage.getTransactions();
        return !transactions.some(t => t.subcategoryId === id);
    }

    // Subcategory validation
    validateSubcategory(subcategoryData) {
        const errors = [];

        // Required fields validation
        if (!subcategoryData.name || typeof subcategoryData.name !== 'string' || subcategoryData.name.trim() === '') {
            errors.push('サブカテゴリ名を入力してください');
        }

        if (!subcategoryData.categoryId) {
            errors.push('カテゴリが選択されていません');
        }

        // Business logic validation
        if (subcategoryData.name && subcategoryData.name.trim().length > 30) {
            errors.push('サブカテゴリ名は30文字以内で入力してください');
        }

        // Validate category exists
        if (subcategoryData.categoryId) {
            const categories = this.storage.getCategories();
            const categoryExists = categories.some(c => c.id === subcategoryData.categoryId);
            if (!categoryExists) {
                errors.push('指定されたカテゴリが存在しません');
            }
        }

        return errors;
    }

    // Query methods
    getSubcategoriesByCategory(categoryId) {
        return this.getSubcategories(categoryId);
    }

    getSubcategoryById(id) {
        const subcategories = this.storage.getSubcategories();
        return subcategories.find(sc => sc.id === id) || null;
    }

    getSubcategoryWithCategory(id) {
        const subcategory = this.getSubcategoryById(id);
        if (!subcategory) return null;

        const categories = this.storage.getCategories();
        const category = categories.find(c => c.id === subcategory.categoryId);

        return {
            ...subcategory,
            category: category || null
        };
    }

    searchSubcategories(query) {
        const subcategories = this.storage.getSubcategories();
        const normalizedQuery = query.toLowerCase().trim();

        return subcategories.filter(sc =>
            sc.name.toLowerCase().includes(normalizedQuery)
        );
    }

    // Statistics methods
    getSubcategoryStatistics() {
        const subcategories = this.storage.getSubcategories();
        const transactions = this.storage.getTransactions();
        const categories = this.storage.getCategories();

        const stats = {
            total: subcategories.length,
            byCategory: {},
            usageCounts: {},
            unused: []
        };

        // Initialize category stats
        categories.forEach(category => {
            stats.byCategory[category.id] = {
                category: category,
                count: 0,
                subcategories: []
            };
        });

        // Count subcategories by category and usage
        subcategories.forEach(sc => {
            // Count by category
            if (stats.byCategory[sc.categoryId]) {
                stats.byCategory[sc.categoryId].count++;
                stats.byCategory[sc.categoryId].subcategories.push(sc);
            }

            // Count usage in transactions
            const usageCount = transactions.filter(t => t.subcategoryId === sc.id).length;
            stats.usageCounts[sc.id] = usageCount;

            // Track unused subcategories
            if (usageCount === 0) {
                stats.unused.push(sc);
            }
        });

        return stats;
    }

    getSubcategoryUsage(id) {
        const transactions = this.storage.getTransactions();
        const relatedTransactions = transactions.filter(t => t.subcategoryId === id);

        return {
            count: relatedTransactions.length,
            totalAmount: relatedTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0),
            transactions: relatedTransactions
        };
    }

    // Bulk operations
    addMultipleSubcategories(subcategoriesData) {
        const results = [];
        const errors = [];

        for (const subcategoryData of subcategoriesData) {
            try {
                const subcategory = this.addSubcategory(subcategoryData);
                results.push({
                    success: true,
                    subcategory: subcategory,
                    data: subcategoryData
                });
            } catch (error) {
                errors.push({
                    success: false,
                    error: error.message,
                    data: subcategoryData
                });
            }
        }

        return {
            successful: results,
            failed: errors,
            totalProcessed: subcategoriesData.length,
            successCount: results.length,
            errorCount: errors.length
        };
    }

    deleteMultipleSubcategories(ids) {
        const results = [];
        const errors = [];

        for (const id of ids) {
            try {
                const success = this.deleteSubcategory(id);
                results.push({
                    success: success,
                    id: id
                });
            } catch (error) {
                errors.push({
                    success: false,
                    error: error.message,
                    id: id
                });
            }
        }

        return {
            successful: results,
            failed: errors,
            totalProcessed: ids.length,
            successCount: results.length,
            errorCount: errors.length
        };
    }

    // Import/Export methods
    exportSubcategories(categoryId = null) {
        const subcategories = categoryId ? 
            this.getSubcategories(categoryId) : 
            this.storage.getSubcategories();

        const categories = this.storage.getCategories();

        return subcategories.map(sc => {
            const category = categories.find(c => c.id === sc.categoryId);
            return {
                id: sc.id,
                name: sc.name,
                categoryId: sc.categoryId,
                categoryName: category ? category.name : 'Unknown',
                createdAt: sc.createdAt,
                updatedAt: sc.updatedAt
            };
        });
    }

    importSubcategories(subcategoriesData, options = {}) {
        const { 
            skipDuplicates = true, 
            updateExisting = false,
            createMissingCategories = false 
        } = options;

        const results = [];
        const errors = [];
        const categories = this.storage.getCategories();

        for (const data of subcategoriesData) {
            try {
                // Validate category exists
                if (!categories.some(c => c.id === data.categoryId)) {
                    if (createMissingCategories && data.categoryName) {
                        // Create missing category (simplified)
                        const newCategory = {
                            id: this.storage.generateId(),
                            name: data.categoryName,
                            icon: '📁',
                            color: '#999999'
                        };
                        categories.push(newCategory);
                        this.storage.setCategories(categories);
                    } else {
                        throw new Error(`Category ${data.categoryId} not found`);
                    }
                }

                // Check for existing subcategory
                const existing = this.storage.getSubcategories().find(sc => 
                    sc.name.toLowerCase() === data.name.toLowerCase() && 
                    sc.categoryId === data.categoryId
                );

                if (existing) {
                    if (skipDuplicates) {
                        results.push({
                            success: true,
                            action: 'skipped',
                            subcategory: existing,
                            data: data
                        });
                        continue;
                    } else if (updateExisting) {
                        const updated = this.updateSubcategory(existing.id, {
                            name: data.name
                        });
                        results.push({
                            success: true,
                            action: 'updated',
                            subcategory: updated,
                            data: data
                        });
                        continue;
                    } else {
                        throw new Error('Duplicate subcategory found');
                    }
                }

                // Create new subcategory
                const subcategory = this.addSubcategory({
                    name: data.name,
                    categoryId: data.categoryId
                });

                results.push({
                    success: true,
                    action: 'created',
                    subcategory: subcategory,
                    data: data
                });

            } catch (error) {
                errors.push({
                    success: false,
                    error: error.message,
                    data: data
                });
            }
        }

        return {
            successful: results,
            failed: errors,
            totalProcessed: subcategoriesData.length,
            successCount: results.length,
            errorCount: errors.length
        };
    }

    // Utility methods
    getSubcategoryDisplayName(id) {
        const subcategory = this.getSubcategoryById(id);
        return subcategory ? subcategory.name : '不明なサブカテゴリ';
    }

    getSubcategoryFullName(id) {
        const subcategoryWithCategory = this.getSubcategoryWithCategory(id);
        if (!subcategoryWithCategory) return '不明なサブカテゴリ';

        const categoryName = subcategoryWithCategory.category ? 
            subcategoryWithCategory.category.name : 
            '不明なカテゴリ';

        return `${categoryName} > ${subcategoryWithCategory.name}`;
    }

    // Cleanup methods
    cleanupUnusedSubcategories() {
        const stats = this.getSubcategoryStatistics();
        const unusedIds = stats.unused.map(sc => sc.id);

        if (unusedIds.length === 0) {
            return {
                cleaned: 0,
                subcategories: []
            };
        }

        const result = this.deleteMultipleSubcategories(unusedIds);
        
        return {
            cleaned: result.successCount,
            subcategories: stats.unused,
            errors: result.failed
        };
    }

    // Validation methods
    validateSubcategoryIntegrity() {
        const subcategories = this.storage.getSubcategories();
        const categories = this.storage.getCategories();
        const transactions = this.storage.getTransactions();

        const issues = [];

        subcategories.forEach(sc => {
            // Check if category exists
            const categoryExists = categories.some(c => c.id === sc.categoryId);
            if (!categoryExists) {
                issues.push({
                    type: 'missing_category',
                    subcategory: sc,
                    message: `Subcategory "${sc.name}" references non-existent category ${sc.categoryId}`
                });
            }

            // Check for duplicate names within same category
            const duplicates = subcategories.filter(other => 
                other.id !== sc.id && 
                other.categoryId === sc.categoryId && 
                other.name.toLowerCase() === sc.name.toLowerCase()
            );

            if (duplicates.length > 0) {
                issues.push({
                    type: 'duplicate_name',
                    subcategory: sc,
                    duplicates: duplicates,
                    message: `Subcategory "${sc.name}" has duplicates in the same category`
                });
            }
        });

        // Check for orphaned transaction references
        transactions.forEach(t => {
            if (t.subcategoryId) {
                const subcategoryExists = subcategories.some(sc => sc.id === t.subcategoryId);
                if (!subcategoryExists) {
                    issues.push({
                        type: 'orphaned_reference',
                        transaction: t,
                        message: `Transaction references non-existent subcategory ${t.subcategoryId}`
                    });
                }
            }
        });

        return {
            isValid: issues.length === 0,
            issues: issues,
            subcategoryCount: subcategories.length,
            checkedTransactions: transactions.length
        };
    }
}

// Export for global use
window.SubcategoryManager = SubcategoryManager;