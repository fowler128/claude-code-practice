/**
 * BizDeedz AI Readiness Audit - Lead Scoring & Form Logic
 *
 * This script handles:
 * - Multi-step wizard navigation
 * - Form validation
 * - Lead scoring algorithm
 * - UTM parameter capture
 * - Spam protection
 * - Form submission
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    totalSteps: 5,
    apiEndpoint: '/api/submit-audit', // Replace with your actual endpoint
    webhookUrl: '', // Optional: Add webhook URL (Make.com, Zapier, etc.)
    googleSheetsUrl: '', // Optional: Google Sheets web app URL

    // Lead tier thresholds
    thresholds: {
        high: 75,    // 75+ = HIGH priority lead
        medium: 50   // 50-74 = MEDIUM, <50 = LOW
    }
};

// Section titles for progress bar
const SECTION_TITLES = {
    1: 'Business Overview',
    2: 'Current Operations',
    3: 'AI & Automation Experience',
    4: 'Timeline & Budget',
    5: 'Final Questions'
};

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

let currentStep = 1;
let formData = {};
let utmParams = {};

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    captureUTMParams();
    initializeForm();
    setupEventListeners();
    checkHoneypot();
});

/**
 * Capture UTM parameters from URL
 */
function captureUTMParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

    utmKeys.forEach(key => {
        const value = urlParams.get(key);
        if (value) {
            utmParams[key] = value;
        }
    });

    // Also capture referrer
    if (document.referrer) {
        utmParams.referrer = document.referrer;
    }

    console.log('UTM Parameters captured:', utmParams);
}

/**
 * Initialize form state
 */
function initializeForm() {
    updateProgress();
    showSection(currentStep);
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Navigation buttons
    document.getElementById('prev-btn').addEventListener('click', handlePrevious);
    document.getElementById('next-btn').addEventListener('click', handleNext);
    document.getElementById('submit-btn').addEventListener('click', handleSubmit);

    // Form submission
    document.getElementById('audit-form').addEventListener('submit', function(e) {
        e.preventDefault();
        handleSubmit();
    });

    // Conditional field displays
    setupConditionalFields();

    // Real-time validation
    setupRealTimeValidation();
}

/**
 * Setup conditional field displays
 */
function setupConditionalFields() {
    // Show AI tools field if experience is not "none"
    const aiExperienceRadios = document.querySelectorAll('input[name="ai_experience"]');
    aiExperienceRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const aiToolsField = document.getElementById('ai-tools-field');
            if (this.value !== 'none') {
                aiToolsField.classList.add('visible');
            } else {
                aiToolsField.classList.remove('visible');
            }
        });
    });

    // Show phone field if preferred contact is phone or video
    const contactRadios = document.querySelectorAll('input[name="preferred_contact"]');
    contactRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const phoneField = document.getElementById('phone-field');
            if (this.value === 'phone' || this.value === 'video') {
                phoneField.classList.add('visible');
                document.getElementById('phone').required = true;
            } else {
                phoneField.classList.remove('visible');
                document.getElementById('phone').required = false;
            }
        });
    });
}

/**
 * Setup real-time validation
 */
function setupRealTimeValidation() {
    // Email validation
    const emailInput = document.getElementById('email');
    emailInput.addEventListener('blur', function() {
        validateEmail(this);
    });

    // Required text inputs
    const requiredInputs = document.querySelectorAll('input[required], select[required], textarea[required]');
    requiredInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value.trim() === '') {
                this.closest('.form-group').classList.add('error');
            } else {
                this.closest('.form-group').classList.remove('error');
            }
        });

        input.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                this.closest('.form-group').classList.remove('error');
            }
        });
    });
}

/**
 * Check for honeypot field (spam protection)
 */
function checkHoneypot() {
    const honeypot = document.querySelector('input[name="website"]');
    if (honeypot) {
        honeypot.setAttribute('tabindex', '-1');
        honeypot.setAttribute('autocomplete', 'off');
    }
}

// ============================================================================
// NAVIGATION
// ============================================================================

/**
 * Handle next button click
 */
function handleNext() {
    if (validateSection(currentStep)) {
        if (currentStep < CONFIG.totalSteps) {
            currentStep++;
            updateProgress();
            showSection(currentStep);
            scrollToTop();
        }
    }
}

/**
 * Handle previous button click
 */
