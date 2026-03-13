# Open Brain - AI Agent Integration Guide

This document explains how AI agents can read from and write to your Open Brain.

## API Endpoints

Your deployed Open Brain will have these endpoints:

```
GET    https://your-app.vercel.app/api/brain          # List all entries
POST   https://your-app.vercel.app/api/brain          # Create entry
GET    https://your-app.vercel.app/api/brain/[id]     # Get single entry
PUT    https://your-app.vercel.app/api/brain/[id]     # Update entry
DELETE https://your-app.vercel.app/api/brain/[id]      # Delete entry
```

## Query Parameters

- `category` - Filter by category (memory, relationship, project, goal)
- `tags` - Filter by tags (comma-separated)

## Example: Reading from Brain

```bash
# Get all memories
curl "https://your-app.vercel.app/api/brain?category=memory"

# Get contacts
curl "https://your-app.vercel.app/api/brain?category=relationship"

# Get entries tagged with "important"
curl "https://your-app.vercel.app/api/brain?tags=important"
```

## Example: Writing to Brain

```bash
# Add a new memory
curl -X POST "https://your-app.vercel.app/api/brain" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "memory",
    "title": "Meeting with John",
    "content": "Discussed project timeline and deliverables",
    "tags": ["work", "meeting"]
  }'

# Add a new contact
curl -X POST "https://your-app.vercel.app/api/brain" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "relationship",
    "title": "Sarah Chen",
    "content": "Met at conference. Interested in AI collaboration.",
    "tags": ["professional", "ai"]
  }'

# Add a goal
curl -X POST "https://your-app.vercel.app/api/brain" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "goal",
    "title": "Learn Rust",
    "content": "Complete Rust book and build a CLI tool",
    "tags": ["learning", "programming"]
  }'
```

## AI Platform Integration Prompts

### Claude (Anthropic)

System prompt to give Claude access to your brain:

```
You have access to a personal knowledge base called "Open Brain". 
You can read from it to remember information about the user, and write 
to it to save important information.

To read: make a GET request to https://your-app.vercel.app/api/brain with 
optional category or tags parameters.

To write: make a POST request to https://your-app.vercel.app/api/brain 
with JSON body containing category, title, content, and optional tags.

Always ask permission before writing to the brain, unless the user 
explicitly asks you to remember something.
```

### ChatGPT / OpenAI

```
You have access to a personal knowledge base via REST API. 

Read entries:
GET https://your-app.vercel.app/api/brain?category=memory

Create entries:
POST https://your-app.vercel.app/api/brain
Headers: Content-Type: application/json
Body: {"category": "memory", "title": "...", "content": "...", "tags": ["..."]}

Use this to remember user preferences, important facts, and context 
across conversations. Ask before writing.
```

### Cursor / Other AI Code Editors

In Cursor, you can use the built-in MCP (Model Context Protocol) or add 
a custom command. Create a `.cursorrules` file:

```
## Open Brain Integration

You can access the user's personal knowledge base via REST API:

- Read: GET https://your-app.vercel.app/api/brain?category=X
- Write: POST https://your-app.vercel.app/api/brain

Always reference the brain when the user asks about:
- Their projects, goals, or tasks
- People they know (relationships)
- Things they've previously discussed
- Their preferences or background

Ask before writing new information to the brain.
```

### n8n Automation

Create an n8n workflow with HTTP Request node:

```
1. Trigger: On chat message
2. HTTP Request: GET brain entries matching context
3. AI Agent: Use brain data as context
4. (Optional) HTTP Request: POST to save important info
```

### Make.com (Integromat)

Similar setup - use HTTP modules to connect to your brain API.

## JSON Response Format

All responses follow this format:

```json
{
  "data": [
    {
      "id": "uuid-here",
      "category": "memory",
      "title": "Entry Title",
      "content": "Entry content...",
      "metadata": {},
      "tags": ["tag1", "tag2"],
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## Best Practices

1. **Always ask before writing** - Don't surprise the user with saves
2. **Use consistent categories** - memory, relationship, project, goal
3. **Tag liberally** - Makes filtering easier for agents
4. **Keep titles descriptive** - AI agents search by title
5. **Include context in content** - Full details for agent understanding
