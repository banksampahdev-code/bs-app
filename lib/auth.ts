import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface JWTPayload {
  id: string;
  role: 'admin' | 'pengelola' | 'pengguna';
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '24h'
  });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export function getAuthUser(request: NextRequest): JWTPayload | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return verifyToken(token);
}

export function requireAuth(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  return user;
}

export function requireRole(request: NextRequest, allowedRoles: string[]) {
  const user = requireAuth(request);
  if (user instanceof Response) return user;

  if (!allowedRoles.includes(user.role)) {
    return Response.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  return user;
}