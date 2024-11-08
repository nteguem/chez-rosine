const Category = require("../models/category.model");
const logService = require('./log.service');

// Création d'une catégorie
async function createCategory(categoryData, client) {
  try {
    const newCategory = new Category(categoryData);
    const category = await newCategory.save();
    return { success: true, category, message: "Category created successfully." };
  } catch (error) {
    await logService.addLog(
      `${error.message}`,
      'createCategory',
      'error'
    );
    return {
      success: false,
      message: "An error occurred while creating the category.",
      error: error.message,
    };
  }
}

// Mise à jour d'une catégorie
async function updateCategory(categoryId, updatedData, client) {
  try {
    const category = await Category.findByIdAndUpdate(
      categoryId,
      { $set: updatedData },
      { new: true }
    );
    if (category) {
      return { success: true, category, message: "Category updated successfully." };
    } else {
      return { success: false, message: "Category not found." };
    }
  } catch (error) {
    await logService.addLog(
      `${error.message}`,
      'updateCategory',
      'error'
    );
    return {
      success: false,
      message: "An error occurred while updating the category.",
      error: error.message,
    };
  }
}

// Suppression d'une catégorie
async function deleteCategory(categoryId, client) {
  try {
    const deletedCategory = await Category.findByIdAndDelete(categoryId);
    if (deletedCategory) {
      return { success: true, message: "Category deleted successfully.", category: deletedCategory };
    } else {
      return { success: false, message: "Category not found." };
    }
  } catch (error) {
    await logService.addLog(
      `${error.message}`,
      'deleteCategory',
      'error'
    );
    return {
      success: false,
      message: "An error occurred while deleting the category.",
      error: error.message,
    };
  }
}

// Liste des catégories avec pagination
async function listCategories(limit = 10, offset = 0, client) {
  try {
    // Vérifiez si limit et offset sont des entiers valides
    limit = Math.max(1, parseInt(limit, 10)); // Minimum 1 pour éviter une limite nulle
    offset = Math.max(0, parseInt(offset, 10)); // Minimum 0 pour l'offset

    // Comptez le total des catégories de manière efficace
    const totalCount = await Category.countDocuments();

    // Récupérez les catégories avec limit et offset
    const categories = await Category.find()
      .limit(limit)
      .skip(offset)
      .exec(); // Utilisez exec() pour exécuter la requête

    return {
      success: true,
      total: totalCount,
      categories,
    };
  } catch (error) {
    await logService.addLog(
      `${error.message}`,
      'listCategories',
      'error'
    );
    return {
      success: false,
      message: "An error occurred while fetching the category list.",
      error: error.message,
    };
  }
}

// Récupérer une catégorie par ID
async function getCategoryById(categoryId, client) {
  try {
    const category = await Category.findById(categoryId);
    if (category) {
      return { success: true, category };
    } else {
      return { success: false, message: "Category not found." };
    }
  } catch (error) {
    await logService.addLog(
      `${error.message}`,
      'getCategoryById',
      'error'
    );
    return {
      success: false,
      message: "An error occurred while retrieving the category.",
      error: error.message,
    };
  }
}

// Récupérer une catégorie par nom
async function getCategoryByName(categoryName) {
  try {
    const category = await Category.findOne({ name: categoryName });
    if (category) {
      return { success: true, category };
    } else {
      return { success: false, message: "Category not found." };
    }
  } catch (error) {
    await logService.addLog(
      `${error.message}`,
      'getCategoryByName',
      'error'
    );
    return {
      success: false,
      message: "An error occurred while retrieving the category by name.",
      error: error.message,
    };
  }
}


module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  listCategories,
  getCategoryById,
  getCategoryByName
};
