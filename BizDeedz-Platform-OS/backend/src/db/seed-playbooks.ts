import fs from 'fs';
import path from 'path';
import pool from './connection';

async function seedPlaybooks() {
  console.log('Starting playbook seeding...');

  try {
    // Read all playbook template files
    const templatesDir = path.join(__dirname, '../templates');
    const playbookFiles = [
      'bankruptcy-consumer.json',
      'family-law-divorce.json',
      'immigration-petition.json',
      'probate-estate-planning.json',
    ];

    for (const filename of playbookFiles) {
      const filePath = path.join(templatesDir, filename);
      console.log(`\nLoading playbook: ${filename}`);

      const fileContent = fs.readFileSync(filePath, 'utf8');
      const playbook = JSON.parse(fileContent);

      // Check if playbook already exists
      const existing = await pool.query(
        'SELECT playbook_id FROM playbook_templates WHERE playbook_id = $1 AND version = $2',
        [playbook.playbook_id, playbook.version]
      );

      if (existing.rows.length > 0) {
        console.log(`  ⚠ Playbook ${playbook.playbook_id} v${playbook.version} already exists, skipping...`);
        continue;
      }

      // Insert playbook
      await pool.query(
        `INSERT INTO playbook_templates (
          playbook_id, version, practice_area_id, matter_type_id,
          name, description, template_json, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
        [
          playbook.playbook_id,
          playbook.version,
          playbook.practice_area_id,
          playbook.matter_type_id,
          playbook.name,
          playbook.description,
          JSON.stringify(playbook),
        ]
      );

      console.log(`  ✓ Inserted playbook: ${playbook.name}`);

      // Insert SLA rules
      if (playbook.sla_rules && playbook.sla_rules.length > 0) {
        for (const sla of playbook.sla_rules) {
          await pool.query(
            `INSERT INTO sla_rules (
              playbook_id, status_code, sla_hours,
              escalation_enabled, escalation_roles, is_active
            ) VALUES ($1, $2, $3, $4, $5, true)`,
            [
              playbook.playbook_id,
              sla.status_code,
              sla.sla_hours,
              sla.escalation_enabled,
              sla.escalation_roles || [],
            ]
          );
        }
        console.log(`  ✓ Inserted ${playbook.sla_rules.length} SLA rules`);
      }

      // Insert automation rules
      if (playbook.automation_rules && playbook.automation_rules.length > 0) {
        for (const rule of playbook.automation_rules) {
          await pool.query(
            `INSERT INTO automation_rules (
              playbook_id, rule_name, trigger_type,
              trigger_conditions, action_type, action_config, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, true)`,
            [
              playbook.playbook_id,
              rule.rule_name,
              rule.trigger_type,
              JSON.stringify(rule.trigger_conditions),
              rule.action_type,
              JSON.stringify(rule.action_config),
            ]
          );
        }
        console.log(`  ✓ Inserted ${playbook.automation_rules.length} automation rules`);
      }
    }

    console.log('\n✓ Playbook seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Playbook seeding failed:', error);
    process.exit(1);
  }
}

seedPlaybooks();
