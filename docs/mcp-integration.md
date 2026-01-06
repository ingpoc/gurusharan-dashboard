# MCP Integration Guide

## Overview

This project integrates with two Model Context Protocol (MCP) servers:

1. **Tavily MCP** - Web research for content ideas
2. **Context-Graph MCP** - Pattern learning and decision storage

## Tavily MCP

### Purpose

Fetch current information about topics for content creation.

### Usage in Autonomous Workflow

```typescript
// src/lib/autonomous-workflow.ts
// Lines 291-339

const researchPrompt = `Research and provide current information about: ${topic}...`;

const Anthropic = (await import('@anthropic-ai/sdk')).default;
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const response = await anthropic.messages.create({
  model: 'claude-3-haiku-20240307',
  max_tokens: 1000,
  messages: [{ role: 'user', content: researchPrompt }],
});
```

### Fallback Strategy

When Tavily is unavailable:

- Falls back to Claude's internal knowledge
- Still caches results for 7 days
- Logs fallback for monitoring

### Setup

```bash
# Optional: Set Tavily API key for enhanced research
TAVILY_API_KEY=tvly-your-key-here
```

Without Tavily, the system uses Claude's knowledge (sufficient for most use cases).

## Context-Graph MCP

### Purpose

Store and retrieve decisions about successful content patterns.

### Usage in Autonomous Workflow

```typescript
// Learning phase stores patterns
await context_store_trace({
  decision: 'Successful post on topic: AI trends',
  category: 'posting',
  outcome: 'success',
});

// Research phase queries successful patterns
const patterns = await context_query_traces({
  query: 'successful AI content topics',
  limit: 5,
});
```

### Data Stored

| Field | Description |
|-------|-------------|
| decision | What was decided |
| category | framework, architecture, api, error, testing, deployment |
| outcome | pending, success, failure |
| feature_id | Related feature (optional) |
| timestamp | When the decision was made |

### Setup

Context-graph MCP requires:

- Voyage AI API key for embeddings
- ChromaDB for vector storage

```bash
# Required for context-graph
VOYAGE_API_KEY=your-voyage-key
```

## Local MCP Setup

### Install MCP Servers

```bash
# Context-graph MCP
npm install -g @anthropic-ai/mcp-server-context-graph

# Token-efficient MCP (for data processing)
npm install -g @anthropic-ai/mcp-server-token-efficient
```

### Configure MCP (`.mcp.json`)

```json
{
  "mcpServers": {
    "context-graph": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-context-graph"]
    },
    "token-efficient": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-token-efficient"]
    }
  }
}
```

## MCP Tools Reference

### Context-Graph Tools

| Tool | Purpose |
|------|---------|
| `context_store_trace` | Store decision with embedding |
| `context_query_traces` | Semantic search for similar decisions |
| `context_update_outcome` | Mark decision as success/failure |
| `context_list_traces` | List all traces with pagination |
| `context_list_categories` | Browse all categories |

### Token-Efficient Tools

| Tool | Purpose | Savings |
|------|---------|---------|
| `execute_code` | Python/Bash/Node in sandbox | 98% |
| `process_csv` | CSV with filters | 99% |
| `process_logs` | Log pattern matching | 95% |

## Troubleshooting

### MCP Server Not Running

```bash
# Check MCP server status
ps aux | grep mcp

# Restart MCP servers
killall mcp-server
npm start
```

### Context-Graph Embeddings Failing

```bash
# Check Voyage API key
echo $VOYAGE_API_KEY

# Test embeddings
curl https://api.voyageai.com/v1/embeddings \
  -H "Authorization: Bearer $VOYAGE_API_KEY" \
  -d '{"input": "test", "model": "voyage-3"}'
```

### Token-Efficient MCP Timeouts

Increase timeout in `.mcp.json`:

```json
{
  "mcpServers": {
    "token-efficient": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-token-efficient"],
      "timeout": 120000
    }
  }
}
```

## Best Practices

1. **Store Decisions Early** - Use `context_store_trace` before implementation
2. **Update Outcomes** - Mark decisions as success/failure after verification
3. **Query Before Implementing** - Use `context_query_traces` to find similar patterns
4. **Use Token-Efficient for Data** - Process logs/CSVs with `execute_code`, not raw loading
5. **Cache Research Results** - Store in `ResearchCache` to avoid repeated API calls

## Future MCP Integrations

Potential additions:

- **Tavily MCP** - Official web search integration
- **MCP Server for Analytics** - Post engagement tracking
- **MCP Server for Scheduling** - Advanced time-based posting
