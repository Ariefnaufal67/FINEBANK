const { ZodError } = require('zod');
const { badRequest } = require('../utils/errors');

// validate(schema, 'body' | 'query') -> hasil parse disimpan di req.valid[source]
const validate = (schema, source = 'body') => (req, _res, next) => {
  try {
    req.valid = req.valid || {};
    req.valid[source] = schema.parse(req[source]);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
      throw badRequest('Validasi gagal', details);
    }
    throw err;
  }
};

module.exports = validate;
