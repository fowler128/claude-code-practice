# NotebookLM Python Library Setup

This project includes the **notebooklm-py** library, an unofficial Python API for Google NotebookLM.

## Installation

The notebooklm-py library is specified in `requirements.txt` with browser support enabled.

### Quick Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Install Chromium browser for authentication
playwright install chromium
```

### Verify Installation

```bash
# Check CLI is available
notebooklm --version
```

## What You Can Do

- **Create and manage notebooks** programmatically
- **Add sources** (URLs, PDFs, YouTube videos, Google Drive files)
- **Chat** with your sources and get answers
- **Generate content**: podcasts, videos, quizzes, flashcards, slide decks, infographics, mind maps, data tables
- **Download artifacts** in various formats (MP3, MP4, PDF, PNG, JSON, CSV)
- **Export to Google Docs/Sheets**

## Usage Examples

### Command Line (CLI)

```bash
# Authenticate (opens browser)
notebooklm login

# Create a notebook
notebooklm create "My Research"

# Add sources
notebooklm source add "https://example.com"
notebooklm source add "./paper.pdf"

# Generate content
notebooklm generate audio "make it engaging" --wait
notebooklm generate quiz --difficulty hard

# Download artifacts
notebooklm download audio ./podcast.mp3
notebooklm download quiz --format markdown ./quiz.md
```

### Python API

```python
import asyncio
from notebooklm import NotebookLMClient

async def main():
    async with await NotebookLMClient.from_storage() as client:
        # Create notebook and add sources
        nb = await client.notebooks.create("Research")
        await client.sources.add_url(nb.id, "https://example.com", wait=True)

        # Chat with your sources
        result = await client.chat.ask(nb.id, "Summarize this")
        print(result.answer)

        # Generate content
        status = await client.artifacts.generate_audio(nb.id, instructions="make it fun")
        await client.artifacts.wait_for_completion(nb.id, status.task_id)
        await client.artifacts.download_audio(nb.id, "podcast.mp3")

asyncio.run(main())
```

## Important Notes

⚠️ **Unofficial Library** - This uses undocumented Google APIs that can change without notice.

- Not affiliated with Google
- APIs may break anytime
- Rate limits apply to heavy usage
- Best for prototypes, research, and personal projects

## Documentation

- **[GitHub Repository](https://github.com/teng-lin/notebooklm-py)** - Full documentation and source code
- **[CLI Reference](https://github.com/teng-lin/notebooklm-py/blob/main/docs/cli-reference.md)** - Complete command documentation
- **[Python API](https://github.com/teng-lin/notebooklm-py/blob/main/docs/python-api.md)** - Full API reference
- **[Configuration](https://github.com/teng-lin/notebooklm-py/blob/main/docs/configuration.md)** - Storage and settings
- **[Troubleshooting](https://github.com/teng-lin/notebooklm-py/blob/main/docs/troubleshooting.md)** - Common issues and solutions

## Version

- notebooklm-py: 0.3.3
- Python: 3.10+
