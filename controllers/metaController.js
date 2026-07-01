const metaModel = require('../models/metaModel');

async function getMeta(req, res, next) {
  try {
    const meta = await metaModel.getMetaData();
    res.json(meta);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMeta,
};
