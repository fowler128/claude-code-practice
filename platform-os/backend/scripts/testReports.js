/**
 * Test Reports Performance
 * Validates that all 4 operational reports meet <300ms performance requirement
 * Run: node scripts/testReports.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const { ReportsService } = require('../services/reportsService');

const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'bizdeedz_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

const PERFORMANCE_TARGET_MS = 300;

async function testReport(name, reportFn) {
  const start = Date.now();
  try {
    const result = await reportFn();
    const duration = Date.now() - start;
    const status = duration < PERFORMANCE_TARGET_MS ? '✅ PASS' : '❌ FAIL';
    const indicator = duration < PERFORMANCE_TARGET_MS ? '✓' : '✗';

    console.log(`  ${indicator} ${name}: ${duration}ms ${status}`);

    if (duration >= PERFORMANCE_TARGET_MS) {
      console.log(`    ⚠ Exceeds ${PERFORMANCE_TARGET_MS}ms target by ${duration - PERFORMANCE_TARGET_MS}ms`);
    }

    return {
      name,
      duration,
      passed: duration < PERFORMANCE_TARGET_MS,
      result
    };
  } catch (error) {
    const duration = Date.now() - start;
    console.log(`  ❌ ${name}: ERROR (${duration}ms)`);
    console.log(`    Error: ${error.message}`);
    return {
      name,
      duration,
      passed: false,
      error: error.message
    };
  }
}

async function main() {
  console.log('🔬 Testing Report Performance');
  console.log(`🎯 Target: <${PERFORMANCE_TARGET_MS}ms per report`);
  console.log('==========================================\n');

  const reportsService = new ReportsService(db);
  const results = [];

  // Test each report
  console.log('📊 Running Reports...\n');

  results.push(await testReport(
    'Queue Pressure Report',
    () => reportsService.getQueueReport()
  ));

  results.push(await testReport(
    'Cycle Time Report',
    () => reportsService.getCycleTimeReport()
  ));

  results.push(await testReport(
    'Defects/Rework Report',
    () => reportsService.getDefectsReport()
  ));

  results.push(await testReport(
    'Lead Funnel Report',
    () => reportsService.getLeadsReport()
  ));

  // Test combined report
  console.log('\n📈 Testing Combined Report...\n');
  results.push(await testReport(
    'All Reports Combined',
    () => reportsService.getAllReports()
  ));

  // Test performance check endpoint
  console.log('\n🔍 Testing Performance Check...\n');
  const perfCheck = await reportsService.checkPerformance();

  console.log('  Performance Results:');
  perfCheck.reports.forEach(r => {
    const status = r.duration < PERFORMANCE_TARGET_MS ? '✓' : '✗';
    console.log(`    ${status} ${r.name}: ${r.duration}ms`);
  });

  // Summary
  console.log('\n==========================================');
  console.log('📋 Summary\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

  console.log(`  Total Tests: ${results.length}`);
  console.log(`  Passed: ${passed} ✅`);
  console.log(`  Failed: ${failed} ${failed > 0 ? '❌' : ''}`);
  console.log(`  Average Duration: ${avgDuration.toFixed(0)}ms`);

  if (failed === 0) {
    console.log('\n✅ All reports meet performance requirements!');
  } else {
    console.log('\n❌ Some reports need optimization');
    console.log('\nRecommendations:');
    console.log('  - Check database indexes are created');
    console.log('  - Analyze EXPLAIN ANALYZE for slow queries');
    console.log('  - Consider materializing common queries');
    console.log('  - Review WHERE clause selectivity');
  }

  // Database stats
  console.log('\n📊 Database Statistics:\n');
  const statsResult = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM matters) as matter_count,
      (SELECT COUNT(*) FROM tasks) as task_count,
      (SELECT COUNT(*) FROM events) as event_count,
      (SELECT COUNT(*) FROM leads) as lead_count,
      (SELECT COUNT(*) FROM work_orders) as work_order_count
  `);

  const stats = statsResult.rows[0];
  console.log(`  Matters: ${stats.matter_count}`);
  console.log(`  Tasks: ${stats.task_count}`);
  console.log(`  Events: ${stats.event_count}`);
  console.log(`  Leads: ${stats.lead_count}`);
  console.log(`  Work Orders: ${stats.work_order_count}`);

  console.log('\n==========================================\n');

  await db.end();
  process.exit(failed > 0 ? 1 : 0);
}

main();
