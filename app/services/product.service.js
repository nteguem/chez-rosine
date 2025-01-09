const Product = require("../models/product.model");
const logService = require('./log.service');

// Création d'un produit
async function createProduct(productData, client) {
  try {
    const newProduct = new Product(productData);
    const product = await newProduct.save();
    return { success: true, product, message: "Product created successfully." };
  } catch (error) {
    await logService.addLog(
      `${error.message}`,
      'createProduct',
      'error'
    );
    return {
      success: false,
      message: "An error occurred while creating the product.",
      error: error.message,
    };
  }
}

// Mise à jour d'un produit
async function updateProduct(productId, updatedData, client) {
  try {
    const product = await Product.findByIdAndUpdate(
      productId,
      { $set: updatedData },
      { new: true }
    );
    if (product) {
      return { success: true, product, message: "Product updated successfully." };
    } else {
      return { success: false, message: "Product not found." };
    }
  } catch (error) {
    await logService.addLog(
      `${error.message}`,
      'updateProduct',
      'error'
    );
    return {
      success: false,
      message: "An error occurred while updating the product.",
      error: error.message,
    };
  }
}

// Suppression d'un produit
async function deleteProduct(productId, client) {
  try {
    const deletedProduct = await Product.findByIdAndDelete(productId);
    if (deletedProduct) {
      return { success: true, message: "Product deleted successfully.", product: deletedProduct };
    } else {
      return { success: false, message: "Product not found." };
    }
  } catch (error) {
    await logService.addLog(
      `${error.message}`,
      'deleteProduct',
      'error'
    );
    return {
      success: false,
      message: "An error occurred while deleting the product.",
      error: error.message,
    };
  }
}

// Récupérer les produits avec pagination et option de catégorie
async function listProducts(categoryId = null, limit = 10, offset = 0) {
  try {
    // Vérifiez si limit et offset sont des entiers valides
    limit = Math.max(1, parseInt(limit, 10)); // Minimum 1 pour éviter une limite nulle
    offset = Math.max(0, parseInt(offset, 10)); // Minimum 0 pour l'offset

    // Définir le filtre de la requête
    let query = {};
    
    // Si categoryId est fourni, on filtre les produits avec une variation correspondante
    if (categoryId !== null) {
      query = { 'variation': { $ne: null } };  // Recherche les produits avec des variations
    }

    // Récupérez les produits avec limit et offset
    const products = await Product.find(query)
      .populate({
        path: 'variation',
        match: categoryId ? { category: categoryId } : {},  // Filtrer ici pour la bonne catégorie si categoryId est défini
        populate: {
          path: 'category',
          model: 'Category'
        }
      })
      .limit(limit)
      .skip(offset)
      .exec();

    // Filtrer les produits qui n'ont pas une variation correspondante
    const filteredProducts = products.filter(product => product.variation);

    return {
      success: true,
      total: filteredProducts.length,
      products: filteredProducts,
    };
  } catch (error) {
    await logService.addLog(
      `${error.message}`,
      'listProducts',
      'error'
    );
    return {
      success: false,
      message: "An error occurred while fetching the product list.",
      error: error.message,
    };
  }
}



// Récupérer un produit 
async function ProductGetOne(query) {
  try {
    const product = await Product.findOne(query).populate('variation');
    if (product) {
      return { success: true, product };
    } else {
      return { success: false, message: "Product not found." };
    }
  } catch (error) {
    await logService.addLog(
      `${error.message}`,
      'ProductGetOne',
      'error'
    );
    return {
      success: false,
      message: "An error occurred while retrieving the product.",
      error: error.message,
    };
  }
}

 
module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  listProducts,
  ProductGetOne,
};
