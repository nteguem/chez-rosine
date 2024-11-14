const logService = require('../services/log.service');
const ResponseService = require('../services/response.service');

const getLogs = async (req, res) => {
  const { type } = req.query; 
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = parseInt(req.query.offset, 10) || 0;

  try {
    const response = await logService.getLogs(offset, limit, type);
    return ResponseService.success(res, {
      logs: response.logs,
      total: response.total,
    });
  } catch (error) {  
    await logService.addLog(
      `${error.message}`,
      'getLogs',
      'error'
    );
    return ResponseService.internalServerError(res, { error: 'Failed to retrieve logs' });
  }
};

module.exports = {
  getLogs,
};
