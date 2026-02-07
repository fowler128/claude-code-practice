/**
 * Load Playbook Templates Script
 * Loads playbook templates from /templates directory into database
 * Run: node scripts/loadTemplates.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const { TemplateLoader } = require('../services/templateLoader');

const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'bizdeedz_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function main() {
  try {
    console.log('🔄 Loading playbook templates...\n');

    const templateLoader = new TemplateLoader(db);
    const result = await templateLoader.loadAllTemplates();

    console.log('\n✅ Template loading complete!');
    console.log(`📊 Summary: ${result.summary}`);
    console.log(`✓ Loaded: ${result.loaded.length} templates`);
    console.log(`⚠ Skipped: ${result.skipped.length} templates`);
    console.log(`✗ Errors: ${result.errors.length} templates`);

    if (result.loaded.length > 0) {
      console.log('\n📋 Loaded Templates:');
      result.loaded.forEach(t => {
        console.log(`  - ${t.name} (v${t.version}) → ${t.practice_area}/${t.matter_type}`);
      });
    }

    if (result.skipped.length > 0) {
      console.log('\n⏭ Skipped Templates:');
      result.skipped.forEach(s => {
        console.log(`  - ${s.template}: ${s.reason}`);
      });
    }

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(e => {
        console.log(`  - ${e.template}: ${e.error}`);
      });
    }

    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error loading templates:', error);
    await db.end();
    process.exit(1);
  }
}

main();
