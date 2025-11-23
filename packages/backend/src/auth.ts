import type { Request, Response, NextFunction } from 'express'

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      userId?: string
      userEmail?: string
    }
  }
}

/**
 * Extracts user information from the request.
 * In Lambda with API Gateway + Cognito authorizer, user info comes from requestContext.
 * For local dev, we use a header or fall back to a test user.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Try to get user from API Gateway authorizer context (Lambda)
  const apiGatewayEvent = (req as unknown as { apiGateway?: { event?: ApiGatewayEvent } }).apiGateway?.event

  if (apiGatewayEvent?.requestContext?.authorizer?.claims) {
    const claims = apiGatewayEvent.requestContext.authorizer.claims
    req.userId = claims.sub
    req.userEmail = claims.email
    return next()
  }

  // For local development: use Authorization header with user ID
  // Format: "Bearer <userId>" or just the JWT (we extract sub from it)
  const authHeader = req.headers.authorization

  if (authHeader) {
    // In local dev, we can use a simple user ID in the header
    // In production, this path won't be reached because API Gateway validates JWT
    const token = authHeader.replace('Bearer ', '')

    // Try to decode JWT to get user ID (without verification for local dev)
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
      req.userId = payload.sub
      req.userEmail = payload.email
      return next()
    } catch {
      // If not a valid JWT, use the token as user ID (for simple local testing)
      req.userId = token
      req.userEmail = 'local@test.com'
      return next()
    }
  }

  // No auth provided
  return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' })
}

// Type for API Gateway event
interface ApiGatewayEvent {
  requestContext?: {
    authorizer?: {
      claims?: {
        sub: string
        email: string
        [key: string]: string
      }
    }
  }
}
