#!/usr/bin/env ts-node
/**
 * Service Account Creation Script
 *
 * Creates a service account with scoped API permissions for OpenClaw integration.
 *
 * Usage:
 *   npm run create-service-account
 *   npm run create-service-account -- --name="OpenClaw Main" --scopes="ingestion:write,artifacts:write"
 *
 * Arguments:
 *   --name=<name>       Service account name (default: "OpenClaw Bot")
 *   --description=<desc> Description (default: "OpenClaw automation runtime")
 *   --scopes=<scopes>    Comma-separated scopes (default: ingestion:write,artifacts:write,events:write)
 *
 * Available Scopes:
 *   - ingestion:write   Create and update ingestion items
 *   - artifacts:write   Register artifacts with file paths
 *   - tasks:write       Create tasks
 *   - events:write      Create audit events
 *   - ai_runs:write     Create AI run records
 *
 * Security:
 *   - Service accounts CANNOT approve AI runs
 *   - Service accounts CANNOT close matters
 *   - API keys are bcrypt-hashed (never stored in plain text)
 *   - API key is shown ONLY ONCE at creation
 */

import { createServiceAccount } from '../middleware/serviceAuth';
import pool from '../db/pool';
import { ServiceAccountScope } from '../../../shared/types';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function parseArgs(): {
  name: string;
  description: string;
  scopes: ServiceAccountScope[];
} {
  const args = process.argv.slice(2);

  const name =
    args
      .find((a) => a.startsWith('--name='))
      ?.split('=')[1]
      .replace(/['"]/g, '') || 'OpenClaw Bot';

  const description =
    args
      .find((a) => a.startsWith('--description='))
      ?.split('=')[1]
      .replace(/['"]/g, '') || 'OpenClaw automation runtime';

  const scopesArg =
    args
      .find((a) => a.startsWith('--scopes='))
      ?.split('=')[1]
      .replace(/['"]/g, '') || 'ingestion:write,artifacts:write,events:write';

  const scopes = scopesArg.split(',').map((s) => s.trim()) as ServiceAccountScope[];

  // Validate scopes
  const validScopes: ServiceAccountScope[] = [
    'ingestion:write',
    'artifacts:write',
    'tasks:write',
    'events:write',
    'ai_runs:write',
  ];

  const invalidScopes = scopes.filter((s) => !validScopes.includes(s));
  if (invalidScopes.length > 0) {
    console.error(`${colors.red}Error: Invalid scopes: ${invalidScopes.join(', ')}${colors.reset}`);
    console.error(`Valid scopes: ${validScopes.join(', ')}`);
    process.exit(1);
  }

  return { name, description, scopes };
}

function printBanner() {
  console.log(`${colors.cyan}${colors.bright}`);
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║          BizDeedz Platform OS                             ║');
  console.log('║          Service Account Creation                         ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
}

function printSuccess(
  account: any,
  apiKey: string
) {
  console.log(`\n${colors.green}${colors.bright}✅ Service Account Created Successfully!${colors.reset}\n`);

  console.log(`${colors.bright}Account Details:${colors.reset}`);
  console.log(`  ID:          ${colors.cyan}${account.service_id}${colors.reset}`);
  console.log(`  Name:        ${colors.cyan}${account.name}${colors.reset}`);
  console.log(`  Description: ${colors.cyan}${account.description || 'N/A'}${colors.reset}`);
  console.log(`  Scopes:      ${colors.cyan}${account.scopes.join(', ')}${colors.reset}`);
  console.log(`  Created:     ${colors.cyan}${new Date(account.created_at).toLocaleString()}${colors.reset}`);

  console.log(`\n${colors.yellow}${colors.bright}⚠️  IMPORTANT: Save the API Key - It's Only Shown Once!${colors.reset}\n`);

  console.log(`${colors.bright}API Key:${colors.reset}`);
  console.log(`${colors.green}${apiKey}${colors.reset}`);

  console.log(`\n${colors.bright}Add to OpenClaw .env:${colors.reset}`);
  console.log(`${colors.blue}BIZDEEDZ_OS_SERVICE_KEY=${apiKey}${colors.reset}`);

  console.log(`\n${colors.bright}Or add to Coolify:${colors.reset}`);
  console.log(`  1. Go to OpenClaw application`);
  console.log(`  2. Click "Environment Variables"`);
  console.log(`  3. Add: BIZDEEDZ_OS_SERVICE_KEY = ${colors.green}${apiKey}${colors.reset}`);
  console.log(`  4. Click "Save"`);
  console.log(`  5. Redeploy OpenClaw`);

  console.log(`\n${colors.bright}Security Notes:${colors.reset}`);
  console.log(`  • This service account ${colors.red}CANNOT${colors.reset} approve AI runs`);
  console.log(`  • This service account ${colors.red}CANNOT${colors.reset} close matters`);
  console.log(`  • API key is bcrypt-hashed in database`);
  console.log(`  • Rotate keys periodically for security`);

  console.log(`\n${colors.bright}Test the Integration:${colors.reset}`);
  console.log(`  ${colors.cyan}curl -X GET http://localhost:3001/api/health \\${colors.reset}`);
  console.log(`  ${colors.cyan}  -H "X-Service-Key: ${apiKey}"${colors.reset}`);

  console.log(`\n${colors.green}${colors.bright}✨ Setup Complete!${colors.reset}\n`);
}

async function main() {
  try {
    printBanner();

    const { name, description, scopes } = parseArgs();

    console.log(`${colors.bright}Creating service account...${colors.reset}`);
    console.log(`  Name:        ${name}`);
    console.log(`  Description: ${description}`);
    console.log(`  Scopes:      ${scopes.join(', ')}`);
    console.log('');

    // Check if service account with this name already exists
    const existing = await pool.query(
      'SELECT service_id, name FROM service_accounts WHERE name = $1',
      [name]
    );

    if (existing.rows.length > 0) {
      console.error(`${colors.red}Error: Service account "${name}" already exists!${colors.reset}`);
      console.log(`\nExisting account ID: ${existing.rows[0].service_id}`);
      console.log(`\nTo create a new account, use a different name:`);
      console.log(`  npm run create-service-account -- --name="OpenClaw Bot 2"`);
      console.log(`\nOr delete the existing account:`);
      console.log(`  DELETE FROM service_accounts WHERE service_id = '${existing.rows[0].service_id}';`);
      process.exit(1);
    }

    // Create service account
    const { account, apiKey } = await createServiceAccount(name, description, scopes);

    printSuccess(account, apiKey);
  } catch (error: any) {
    console.error(`\n${colors.red}${colors.bright}❌ Error creating service account:${colors.reset}`);
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', async () => {
  console.log(`\n\n${colors.yellow}Interrupted. Cleaning up...${colors.reset}`);
  await pool.end();
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main();
}

export { main };
