const variationService = require('../services/variation.service');
const ResponseService = require('../services/response.service');

// Création d'une variation
const createVariation = async (req, res, client) => {
  const variationData = req.body;
  const response = await variationService.createVariation(variationData, client);
  if (response.success) {
    return ResponseService.success(res, { variation: response.variation, message: response.message });
  } else {
    return ResponseService.internalServerError(res, { error: response.message });
  }
};

// Mise à jour d'une variation
const updateVariation = async (req, res, client) => {
  const variationId = req.params.variationId;
  const updatedData = req.body;
  const response = await variationService.updateVariation(variationId, updatedData, client);
  if (response.success) {
    return ResponseService.success(res, { variation: response.variation, message: response.message });
  } else {
    return ResponseService.notFound(res, { message: response.message });
  }
};

// Suppression d'une variation
const deleteVariation = async (req, res, client) => {
  const variationId = req.params.variationId;
  const response = await variationService.deleteVariation(variationId, client);
  if (response.success) {
    return ResponseService.success(res, { variation: response.variation, message: response.message });
  } else {
    return ResponseService.notFound(res, { message: response.message });
  }
};

// Récupérer une variation par son ID
const getVariationById = async (req, res, client) => {
  const variationId = req.params.variationId;
  const response = await variationService.getVariationById(variationId, client);
  if (response.success) {
    return ResponseService.success(res, { variation: response.variation });
  } else {
    return ResponseService.notFound(res, { message: response.message });
  }
};

// Liste de toutes les variations ou récupérer les variations par catégorie
const listVariations = async (req, res, client) => {
    const { categoryId } = req.query; // Vérifiez si categoryId est présent dans les paramètres
    const { limit, offset } = req.query; // Récupérer limit et offset des paramètres de requête
    const response = await variationService.getVariations(categoryId || null, limit, offset, client); // Passer categoryId, limit et offset au service
    if (response.success) {
        return ResponseService.success(res, {
            variations: response.variations,
            total: response.total,
        });
    } else {
        return ResponseService.internalServerError(res, { error: response.message });
    }
};



module.exports = {
  createVariation,
  updateVariation,
  deleteVariation,
  listVariations,
  getVariationById,
};
