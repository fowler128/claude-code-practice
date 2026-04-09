import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import pool from '../db/pool';
import { ServiceAccount, ServiceAccountScope } from '../../../shared/types';

export interface ServiceAuthRequest extends Request {
  serviceAccount?: Omit<ServiceAccount, 'api_key_hash'>;
  correlationId?: string;
}

/**
 * Middleware to authenticate service accounts via X-Service-Key header
 * Used for system-to-system integration (OpenClaw -> BizDeedz Platform OS)
 */
export async function serviceAuthMiddleware(
  req: ServiceAuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const serviceKey = req.headers['x-service-key'] as string;

    if (!serviceKey) {
      return res.status(401).json({
        success: false,
        error: 'Service authentication required. Missing X-Service-Key header.',
        timestamp: new Date().toISOString(),
      });
    }

    // Query service accounts to find matching key
    const result = await pool.query(
      `SELECT service_id, name, description, api_key_hash, scopes, enabled,
              last_used_at, created_at, updated_at
       FROM service_accounts
       WHERE enabled = true`
    );

    let authenticatedAccount: ServiceAccount | null = null;

    // Check each enabled service account for matching key
    for (const account of result.rows) {
      const isMatch = await bcrypt.compare(serviceKey, account.api_key_hash);
      if (isMatch) {
        authenticatedAccount = account;
        break;
      }
    }

    if (!authenticatedAccount) {
      return res.status(401).json({
        success: false,
        error: 'Invalid service key',
        timestamp: new Date().toISOString(),
      });
    }

    // Update last_used_at timestamp
    await pool.query(
      `UPDATE service_accounts
       SET last_used_at = CURRENT_TIMESTAMP
       WHERE service_id = $1`,
      [authenticatedAccount.service_id]
    );

    // Attach service account to request (without api_key_hash)
    req.serviceAccount = {
      service_id: authenticatedAccount.service_id,
      name: authenticatedAccount.name,
      description: authenticatedAccount.description,
      scopes: authenticatedAccount.scopes,
      enabled: authenticatedAccount.enabled,
      last_used_at: authenticatedAccount.last_used_at,
      created_at: authenticatedAccount.created_at,
      updated_at: authenticatedAccount.updated_at,
    } as Omit<ServiceAccount, 'api_key_hash'>;

    // Generate correlation ID if not provided
    req.correlationId = (req.headers['x-correlation-id'] as string) || crypto.randomUUID();

    next();
  } catch (error) {
    console.error('Service auth error:', error);
    return res.status(500).json({
      success: false,
      error: 'Service authentication failed',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Middleware to check if service account has required scopes
 */
export function requireScope(...requiredScopes: ServiceAccountScope[]) {
  return (req: ServiceAuthRequest, res: Response, next: NextFunction) => {
    if (!req.serviceAccount) {
      return res.status(401).json({
        success: false,
        error: 'Service account not authenticated',
        timestamp: new Date().toISOString(),
      });
    }

    const hasAllScopes = requiredScopes.every((scope) =>
      req.serviceAccount!.scopes.includes(scope)
    );

    if (!hasAllScopes) {
      return res.status(403).json({
        success: false,
        error: `Insufficient permissions. Required scopes: ${requiredScopes.join(', ')}`,
        allowed_scopes: req.serviceAccount.scopes,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
}

/**
 * Utility function to generate a secure API key
 */
export function generateServiceKey(): string {
  // Generate a 32-byte random key and encode as base64url
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Utility function to hash a service key for storage
 */
export async function hashServiceKey(key: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(key, saltRounds);
}

/**
 * Create a new service account
 * Returns the account and the UNHASHED API key (only time it's shown)
 */
export async function createServiceAccount(
  name: string,
  description: string | undefined,
  scopes: ServiceAccountScope[]
): Promise<{ account: Omit<ServiceAccount, 'api_key_hash'>; apiKey: string }> {
  const apiKey = generateServiceKey();
  const apiKeyHash = await hashServiceKey(apiKey);

  const result = await pool.query(
    `INSERT INTO service_accounts (name, description, api_key_hash, scopes, enabled)
     VALUES ($1, $2, $3, $4, true)
     RETURNING service_id, name, description, scopes, enabled,
               last_used_at, created_at, updated_at`,
    [name, description, apiKeyHash, scopes]
  );

  const account = result.rows[0];

  return {
    account: {
      service_id: account.service_id,
      name: account.name,
      description: account.description,
      scopes: account.scopes,
      enabled: account.enabled,
      last_used_at: account.last_used_at,
      created_at: account.created_at,
      updated_at: account.updated_at,
    },
    apiKey,
  };
}
