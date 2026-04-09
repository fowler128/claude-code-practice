/**
 * Gemini API Service for AI Readiness Accelerator
 *
 * This service handles communication with Google's Gemini API to generate
 * AI-powered executive summaries based on assessment scores and firm profiles.
 */

import type {
  PillarScores,
  FirmProfile,
  ExecutiveSummary,
  GeminiResponse,
  GeminiError,
} from '../types';

/** Gemini API endpoint for content generation */
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

/** Request timeout in milliseconds */
const REQUEST_TIMEOUT_MS = 30000;

/**
 * JSON Schema for Gemini's structured output.
 * This schema ensures the API returns data matching our ExecutiveSummary interface.
 */
const EXECUTIVE_SUMMARY_SCHEMA = {
  type: 'object',
  properties: {
    overallAssessment: {
      type: 'string',
      description: '2-3 sentence executive summary of the assessment',
    },
    keyFindings: {
      type: 'array',
      items: { type: 'string' },
      description: '3-4 bullet points of main observations',
    },
    priorityActions: {
      type: 'array',
      items: { type: 'string' },
      description: '3 specific next steps ordered by importance',
    },
    recommendedFirstMove: {
      type: 'string',
      description: 'Single most important action for the next 30 days',
    },
    riskConsiderations: {
      type: 'array',
      items: { type: 'string' },
      description: '2-3 risks to be aware of',
    },
  },
  required: [
    'overallAssessment',
    'keyFindings',
    'priorityActions',
    'recommendedFirstMove',
    'riskConsiderations',
  ],
};

/**
 * Builds the detailed prompt for Gemini API based on scores and firm profile.
 *
 * @param scores - The pillar scores from the assessment
 * @param firmProfile - The law firm's profile information
 * @returns Formatted prompt string for the API
 */
function buildPrompt(scores: PillarScores, firmProfile: FirmProfile): string {
  const pillarDetails = scores.pillars
    .map((p) => `- ${p.name}: ${p.score}/100 (Status: ${p.status})`)
    .join('\n');

  const practiceAreas = firmProfile.practiceAreas.join(', ');
  const currentTools = firmProfile.currentTools.length > 0
    ? firmProfile.currentTools.join(', ')
    : 'None specified';
  const aiGoals = firmProfile.aiGoals?.length
    ? firmProfile.aiGoals.join(', ')
    : 'Not specified';
  const attorneyCount = firmProfile.attorneyCount
    ? `${firmProfile.attorneyCount} attorneys`
    : firmProfile.size;

  return `You are an AI readiness consultant specializing in helping law firms adopt artificial intelligence technologies. Your role is to provide strategic, actionable guidance based on assessment data.

## Firm Profile
- **Firm Name:** ${firmProfile.name}
- **Practice Areas:** ${practiceAreas}
- **Firm Size:** ${attorneyCount}
- **Current Technology Tools:** ${currentTools}
- **AI Adoption Goals:** ${aiGoals}

## Assessment Results
**Overall AI Readiness Score:** ${scores.overall}/100
**Readiness Level:** ${scores.readinessLevel}

### Pillar Scores:
${pillarDetails}

## Task
Based on the assessment data above, generate an executive summary for this law firm. Your analysis should be:
- Specific to their practice areas and firm size
- Actionable with concrete next steps
- Realistic about challenges they may face
- Focused on quick wins and high-impact improvements

## Required Output Format
Provide your response as a JSON object with the following structure:

1. **overallAssessment**: Write a 2-3 sentence executive summary that captures the firm's current AI readiness state and potential trajectory. Be direct and specific to this firm.

2. **keyFindings**: Provide 3-4 bullet points highlighting the most important observations from the assessment. Each finding should reference specific pillar scores or firm characteristics.

3. **priorityActions**: List exactly 3 specific, actionable next steps ordered by importance. Each action should be concrete enough to implement within 30-90 days.

4. **recommendedFirstMove**: Identify the single most important action this firm should take in the next 30 days. This should be achievable, high-impact, and build momentum for further AI adoption.

5. **riskConsiderations**: List 2-3 risks or challenges the firm should be aware of as they pursue AI adoption. These should be relevant to their specific situation.

Remember: This is for a law firm, so consider ethical obligations, client confidentiality requirements, and the conservative nature of legal practice in your recommendations.`;
}

