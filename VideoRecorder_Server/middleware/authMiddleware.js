const { returnServerRes } = require('../utils');


const authenticate = (req, res, next) => {
  try {
    let token = req.headers.authorization;
    
    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return returnServerRes(res, 401, false, 'No token provided. Please login first.');
    }

    if (token.startsWith('Bearer ')) {
      token = token.substring(7);
    }

    if (!token.startsWith('token_')) {
      return returnServerRes(res, 401, false, 'Invalid token format');
    }

    const tokenParts = token.split('_');
    if (tokenParts.length < 4) {
      return returnServerRes(res, 401, false, 'Invalid token format');
    }

    const userId = parseInt(tokenParts[1]);
    const role = tokenParts[2];

    req.user = {
      id: userId,
      role: role,
      authenticated: true
    };

    next();
  } catch (error) {
    return returnServerRes(res, 401, false, 'Authentication failed', { error: error.message });
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return returnServerRes(res, 401, false, 'Authentication required');
      }

      if (!allowedRoles.includes(req.user.role)) {
        return returnServerRes(res, 403, false, 'Access denied. Insufficient permissions.');
      }

      next();
    } catch (error) {
      return returnServerRes(res, 403, false, 'Authorization failed', { error: error.message });
    }
  };
};

module.exports = {
  authenticate,
  authorize
};