function handlePrevious() {
    if (currentStep > 1) {
        currentStep--;
        updateProgress();
        showSection(currentStep);
        scrollToTop();
    }
}

/**
 * Show specific section
 */
function showSection(sectionNumber) {
    // Hide all sections
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show target section
    const targetSection = document.querySelector(`.form-section[data-section="${sectionNumber}"]`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Update button visibility
    updateButtons();
}

/**
 * Update progress bar and step indicator
 */
function updateProgress() {
    const progressPercentage = (currentStep / CONFIG.totalSteps) * 100;
    document.getElementById('progress-fill').style.width = progressPercentage + '%';
    document.getElementById('current-step').textContent = currentStep;
    document.getElementById('step-title').textContent = SECTION_TITLES[currentStep];
}

/**
 * Update navigation button visibility
 */
function updateButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');

    // Previous button
    if (currentStep === 1) {
        prevBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'inline-flex';
    }

    // Next vs Submit button
    if (currentStep === CONFIG.totalSteps) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-flex';
    } else {
        nextBtn.style.display = 'inline-flex';
        submitBtn.style.display = 'none';
    }
}

/**
 * Scroll to top of form
 */
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate current section
 */
function validateSection(sectionNumber) {
    const section = document.querySelector(`.form-section[data-section="${sectionNumber}"]`);
    let isValid = true;

    // Validate required text inputs, selects, and textareas
    const requiredFields = section.querySelectorAll('input[required], select[required], textarea[required]');
    requiredFields.forEach(field => {
        if (field.type !== 'radio' && field.type !== 'checkbox') {
            if (field.value.trim() === '') {
                field.closest('.form-group').classList.add('error');
                isValid = false;
            } else {
                field.closest('.form-group').classList.remove('error');
            }
        }
    });

    // Validate email
    const emailField = section.querySelector('input[type="email"]');
    if (emailField && !validateEmail(emailField)) {
        isValid = false;
    }

    // Validate radio groups
    const radioGroups = {};
    section.querySelectorAll('input[type="radio"][required]').forEach(radio => {
        if (!radioGroups[radio.name]) {
            radioGroups[radio.name] = [];
        }
        radioGroups[radio.name].push(radio);
    });

    Object.keys(radioGroups).forEach(groupName => {
        const isChecked = radioGroups[groupName].some(radio => radio.checked);
        const errorMsg = document.getElementById(groupName + '-error');

        if (!isChecked) {
            if (errorMsg) errorMsg.classList.add('visible');
            isValid = false;
        } else {
            if (errorMsg) errorMsg.classList.remove('visible');
        }
    });

    // Validate checkbox groups (at least one must be checked for certain questions)
    if (sectionNumber === 2) {
        const challenges = section.querySelectorAll('input[name="challenges"]:checked');
        const challengesError = document.getElementById('challenges-error');
        if (challenges.length === 0) {
            challengesError.classList.add('visible');
            isValid = false;
        } else {
            challengesError.classList.remove('visible');
        }
    }

    if (sectionNumber === 3) {
        const automationGoals = section.querySelectorAll('input[name="automation_goals"]:checked');
        const goalsError = document.getElementById('automation-goals-error');
        if (automationGoals.length === 0) {
            goalsError.classList.add('visible');
            isValid = false;
        } else {
            goalsError.classList.remove('visible');
        }
    }

    // Validate consent checkbox (section 5)
    if (sectionNumber === 5) {
        const consent = document.getElementById('consent');
        const consentError = document.getElementById('consent-error');
        if (!consent.checked) {
            consentError.classList.add('visible');
            isValid = false;
        } else {
            consentError.classList.remove('visible');
        }
    }

    return isValid;
}

/**
 * Validate email address
 */
function validateEmail(emailField) {
    const email = emailField.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email === '') {
        return false;
    }

    if (!emailRegex.test(email)) {
        emailField.closest('.form-group').classList.add('error');
        return false;
    }

    // Check for common free email domains (optional - adjust based on your needs)
    const freeEmailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const domain = email.split('@')[1];

    // You can use this to flag personal emails vs business emails
    // For now, we just validate format

    emailField.closest('.form-group').classList.remove('error');
    return true;
}

// ============================================================================
// FORM DATA COLLECTION
// ============================================================================

/**
 * Collect all form data
 */
