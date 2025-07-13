import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { isTeacher as checkTeacherRole } from "@/db/queries";

// Type definitions for cleaner middleware functions
export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string | null;
  role?: string;
  avatar?: string;
};

export type AuthenticatedHandler = (
  request: NextRequest,
  user: AuthenticatedUser,
  params?: any
) => Promise<NextResponse>;

export type PublicHandler = (
  request: NextRequest,
  params?: any
) => Promise<NextResponse>;

// Core authentication middleware
export function withAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest, params?: any) => {
    try {
      const user = await getServerUser();
      
      if (!user) {
        return NextResponse.json(
          { error: "Authentication required" }, 
          { status: 401 }
        );
      }

      // Transform user to match our type
      const authUser: AuthenticatedUser = {
        id: user.id,
        email: user.email,
        name: user.name || user.email, // Fallback to email if name is null
        role: user.role,
        avatar: user.avatar,
      };

      return handler(request, authUser, params);
    } catch (error) {
      console.error("Authentication middleware error:", error);
      return NextResponse.json(
        { error: "Internal server error" }, 
        { status: 500 }
      );
    }
  };
}

// Role-based authentication middleware
export function withRole(roles: string[], handler: AuthenticatedHandler) {
  return withAuth(async (request, user, params) => {
    // Check if user has required role
    const userRole = user.role || 'student'; // Default to student if no role
    
    if (!roles.includes(userRole)) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions" }, 
        { status: 403 }
      );
    }

    return handler(request, user, params);
  });
}

// Admin-only middleware
export function withAdmin(handler: AuthenticatedHandler) {
  return withAuth(async (request, user, params) => {
    const isUserAdmin = await isAdmin();
    
    if (!isUserAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" }, 
        { status: 403 }
      );
    }

    return handler(request, user, params);
  });
}

// Teacher-only middleware
export function withTeacher(handler: AuthenticatedHandler) {
  return withAuth(async (request, user, params) => {
    const isUserTeacher = await checkTeacherRole(user.id);
    
    if (!isUserTeacher) {
      return NextResponse.json(
        { error: "Forbidden: Teacher access required" }, 
        { status: 403 }
      );
    }

    return handler(request, user, params);
  });
}

// Request validation middleware
export function withValidation<T>(
  validator: (data: any) => data is T,
  handler: (request: NextRequest, data: T, user?: AuthenticatedUser, params?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, user?: AuthenticatedUser, params?: any) => {
    try {
      const data = await request.json();
      
      if (!validator(data)) {
        return NextResponse.json(
          { error: "Invalid request data" }, 
          { status: 400 }
        );
      }

      return handler(request, data, user, params);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" }, 
        { status: 400 }
      );
    }
  };
}

// Rate limiting middleware (basic implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function withRateLimit(maxRequests: number = 100, windowMs: number = 60 * 1000) {
  return (handler: AuthenticatedHandler | PublicHandler) => {
    return async (request: NextRequest, userOrParams?: any, params?: any) => {
      const clientIP = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
      
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Clean old entries
      const entries = Array.from(rateLimitMap.entries());
      for (const [key, data] of entries) {
        if (data.resetTime < windowStart) {
          rateLimitMap.delete(key);
        }
      }
      
      // Check current rate limit
      const current = rateLimitMap.get(clientIP) || { count: 0, resetTime: now + windowMs };
      
      if (current.count >= maxRequests && current.resetTime > now) {
        return NextResponse.json(
          { error: "Rate limit exceeded" }, 
          { status: 429 }
        );
      }
      
      // Update rate limit
      current.count++;
      if (current.resetTime <= now) {
        current.resetTime = now + windowMs;
        current.count = 1;
      }
      rateLimitMap.set(clientIP, current);
      
      // Call the handler
      return handler(request, userOrParams, params);
    };
  };
}

// Combined middleware for common patterns
export const secureApi = {
  // Public endpoint with rate limiting
  public: (handler: PublicHandler, rateLimit?: { max: number; window: number }) => {
    if (rateLimit) {
      return withRateLimit(rateLimit.max, rateLimit.window)(handler);
    }
    return handler;
  },
  
  // Authenticated endpoint
  auth: withAuth,
  
  // Admin only endpoint
  admin: withAdmin,
  
  // Teacher only endpoint  
  teacher: withTeacher,
  
  // Role-based endpoint
  role: withRole,
  
  // Authenticated with rate limiting
  authWithLimit: (handler: AuthenticatedHandler, maxRequests = 50) => 
    withRateLimit(maxRequests)(withAuth(handler)),
};

// Error response helpers
export const ApiResponses = {
  success: (data: any) => NextResponse.json(data),
  
  created: (data: any) => NextResponse.json(data, { status: 201 }),
  
  badRequest: (message: string = "Bad request") => 
    NextResponse.json({ error: message }, { status: 400 }),
  
  unauthorized: (message: string = "Authentication required") => 
    NextResponse.json({ error: message }, { status: 401 }),
  
  forbidden: (message: string = "Forbidden") => 
    NextResponse.json({ error: message }, { status: 403 }),
  
  notFound: (message: string = "Not found") => 
    NextResponse.json({ error: message }, { status: 404 }),
  
  serverError: (message: string = "Internal server error") => 
    NextResponse.json({ error: message }, { status: 500 }),
}; 