/**
 * Validates and normalizes the API response to ensure it matches ExecutiveSummary interface.
 * Fills in defaults for any missing fields.
 *
 * @param data - The parsed response data from the API
 * @returns A validated ExecutiveSummary object with defaults for missing fields
 */
function validateAndNormalizeResponse(data: unknown): ExecutiveSummary {
  const response = data as Partial<ExecutiveSummary>;

  return {
    overallAssessment:
      response.overallAssessment ||
      'Assessment analysis is currently unavailable. Please review your pillar scores directly.',
    keyFindings:
      Array.isArray(response.keyFindings) && response.keyFindings.length > 0
        ? response.keyFindings.slice(0, 4)
        : ['Assessment data has been recorded', 'Review individual pillar scores for detailed insights'],
    priorityActions:
      Array.isArray(response.priorityActions) && response.priorityActions.length > 0
        ? response.priorityActions.slice(0, 3)
        : [
            'Review assessment results with leadership team',
            'Identify quick-win opportunities in highest-scoring areas',
            'Develop an AI adoption roadmap',
          ],
    recommendedFirstMove:
      response.recommendedFirstMove ||
      'Schedule a team meeting to review assessment results and align on AI adoption priorities.',
    riskConsiderations:
      Array.isArray(response.riskConsiderations) && response.riskConsiderations.length > 0
        ? response.riskConsiderations.slice(0, 3)
        : [
            'Ensure compliance with ethical obligations when implementing AI tools',
            'Consider data security implications for client information',
          ],
  };
}

/**
 * Creates a fallback executive summary when the API call fails.
 * This ensures users always receive some guidance even when the AI service is unavailable.
 *
 * @param scores - The pillar scores from the assessment
 * @param firmProfile - The law firm's profile information
 * @returns A basic ExecutiveSummary based on available data
 */
function createFallbackSummary(
  scores: PillarScores,
  firmProfile: FirmProfile
): ExecutiveSummary {
  const lowestPillar = [...scores.pillars].sort((a, b) => a.score - b.score)[0];
  const highestPillar = [...scores.pillars].sort((a, b) => b.score - a.score)[0];

  const sizeContext =
    firmProfile.size === 'Solo' || firmProfile.size === 'Small'
      ? 'smaller firm'
      : 'firm of your size';

  return {
    overallAssessment: `${firmProfile.name} achieved an overall AI readiness score of ${scores.overall}/100, placing you at the "${scores.readinessLevel}" level. This assessment provides a baseline for your AI adoption journey.`,
    keyFindings: [
      `Your strongest area is ${highestPillar.name} with a score of ${highestPillar.score}/100`,
      `${lowestPillar.name} presents the greatest opportunity for improvement at ${lowestPillar.score}/100`,
      `As a ${sizeContext}, focusing on targeted improvements can yield significant results`,
      `Current tool adoption: ${firmProfile.currentTools.length > 0 ? firmProfile.currentTools.join(', ') : 'Limited technology stack identified'}`,
    ],
    priorityActions: [
      `Address gaps in ${lowestPillar.name} to strengthen your overall AI readiness`,
      `Build on your strength in ${highestPillar.name} to create quick wins`,
      'Develop a phased AI adoption roadmap aligned with your practice areas',
    ],
    recommendedFirstMove: `Focus on improving ${lowestPillar.name} by identifying one specific, low-risk AI tool or process that can demonstrate value within 30 days.`,
    riskConsiderations: [
      'Ensure all AI tools comply with bar association ethics rules and client confidentiality requirements',
      'Start with internal processes before client-facing AI applications to build confidence and expertise',
      'Plan for staff training and change management to ensure successful adoption',
    ],
  };
}

