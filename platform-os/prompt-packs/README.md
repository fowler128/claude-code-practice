# Prompt Packs

Versioned, reusable prompt templates for consistent agent execution.

## Structure

```
prompt-packs/
├── legal/              # Legal domain prompts
│   ├── matter-health-analysis.json
│   ├── document-qa.json
│   └── legal-research.json
├── crm/                # CRM domain prompts
│   ├── lead-scoring.json
│   ├── next-best-action.json
│   └── proposal-generation.json
├── content/            # Content domain prompts
│   ├── blog-post-generation.json
│   ├── brand-qa.json
│   └── seo-optimization.json
├── ops/                # Operations domain prompts
│   ├── sop-automation-analysis.json
│   └── workflow-optimization.json
└── README.md           # This file
```

## Prompt Pack Format

Each prompt pack is a JSON file with:

- **Metadata**: Name, version, category, description
- **System Prompt**: Role and instructions for the AI
- **User Prompt Template**: Template with {{variables}}
- **Variables Schema**: Required/optional variables with types
- **Example Inputs/Outputs**: Demonstrations
- **Validation Rules**: Output requirements
- **Recommendations**: Model, temperature, max tokens

## Usage

### 1. Load Prompt Pack

```javascript
const promptPack = await db.query(
  'SELECT * FROM prompt_packs WHERE pack_name = $1 AND is_active = true',
  ['Legal Matter Health Analysis']
);
```

### 2. Populate Variables

```javascript
const variables = {
  matter_number: 'BK-26-0015',
  client_name: 'John Doe',
  practice_area: 'Bankruptcy',
  current_status: 'docs_requested',
  // ... other variables
};
```

### 3. Render Prompt

```javascript
let userPrompt = promptPack.user_prompt_template;
Object.keys(variables).forEach(key => {
  userPrompt = userPrompt.replace(`{{${key}}}`, variables[key]);
});
```

### 4. Execute with AI

```javascript
const response = await openai.chat.completions.create({
  model: promptPack.recommended_model,
  temperature: promptPack.recommended_temperature,
  max_tokens: promptPack.recommended_max_tokens,
  messages: [
    { role: 'system', content: promptPack.system_prompt },
    { role: 'user', content: userPrompt }
  ]
});
```

### 5. Validate Output

```javascript
const output = JSON.parse(response.choices[0].message.content);
const rules = promptPack.output_validation_rules;

// Check required fields
rules.required_fields.forEach(field => {
  if (!(field in output)) {
    throw new Error(`Missing required field: ${field}`);
  }
});

// Validate ranges
if (output.health_score < rules.health_score_range[0] ||
    output.health_score > rules.health_score_range[1]) {
  throw new Error('Health score out of range');
}
```

## Best Practices

1. **Version prompt packs** when making changes (increment version)
2. **Test thoroughly** with example inputs before production
3. **Document variable expectations** clearly
4. **Include validation rules** for all critical outputs
5. **Provide examples** to guide AI behavior
6. **Keep system prompts focused** on role and core instructions
7. **Use templates** for consistency across similar prompts

## Creating New Prompt Packs

1. Copy an existing pack as a template
2. Update metadata (pack_id, name, version, category)
3. Write clear system prompt defining AI role
4. Create user prompt template with {{variables}}
5. Define all variables with types and requirements
6. Provide 2-3 example inputs and outputs
7. Define validation rules for outputs
8. Test with real data
9. Add to database or prompt-packs folder
10. Document in this README

## Prompt Pack Registry

| Pack Name | Category | Version | Description |
|-----------|----------|---------|-------------|
| Legal Matter Health Analysis | legal | 1.0.0 | Analyzes matter health, provides risk assessment and recommendations |
| Lead Scoring & Qualification | crm | 1.0.0 | Scores leads on fit/engagement/intent, recommends next action |
| Content Brand QA | content | 1.0.0 | Reviews content for brand guideline compliance |
| SOP Automation Assessment | ops | 1.0.0 | Assesses SOP automation potential and ROI |

## Roadmap

- [ ] UI for creating/editing prompt packs
- [ ] A/B testing framework for prompt variations
- [ ] Performance analytics per pack (success rates, quality scores)
- [ ] Community-contributed packs marketplace
- [ ] Multi-language prompt packs
- [ ] Dynamic prompt optimization based on results

---

**Last Updated**: 2026-02-05
