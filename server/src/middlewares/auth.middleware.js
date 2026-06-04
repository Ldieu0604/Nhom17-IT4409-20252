import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-env';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/**
 * Verifies the Bearer JWT in `Authorization` header.
 * On success: attaches decoded payload to `req.user` and calls next().
 * On failure: responds 401.
 */
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const cookieToken = req.cookies?.accessToken;

    const token = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token not provided.',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id || decoded.userId },
      select: { id: true },
    });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Your session is no longer valid. Please log in again.',
      });
    }
    req.user = decoded; // { id, email, username, iat, exp }
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.',
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }
    console.error('[verifyToken] error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};