function collectFormData() {
    const form = document.getElementById('audit-form');
    const data = {};

    // Get all input, select, and textarea elements
    const elements = form.querySelectorAll('input, select, textarea');

    elements.forEach(element => {
        const name = element.name;

        if (!name || name === 'website') return; // Skip honeypot

        if (element.type === 'checkbox') {
            if (!data[name]) {
                data[name] = [];
            }
            if (element.checked) {
                data[name].push(element.value);
            }
        } else if (element.type === 'radio') {
            if (element.checked) {
                data[name] = element.value;
            }
        } else {
            data[name] = element.value;
        }
    });

    // Add UTM parameters
    data.utm_params = utmParams;

    // Add timestamp
    data.submitted_at = new Date().toISOString();

    // Calculate lead score
    const scoreData = calculateLeadScore(data);
    data.lead_score = scoreData.score;
    data.lead_tier = scoreData.tier;
    data.score_breakdown = scoreData.breakdown;

    return data;
}

// ============================================================================
// LEAD SCORING ALGORITHM
// ============================================================================

/**
 * Calculate lead score and tier
 */
function calculateLeadScore(data) {
    let score = 0;
    const breakdown = {};

    // 1. DATA QUALITY SCORE (0-20 points)
    let dataScore = 0;
    if (data.data_quality === 'clean') {
        dataScore = 20;
    } else if (data.data_quality === 'mixed') {
        dataScore = 12;
    } else if (data.data_quality === 'chaotic') {
        dataScore = 5;
    } else {
        dataScore = 8;
    }
    breakdown.data_quality = dataScore;
    score += dataScore;

    // 2. AI READINESS SCORE (0-20 points)
    let aiReadinessScore = 0;
    if (data.ai_experience === 'advanced') {
        aiReadinessScore = 20;
    } else if (data.ai_experience === 'moderate') {
        aiReadinessScore = 15;
    } else if (data.ai_experience === 'basic') {
        aiReadinessScore = 10;
    } else {
        aiReadinessScore = 5;
    }
    breakdown.ai_readiness = aiReadinessScore;
    score += aiReadinessScore;

    // 3. TIMELINE/URGENCY SCORE (0-20 points)
    let timelineScore = 0;
    if (data.timeline === 'asap') {
        timelineScore = 20;
    } else if (data.timeline === '1-month') {
        timelineScore = 15;
    } else if (data.timeline === '1-3-months') {
        timelineScore = 10;
    } else {
        timelineScore = 3;
    }
    breakdown.timeline = timelineScore;
    score += timelineScore;

    // 4. BUDGET SCORE (0-25 points)
    let budgetScore = 0;
    if (data.budget_range === '10000+') {
        budgetScore = 25;
    } else if (data.budget_range === '5000-10000') {
        budgetScore = 20;
    } else if (data.budget_range === '2500-5000') {
        budgetScore = 15;
    } else if (data.budget_range === '1000-2500') {
        budgetScore = 10;
    } else {
        budgetScore = 5;
    }

    // Bonus for approved budget
    if (data.budget_allocated === 'yes-approved') {
        budgetScore += 5;
    }

    breakdown.budget = Math.min(budgetScore, 25);
    score += Math.min(budgetScore, 25);

    // 5. DECISION AUTHORITY SCORE (0-15 points)
    let authorityScore = 0;
    if (data.decision_maker === 'yes') {
        authorityScore = 15;
    } else if (data.decision_maker === 'influence') {
        authorityScore = 12;
    } else if (data.decision_maker === 'team-decision') {
        authorityScore = 8;
    } else {
        authorityScore = 4;
    }
    breakdown.authority = authorityScore;
    score += authorityScore;

    // Bonus points (can add up to 15 more points)
    let bonusPoints = 0;

    // Process documentation bonus (+5)
    if (data.process_documentation === 'fully' || data.process_documentation === 'partially') {
        bonusPoints += 5;
    }

    // Pain level bonus (+5)
    if (data.hours_wasted === '40+' || data.hours_wasted === '20-40') {
        bonusPoints += 5;
    }

    // Company size bonus (+5) - larger companies typically have more budget
    if (data.company_size === '201-500' || data.company_size === '500+') {
        bonusPoints += 3;
    } else if (data.company_size === '51-200') {
        bonusPoints += 2;
    }

    breakdown.bonus = bonusPoints;
    score += bonusPoints;

    // Determine tier based on composite factors
    let tier = 'LOW';

    // HIGH tier criteria:
    // - Score 75+ OR
    // - Clean/mixed data + high/moderate AI readiness + ASAP/1-month timeline + $2500+ budget
    if (score >= CONFIG.thresholds.high) {
        tier = 'HIGH';
    } else if (
        (data.data_quality === 'clean' || data.data_quality === 'mixed') &&
        (data.ai_experience === 'advanced' || data.ai_experience === 'moderate') &&
        (data.timeline === 'asap' || data.timeline === '1-month') &&
        (data.budget_range === '2500-5000' || data.budget_range === '5000-10000' || data.budget_range === '10000+')
    ) {
        tier = 'HIGH';
        score = Math.max(score, CONFIG.thresholds.high); // Bump score to minimum HIGH
    }
    // MEDIUM tier criteria:
    // - Score 50-74 OR
    // - Mixed signals but willing to invest
    else if (score >= CONFIG.thresholds.medium) {
        tier = 'MEDIUM';
    } else if (
        data.budget_range !== 'under-1000' &&
        data.timeline !== 'exploring' &&
        (data.challenges && data.challenges.length >= 3) // Has multiple pain points
    ) {
        tier = 'MEDIUM';
        score = Math.max(score, CONFIG.thresholds.medium); // Bump to minimum MEDIUM
    }

    return {
        score: Math.round(score),
        tier: tier,
        breakdown: breakdown
    };
}

