const Variation = require('../models/variation.model');
const logService = require('./log.service');

// Création d'une variation
async function createVariation(variationData, client) {
  try {
    const newVariation = new Variation(variationData);
    const variation = await newVariation.save();
    return { success: true, variation, message: "Variation created successfully." };
  } catch (error) {
    await logService.addLog(
      `${error.message}`,
      'createVariation',
      'error'
    );
    return {
      success: false,
      message: "An error occurred while creating the variation.",
      error: error.message,
    };
  }
}

// Mise à jour d'une variation
async function updateVariation(variationId, updatedData, client) {
  try {
    const variation = await Variation.findByIdAndUpdate(
      variationId,
      { $set: updatedData },
      { new: true }
    );
    if (variation) {
      return { success: true, variation, message: "Variation updated successfully." };
    } else {
      return { success: false, message: "Variation not found." };
    }
  } catch (error) {
    await logService.addLog(
      `${error.message}`,
      'updateVariation',
      'error'
    );
    return {
      success: false,
      message: "An error occurred while updating the variation.",
      error: error.message,
    };
  }
}

// Suppression d'une variation
async function deleteVariation(variationId, client) {
  try {
    const deletedVariation = await Variation.findByIdAndDelete(variationId);
    if (deletedVariation) {
      return { success: true, message: "Variation deleted successfully.", variation: deletedVariation };
    } else {
      return { success: false, message: "Variation not found." };
    }
  } catch (error) {
    await logService.addLog(
      `${error.message}`,
      'deleteVariation',
      'error'
    );
    return {
      success: false,
      message: "An error occurred while deleting the variation.",
      error: error.message,
    };
  }
}

// Récupérer une variation par ID
async function getVariationById(variationId, client) {
  try {
    const variation = await Variation.findById(variationId).populate('category');
    if (variation) {
      return { success: true, variation };
    } else {
      return { success: false, message: "Variation not found." };
    }
  } catch (error) {
    await logService.addLog(
      `${error.message}`,
      'getVariationById',
      'error'
    );
    return {
      success: false,
      message: "An error occurred while retrieving the variation.",
      error: error.message,
    };
  }
}

// Liste de variations
async function getVariations(categoryId = null, limit = 10, offset = 0, client = null) {
  try {
    // Vérifiez si limit et offset sont des entiers valides
    limit = Math.max(1, parseInt(limit, 10)); // Minimum 1 pour éviter une limite nulle
    offset = Math.max(0, parseInt(offset, 10)); // Minimum 0 pour l'offset

    // Définir le filtre de la requête
    const query = categoryId ? { category: categoryId } : {};

    // Comptez le total des variations de manière efficace
    const totalCount = await Variation.countDocuments(query);

    // Récupérez les variations avec limit et offset
    const variations = await Variation.find(query)
      .populate('category')
      .limit(limit)
      .skip(offset)
      .exec(); // Utilisez exec() pour exécuter la requête

    return {
      success: true,
      total: totalCount,
      variations,
    };
  } catch (error) {
    await logService.addLog(
      `${error.message}`,
      'getVariations',
      'error'
    );
    return {
      success: false,
      message: "An error occurred while fetching the variation list.",
      error: error.message,
    };
  }
}


module.exports = {
  createVariation,
  updateVariation,
  deleteVariation,
  getVariationById,
  getVariations
};