/**
 * Fetches with a timeout wrapper.
 *
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param timeoutMs - Timeout in milliseconds
 * @returns Promise resolving to the fetch Response
 * @throws Error if the request times out
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Generates an AI-powered executive summary based on assessment scores and firm profile.
 *
 * This function calls the Gemini API to analyze the assessment data and generate
 * personalized recommendations for the law firm. If the API call fails, it returns
 * a fallback summary based on the available data.
 *
 * @param scores - The pillar scores from the AI readiness assessment
 * @param firmProfile - The law firm's profile information
 * @returns Promise resolving to an ExecutiveSummary object
 *
 * @example
 * ```typescript
 * const scores: PillarScores = {
 *   pillars: [{ id: '1', name: 'Data Infrastructure', score: 75, status: 'strong' }],
 *   overall: 72,
 *   readinessLevel: 'developing'
 * };
 *
 * const firmProfile: FirmProfile = {
 *   name: 'Smith & Associates',
 *   practiceAreas: ['Corporate Law', 'Litigation'],
 *   size: 'Mid-size',
 *   currentTools: ['Clio', 'NetDocuments']
 * };
 *
 * const summary = await generateExecutiveSummary(scores, firmProfile);
 * ```
 */
export async function generateExecutiveSummary(
  scores: PillarScores,
  firmProfile: FirmProfile
): Promise<ExecutiveSummary> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // If no API key is configured, return the fallback summary
  if (!apiKey) {
    console.warn(
      'Gemini API key not configured (VITE_GEMINI_API_KEY). Using fallback summary.'
    );
    return createFallbackSummary(scores, firmProfile);
  }

  const prompt = buildPrompt(scores, firmProfile);

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
      responseSchema: EXECUTIVE_SUMMARY_SCHEMA,
    },
  };

  try {
    const response = await fetchWithTimeout(
      `${GEMINI_API_URL}?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
      REQUEST_TIMEOUT_MS
    );

    if (!response.ok) {
      const errorData = (await response.json()) as GeminiError;
      const errorMessage = errorData.error?.message || 'Unknown API error';
      console.error('Gemini API error:', errorMessage);
      throw new Error(`AI service error: ${errorMessage}`);
    }

    const data = (await response.json()) as GeminiResponse;

    // Extract the text content from the response
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      console.error('Gemini API returned empty response');
      throw new Error('AI service returned an empty response');
    }

    // Parse the JSON response
    let parsedResponse: unknown;
    try {
      parsedResponse = JSON.parse(textContent);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError);
      throw new Error('AI service returned invalid response format');
    }

    // Validate and normalize the response
    return validateAndNormalizeResponse(parsedResponse);
  } catch (error) {
    // Handle abort (timeout) errors
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Gemini API request timed out after', REQUEST_TIMEOUT_MS, 'ms');
      console.warn('Returning fallback summary due to timeout');
      return createFallbackSummary(scores, firmProfile);
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Network error connecting to Gemini API:', error);
      console.warn('Returning fallback summary due to network error');
      return createFallbackSummary(scores, firmProfile);
    }

    // Log and re-throw other errors, but still provide fallback
    console.error('Error generating executive summary:', error);
    console.warn('Returning fallback summary due to error');
    return createFallbackSummary(scores, firmProfile);
  }
}

/**
 * Mock function for development and testing without a Gemini API key.
 *
 * This function simulates the API response with realistic data based on
 * the provided scores and firm profile. Useful for:
 * - Development without API costs
 * - Unit testing
 * - Demo environments
 *
 * @param scores - The pillar scores from the AI readiness assessment
 * @param firmProfile - The law firm's profile information
 * @param delay - Optional delay in milliseconds to simulate API latency (default: 1500)
 * @returns Promise resolving to a mock ExecutiveSummary object
 *
 * @example
 * ```typescript
 * // Use mock in development
 * const summary = await generateExecutiveSummaryMock(scores, firmProfile);
 *
 * // Simulate slower response
 * const summary = await generateExecutiveSummaryMock(scores, firmProfile, 3000);
 * ```
 */
export async function generateExecutiveSummaryMock(
  scores: PillarScores,
  firmProfile: FirmProfile,
  delay: number = 1500
): Promise<ExecutiveSummary> {
  // Simulate API latency
  await new Promise((resolve) => setTimeout(resolve, delay));

  const lowestPillar = [...scores.pillars].sort((a, b) => a.score - b.score)[0];
  const highestPillar = [...scores.pillars].sort((a, b) => b.score - a.score)[0];
  const midPillars = [...scores.pillars]
    .sort((a, b) => a.score - b.score)
    .slice(1, -1);

  const readinessDescriptions: Record<string, string> = {
    'not-ready': 'early stages of AI readiness',
    foundational: 'building foundational AI capabilities',
    developing: 'actively developing AI readiness',
    ready: 'well-positioned for AI adoption',
    optimized: 'leading the way in AI adoption',
  };

  const readinessDesc =
    readinessDescriptions[scores.readinessLevel] || 'developing AI readiness';

  const sizeRecommendations: Record<string, string> = {
    Solo: 'Focus on AI tools that can multiply your individual productivity',
    Small: 'Prioritize tools that enhance collaboration and reduce administrative burden',
    'Mid-size': 'Consider department-specific AI solutions with firm-wide integration',
    Large: 'Develop a comprehensive AI governance framework alongside tool adoption',
    Enterprise: 'Establish an AI Center of Excellence to coordinate firm-wide initiatives',
  };

  const sizeRec =
    sizeRecommendations[firmProfile.size] ||
    'Develop a phased approach to AI adoption';

  return {
    overallAssessment: `${firmProfile.name} scored ${scores.overall}/100 on the AI Readiness Assessment, indicating the firm is ${readinessDesc}. With strengths in ${highestPillar.name} and opportunities for growth in ${lowestPillar.name}, ${firmProfile.name} has a clear path forward for strategic AI adoption that can enhance both efficiency and client service quality.`,
    keyFindings: [
      `Strong foundation in ${highestPillar.name} (${highestPillar.score}/100) provides a solid base for AI initiatives`,
      `${lowestPillar.name} at ${lowestPillar.score}/100 represents the greatest opportunity for improvement`,
      midPillars.length > 0
        ? `${midPillars[0].name} shows moderate readiness (${midPillars[0].score}/100) and could benefit from targeted enhancements`
        : `Overall pillar scores show room for improvement across multiple areas`,
      `Current technology stack (${firmProfile.currentTools.length > 0 ? firmProfile.currentTools.slice(0, 2).join(', ') : 'limited tools'}) provides ${firmProfile.currentTools.length > 2 ? 'a good' : 'a basic'} foundation for AI integration`,
    ],
    priorityActions: [
      `Invest in ${lowestPillar.name} improvements: Identify specific gaps and implement targeted solutions within Q1`,
      `Leverage your ${highestPillar.name} strength: ${sizeRec}`,
      `Establish AI governance: Create clear policies for AI tool evaluation, data handling, and ethical use in client matters`,
    ],
    recommendedFirstMove: `Within the next 30 days, conduct a focused assessment of ${lowestPillar.name} to identify 2-3 specific, low-risk AI tools that can address current gaps. Start with internal processes before expanding to client-facing applications.`,
    riskConsiderations: [
      `Client confidentiality: Ensure all AI tools meet bar association requirements and client data protection standards before deployment`,
      `Change management: Plan for attorney and staff training to maximize adoption and minimize resistance to new AI-powered workflows`,
      `Vendor selection: Carefully evaluate AI vendors for legal-specific experience, security certifications, and long-term viability`,
    ],
  };
}

/**
 * Checks if the Gemini API key is configured in the environment.
 *
 * @returns True if the API key is present and non-empty
 */
export function isGeminiConfigured(): boolean {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  return typeof apiKey === 'string' && apiKey.length > 0;
}
