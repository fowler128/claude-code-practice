#!/usr/bin/env python3
"""
List all Notion databases accessible by your integration.

Usage:
  python list_notion_databases.py

Or set the API key as an environment variable:
  export NOTION_API_KEY=ntn_xxx
  python list_notion_databases.py
"""

import urllib.request
import json
import os

API_KEY = os.environ.get("NOTION_API_KEY")

if not API_KEY:
    print("Error: NOTION_API_KEY environment variable not set.")
    print("\nSet it with:")
    print("  export NOTION_API_KEY=your_api_key_here")
    exit(1)

def list_databases():
    req = urllib.request.Request(
        'https://api.notion.com/v1/search',
        data=json.dumps({"filter": {"value": "database", "property": "object"}}).encode(),
        headers={
            'Authorization': f'Bearer {API_KEY}',
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28'
        },
        method='POST'
    )

    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())

    if not data.get('results'):
        print("No databases found.")
        print("\nMake sure you've shared your databases with the integration:")
        print("1. Open each database in Notion")
        print("2. Click ••• menu > Connections > Add connections")
        print("3. Select your integration")
        return

    print(f"Found {len(data['results'])} database(s):\n")
    print("-" * 60)

    for db in data['results']:
        title = "Untitled"
        if db.get('title') and len(db['title']) > 0:
            title = db['title'][0].get('plain_text', 'Untitled')

        db_id = db['id']
        url = db.get('url', 'N/A')

        print(f"Title: {title}")
        print(f"ID:    {db_id}")
        print(f"URL:   {url}")
        print("-" * 60)

if __name__ == "__main__":
    try:
        list_databases()
    except urllib.error.HTTPError as e:
        print(f"API Error {e.code}: {e.read().decode()}")
    except Exception as e:
        print(f"Error: {e}")
