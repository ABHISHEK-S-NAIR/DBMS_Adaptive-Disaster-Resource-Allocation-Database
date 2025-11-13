const validate = (schema, property = 'body') => (req, res, next) => {
  const data = req[property];
  const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });
  if (error) {
    const message = error.details.map((detail) => detail.message).join(', ');
    const err = new Error(message);
    err.status = 422;
    throw err;
  }
  req[property] = value;
  next();
};

export default validate;
