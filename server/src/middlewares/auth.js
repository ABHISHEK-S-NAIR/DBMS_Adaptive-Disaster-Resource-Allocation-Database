import jwt from 'jsonwebtoken';

const unauthorized = (message = 'Authentication required') => {
  const error = new Error(message);
  error.status = 401;
  return error;
};

export const authenticate = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    throw unauthorized();
  }

  const token = header.slice(7).trim();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    throw unauthorized('Invalid or expired session token');
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.length) {
    next();
    return;
  }

  const userRole = req.user?.role;

  if (!userRole || !roles.includes(userRole)) {
    const err = new Error('Insufficient privileges');
    err.status = 403;
    throw err;
  }

  next();
};
