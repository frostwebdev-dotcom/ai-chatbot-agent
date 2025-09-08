const { getAuth } = require('../config/firebase');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('🔑 Auth middleware - checking token:', {
      hasAuthHeader: !!authHeader,
      tokenLength: token?.length,
      tokenStart: token?.substring(0, 20) + '...'
    });

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ error: 'Access token required' });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    console.log('✅ Token verified for user:', decodedToken.uid);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('❌ Token verification error:', error.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    socket.userId = decodedToken.uid;
    socket.userEmail = decodedToken.email;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decodedToken = await getAuth().verifyIdToken(token);
      req.user = decodedToken;
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  authenticateToken,
  authenticateSocket,
  optionalAuth
};
