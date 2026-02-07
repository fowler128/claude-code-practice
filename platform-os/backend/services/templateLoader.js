/**
 * Template Loader Service
 * Loads playbook templates from /templates directory into database
 */

const fs = require('fs').promises;
const path = require('path');

class TemplateLoader {
  constructor(db) {
    this.db = db;
    this.templatesPath = path.join(__dirname, '../../templates');
  }

  /**
   * Load all templates from /templates directory
   */
  async loadAllTemplates() {
    console.log('[TemplateLoader] Loading playbook templates...');

    const templateFiles = [
      { file: 'bankruptcy-consumer.json', practiceCode: 'BK', matterTypeCode: 'BK-CONSUMER' },
      { file: 'family-law-divorce.json', practiceCode: 'FL', matterTypeCode: 'FL-DIVORCE' },
      { file: 'immigration-petition.json', practiceCode: 'IM', matterTypeCode: 'IM-PETITION' },
      { file: 'probate-estate-planning.json', practiceCode: 'PE', matterTypeCode: 'PE-ESTATE' }
    ];

    const results = [];

    for (const template of templateFiles) {
      try {
        const result = await this.loadTemplate(template);
        results.push(result);
      } catch (error) {
        console.error(`[TemplateLoader] Error loading ${template.file}:`, error);
        results.push({ file: template.file, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`[TemplateLoader] Loaded ${successCount}/${results.length} templates`);

    return {
      success: successCount === results.length,
      results,
      summary: `${successCount}/${results.length} templates loaded`
    };
  }

  /**
   * Load single template
   */
  async loadTemplate({ file, practiceCode, matterTypeCode }) {
    const filePath = path.join(this.templatesPath, file);

    // Read template file
    const fileContent = await fs.readFile(filePath, 'utf8');
    const templateData = JSON.parse(fileContent);

    // Get practice area ID
    const practiceResult = await this.db.query(
      'SELECT id FROM practice_areas WHERE code = $1',
      [practiceCode]
    );

    if (practiceResult.rows.length === 0) {
      throw new Error(`Practice area not found: ${practiceCode}`);
    }

    const practiceAreaId = practiceResult.rows[0].id;

    // Get matter type ID
    const matterTypeResult = await this.db.query(
      'SELECT id FROM matter_types WHERE code = $1',
      [matterTypeCode]
    );

    if (matterTypeResult.rows.length === 0) {
      throw new Error(`Matter type not found: ${matterTypeCode}`);
    }

    const matterTypeId = matterTypeResult.rows[0].id;

    // Check if template already exists
    const existingResult = await this.db.query(
      `SELECT id, version FROM playbook_templates
       WHERE template_id = $1`,
      [templateData.template_id]
    );

    let result;

    if (existingResult.rows.length > 0) {
      // Update existing template
      result = await this.db.query(
        `UPDATE playbook_templates
         SET template_data = $1,
             is_active = true,
             is_published = true,
             updated_at = CURRENT_TIMESTAMP
         WHERE template_id = $2
         RETURNING id, version`,
        [JSON.stringify(templateData), templateData.template_id]
      );

      console.log(`[TemplateLoader] Updated template: ${templateData.template_id}`);
    } else {
      // Insert new template
      result = await this.db.query(
        `INSERT INTO playbook_templates (
          template_id, practice_area_id, matter_type_id, name, version,
          template_data, is_active, is_published, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, version`,
        [
          templateData.template_id,
          practiceAreaId,
          matterTypeId,
          templateData.name,
          templateData.template_version || 1,
          JSON.stringify(templateData),
          true,
          true,
          'system'
        ]
      );

      console.log(`[TemplateLoader] Inserted template: ${templateData.template_id}`);
    }

    return {
      file,
      success: true,
      templateId: templateData.template_id,
      dbId: result.rows[0].id,
      version: result.rows[0].version
    };
  }

  /**
   * Get template by template_id
   */
  async getTemplate(templateId) {
    const result = await this.db.query(
      'SELECT * FROM playbook_templates WHERE template_id = $1 AND is_active = true',
      [templateId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].template_data;
  }

  /**
   * Get template by practice area and matter type
   */
  async getTemplateByType(practiceAreaId, matterTypeId) {
    const result = await this.db.query(
      `SELECT template_data FROM playbook_templates
       WHERE practice_area_id = $1
         AND matter_type_id = $2
         AND is_active = true
         AND is_published = true
       ORDER BY version DESC
       LIMIT 1`,
      [practiceAreaId, matterTypeId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].template_data;
  }

  /**
   * Reload all templates (development helper)
   */
  async reloadTemplates() {
    console.log('[TemplateLoader] Reloading all templates...');
    return await this.loadAllTemplates();
  }
}

module.exports = { TemplateLoader };
