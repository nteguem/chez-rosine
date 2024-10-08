const productService = require('../services/product.service');
const ResponseService = require('../services/response.service');

const createProduct = async (req, res, client) => {
  const productData = req.body;
  const response = await productService.createProduct(productData, client);
  if (response.success) {
    return ResponseService.success(res, { product: response.product, message: response.message });
  } else {
    return ResponseService.internalServerError(res, { error: response.message });
  }
};

const updateProduct = async (req, res, client) => {
  const productId = req.params.productId;
  const updatedData = req.body;
  const response = await productService.updateProduct(productId, updatedData, client);
  if (response.success) {
    return ResponseService.success(res, { product: response.product, message: response.message });
  } else {
    return ResponseService.notFound(res, { message: response.message });
  }
};

const deleteProduct = async (req, res, client) => {
  const productId = req.params.productId;
  const response = await productService.deleteProduct(productId, client);
  if (response.success) {
    return ResponseService.success(res, { product: response.product, message: response.message });
  } else {
    return ResponseService.notFound(res, { message: response.message });
  }
};

// Liste de tous les produits ou récupérer les produits par catégorie
const listProducts = async (req, res, client) => {
    const categoryId = req.query.categoryId; // Vérifiez si categoryId est présent dans les paramètres de requête
    const { limit, offset } = req.query; // Récupérer limit et offset des paramètres de requête
    const response = await productService.listProducts(categoryId || null, limit, offset, client); // Passer categoryId, limit et offset au service
    if (response.success) {
        return ResponseService.success(res, {
            products: response.products,
            total: response.total,
        });
    } else {
        return ResponseService.internalServerError(res, { error: response.message });
    }
};

  

const getProductById = async (req, res, client) => {
  const productId = req.params.productId;
  const response = await productService.getProductById(productId, client);
  if (response.success) {
    return ResponseService.success(res, { product: response.product });
  } else {
    return ResponseService.notFound(res, { message: response.message });
  }
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  listProducts,
  getProductById
};