// ============================================================================
// FORM SUBMISSION
// ============================================================================

/**
 * Handle form submission
 */
async function handleSubmit() {
    // Validate final section
    if (!validateSection(currentStep)) {
        return;
    }

    // Check honeypot
    const honeypot = document.querySelector('input[name="website"]').value;
    if (honeypot !== '') {
        console.log('Honeypot triggered - potential spam');
        // Silently reject or handle as spam
        showSuccessMessage();
        return;
    }

    // Collect data
    const data = collectFormData();
    console.log('Form data collected:', data);
    console.log('Lead Score:', data.lead_score, '| Tier:', data.lead_tier);

    // Disable submit button
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Submitting...';

    try {
        // Submit to your backend/webhook
        await submitData(data);

        // Show success message
        showSuccessMessage();

        // Optional: Track conversion
        trackConversion(data);

    } catch (error) {
        console.error('Submission error:', error);
        alert('There was an error submitting your audit. Please try again or contact us directly.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Audit';
    }
}

/**
 * Submit data to backend/webhook
 */
async function submitData(data) {
    // Option 1: Submit to your API endpoint
    if (CONFIG.apiEndpoint) {
        const response = await fetch(CONFIG.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('API submission failed');
        }
    }

    // Option 2: Submit to webhook (Make.com, Zapier, etc.)
    if (CONFIG.webhookUrl) {
        const webhookResponse = await fetch(CONFIG.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!webhookResponse.ok) {
            throw new Error('Webhook submission failed');
        }
    }

    // Option 3: Submit to Google Sheets (via web app)
    if (CONFIG.googleSheetsUrl) {
        const sheetsResponse = await fetch(CONFIG.googleSheetsUrl, {
            method: 'POST',
            mode: 'no-cors', // Google Apps Script requires this
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
    }

    // If no endpoints configured, just log (for testing)
    if (!CONFIG.apiEndpoint && !CONFIG.webhookUrl && !CONFIG.googleSheetsUrl) {
        console.log('No submission endpoint configured. Data logged to console.');
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

/**
 * Show success message
 */
function showSuccessMessage() {
    document.getElementById('audit-form').style.display = 'none';
    document.querySelector('.form-navigation').style.display = 'none';
    document.getElementById('success-message').classList.add('visible');
}

/**
 * Track conversion (optional analytics)
 */
function trackConversion(data) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', 'form_submit', {
            'event_category': 'AI Readiness Audit',
            'event_label': data.lead_tier,
            'value': data.lead_score
        });
    }

    // Facebook Pixel
    if (typeof fbq !== 'undefined') {
        fbq('track', 'Lead', {
            content_name: 'AI Readiness Audit',
            content_category: data.lead_tier
        });
    }

    // LinkedIn Insight Tag
    if (typeof lintrk !== 'undefined') {
        lintrk('track', { conversion_id: 'YOUR_CONVERSION_ID' });
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format data for CRM/email
 */
function formatDataForEmail(data) {
    return `
AI READINESS AUDIT SUBMISSION
==============================

LEAD SCORE: ${data.lead_score}/100
LEAD TIER: ${data.lead_tier}

Score Breakdown:
- Data Quality: ${data.score_breakdown.data_quality}/20
- AI Readiness: ${data.score_breakdown.ai_readiness}/20
- Timeline: ${data.score_breakdown.timeline}/20
- Budget: ${data.score_breakdown.budget}/25
- Authority: ${data.score_breakdown.authority}/15
- Bonus Points: ${data.score_breakdown.bonus}

CONTACT INFORMATION
-------------------
Name: ${data.full_name}
Email: ${data.email}
Job Title: ${data.job_title}
Company: ${data.company_name}
Company Size: ${data.company_size}
Industry: ${data.industry}
Website: ${data.website_url || 'N/A'}
Phone: ${data.phone || 'N/A'}
Preferred Contact: ${data.preferred_contact}

BUSINESS OVERVIEW
-----------------
Challenges: ${data.challenges ? data.challenges.join(', ') : 'N/A'}
Tools Used: ${data.tools_used}
Data Quality: ${data.data_quality}
Process Documentation: ${data.process_documentation}
Hours Wasted on Repetitive Tasks: ${data.hours_wasted}/week

AI & AUTOMATION
---------------
AI Experience: ${data.ai_experience}
Current AI Tools: ${data.ai_tools_current || 'None'}
Automation Goals: ${data.automation_goals ? data.automation_goals.join(', ') : 'N/A'}
Biggest Bottleneck: ${data.biggest_bottleneck}
AI Concerns: ${data.ai_concerns ? data.ai_concerns.join(', ') : 'None'}

TIMELINE & BUDGET
-----------------
Timeline: ${data.timeline}
Decision Maker: ${data.decision_maker}
Budget Allocated: ${data.budget_allocated}
Budget Range: ${data.budget_range}
ROI Timeframe: ${data.roi_timeframe}
Success Metric: ${data.success_metric}

ADDITIONAL INFO
---------------
Heard About Us: ${data.hear_about || 'N/A'}
Additional Context: ${data.additional_context || 'None'}

UTM PARAMETERS
--------------
${Object.keys(data.utm_params).length > 0 ?
    Object.entries(data.utm_params).map(([key, value]) => `${key}: ${value}`).join('\n') :
    'None'}

Submitted: ${data.submitted_at}
    `.trim();
}

/**
 * Export data as CSV row (for Google Sheets)
 */
function formatDataForSpreadsheet(data) {
    return {
        timestamp: data.submitted_at,
        lead_score: data.lead_score,
        lead_tier: data.lead_tier,
        full_name: data.full_name,
        email: data.email,
        company_name: data.company_name,
        job_title: data.job_title,
        company_size: data.company_size,
        industry: data.industry,
        website_url: data.website_url || '',
        phone: data.phone || '',
        preferred_contact: data.preferred_contact,
        challenges: data.challenges ? data.challenges.join('; ') : '',
        tools_used: data.tools_used,
        data_quality: data.data_quality,
        process_documentation: data.process_documentation,
        hours_wasted: data.hours_wasted,
        ai_experience: data.ai_experience,
        ai_tools_current: data.ai_tools_current || '',
        automation_goals: data.automation_goals ? data.automation_goals.join('; ') : '',
        biggest_bottleneck: data.biggest_bottleneck,
        ai_concerns: data.ai_concerns ? data.ai_concerns.join('; ') : '',
        timeline: data.timeline,
        decision_maker: data.decision_maker,
        budget_allocated: data.budget_allocated,
        budget_range: data.budget_range,
        roi_timeframe: data.roi_timeframe,
        success_metric: data.success_metric,
        hear_about: data.hear_about || '',
        additional_context: data.additional_context || '',
        utm_source: data.utm_params.utm_source || '',
        utm_medium: data.utm_params.utm_medium || '',
        utm_campaign: data.utm_params.utm_campaign || '',
        utm_term: data.utm_params.utm_term || '',
        utm_content: data.utm_params.utm_content || '',
        referrer: data.utm_params.referrer || ''
    };
}

// ============================================================================
// EXPORT FOR TESTING
// ============================================================================

// Export functions for testing (if using module system)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateLeadScore,
        collectFormData,
        formatDataForEmail,
        formatDataForSpreadsheet
    };
}
