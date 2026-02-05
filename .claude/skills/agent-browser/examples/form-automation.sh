#!/bin/bash
# Example: Automated form submission with session management

SESSION="contactForm_$(date +%s)"

# Navigate to contact form
echo "Opening contact form..."
agent-browser --session "$SESSION" goto "https://example.com/contact"

# Wait for form to load
sleep 2

# Fill out form fields
echo "Filling form fields..."
agent-browser --session "$SESSION" type "input#name" "John Doe"
agent-browser --session "$SESSION" type "input#email" "john.doe@example.com"
agent-browser --session "$SESSION" type "input#subject" "Product Inquiry"
agent-browser --session "$SESSION" type "textarea#message" "I would like to know more about your products."

# Take screenshot before submission
echo "Capturing form..."
agent-browser --session "$SESSION" screenshot before-submit.png

# Submit form
echo "Submitting form..."
agent-browser --session "$SESSION" click "button[type='submit']"

# Wait for response
sleep 3

# Capture success message
echo "Checking result..."
agent-browser --session "$SESSION" snapshot > form-result.json
agent-browser --session "$SESSION" screenshot after-submit.png

# Extract confirmation message
CONFIRMATION=$(agent-browser --session "$SESSION" evaluate "document.querySelector('.success-message, .confirmation')?.textContent")

echo "Form submitted successfully!"
echo "Confirmation: $CONFIRMATION"
