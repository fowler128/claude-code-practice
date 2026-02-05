#!/bin/bash
# Example: Scraping product information from an e-commerce site

# Navigate to product page
agent-browser goto "https://example-shop.com/products"

# Wait for page to load and get structure
echo "Getting page structure..."
agent-browser snapshot > product-page.json

# Extract product names and prices
echo "Extracting product data..."
agent-browser evaluate "
  Array.from(document.querySelectorAll('.product-card')).map(card => ({
    name: card.querySelector('.product-name')?.textContent.trim(),
    price: card.querySelector('.product-price')?.textContent.trim(),
    image: card.querySelector('img')?.src,
    link: card.querySelector('a')?.href
  }))
" > products.json

# Take screenshot for verification
echo "Taking screenshot..."
agent-browser screenshot products-page.png

echo "Scraping complete! Check products.json for data."
