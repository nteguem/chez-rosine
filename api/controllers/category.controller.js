const categoryService = require('../services/category.service');
const ResponseService = require('../services/response.service');

const createCategory = async (req, res, client) => {
  const categoryData = req.body;
  const response = await categoryService.createCategory(categoryData, client);
  if (response.success) {
    return ResponseService.success(res, { category: response.category, message: response.message });
  } else {
    return ResponseService.internalServerError(res, { error: response.message });
  }
};

const updateCategory = async (req, res, client) => {
  const categoryId = req.params.categoryId;
  const updatedData = req.body;
  const response = await categoryService.updateCategory(categoryId, updatedData, client);
  if (response.success) {
    return ResponseService.success(res, { category: response.category, message: response.message });
  } else {
    return ResponseService.notFound(res, { message: response.message });
  }
};

const deleteCategory = async (req, res, client) => {
  const categoryId = req.params.categoryId;
  const response = await categoryService.deleteCategory(categoryId, client);
  if (response.success) {
    return ResponseService.success(res, { category: response.category, message: response.message });
  } else {
    return ResponseService.notFound(res, { message: response.message });
  }
};

const listCategories = async (req, res, client) => {
    const { limit, offset } = req.query; // Récupérer limit et offset des paramètres de requête
    const response = await categoryService.listCategories(limit, offset, client); // Passer limit et offset au service
    if (response.success) {
      return ResponseService.success(res, {
        categories: response.categories,
        total: response.total,
      });
    } else {
      return ResponseService.internalServerError(res, { error: response.message });
    }
  };
  

const getCategoryById = async (req, res, client) => {
  const categoryId = req.params.categoryId;
  const response = await categoryService.getCategoryById(categoryId, client);
  if (response.success) {
    return ResponseService.success(res, { category: response.category });
  } else {
    return ResponseService.notFound(res, { message: response.message });
  }
};

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  listCategories,
  getCategoryById,
};
