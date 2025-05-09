#!/usr/bin/env node

import { FastMCP } from "fastmcp";
import memoryTools from "./src/tools/memoryTools.js";
import { memoryService } from "./src/services/memoryService.js";

// Read RPC endpoint and default memoryId from environment variables
const rpcEndpoint = process.env.MMP_RPC_ENDPOINT || "http://localhost:18080/rpc";
const defaultMemoryId = process.env.MMP_DEFAULT_MEMORY_ID || "";

// Set default memoryId in memoryService if provided
if (defaultMemoryId) {
  memoryService.setDefaultMemoryId(defaultMemoryId);
}

// Log RPC endpoint if configured
if (rpcEndpoint) {
  // Set global RPC endpoint in process.env for use in services
  process.env.MMP_RPC_ENDPOINT = rpcEndpoint;
}

// Create MCP server
const server = new FastMCP({
  name: "MMP-MCP",
  version: "1.0.0",
});

// Register all memory tools
for (const tool of Object.values(memoryTools)) {
  server.addTool(tool as any);
}

// Add server information prompt
server.addTool({
  name: "how-to-use-mmp",
  description: "Get information about Model-Memory-Protocol",
  execute: async () => {
    let info = `
# Model-Memory-Protocol (MMP)

MMP is an open protocol for AI model memory management, supporting hierarchical structured memory storage and retrieval.

## Vision

MMP addresses the core challenge of long-term memory management for Large Language Models (LLMs). As AI systems become more powerful, they need to effectively store, retrieve, and update knowledge. MMP provides a structured way to organize and manipulate these "memories", enabling AI to:

1. **Build persistent knowledge trees**: Overcome LLM context window limitations
2. **Standardize memory interactions**: Provide unified interfaces for AI systems to share memories
3. **Structured knowledge management**: Organize memories in a tree structure for hierarchical management
4. **Enhance model capabilities**: Allow AI to accumulate knowledge over time`;

    if (defaultMemoryId) {
      info += `\n\n## Default Memory ID\n\nCurrent default Memory ID: \`${defaultMemoryId}\``;
    }

    if (rpcEndpoint) {
      info += `\n\n## RPC Endpoint\n\nCurrent RPC endpoint: \`${rpcEndpoint}\``;
    }

    info += `

## Available Tools

- memory-get-init-nodes: Retrieve all nodes that need initialization
- memory-add: Add a memory node to the specified memory tree
- memory-get: Retrieve a memory node from the specified path
- memory-list: List memory nodes matching specified criteria
- memory-update: Update an existing memory node
- memory-delete: Delete a memory node with optional recursive deletion
- memory-batch-get: Batch retrieve multiple memory nodes
- memcolletcion-create: Create a new memory collection with unique ID
- memcolletcion-apply-template: Apply a memory node template to a memory collection

## Example Workflow

### Get memory node content
1. Use \`memory-list\` to get all memory nodes
2. Use \`memory-get\` to get the content of a specific memory node

### Create a new memory collection
1. First use \`memcolletcion-create\` to create a new memory collection
2. Then use \`memory-add\` to add memory nodes
3. Use \`memory-get\` to retrieve specific node content
4. Browse the memory tree structure with \`memory-list\`

### Apply a memory node template
1. Use \`memcolletcion-apply-template\` to apply a memory node template to a memory collection
2. Use \`memory-update\` to update the memory node
3. Use \`memory-get\` to retrieve specific node content
4. Browse the memory tree structure with \`memory-list\`

### Update memory node content
1. Use \`memory-list\` to get all memory nodes
2. Use \`memory-get\` to get the content of a specific memory node
3. Use \`memory-update\` to update the content of a specific memory node


`;
    return info;
  },
});

server.start({
  transportType: "stdio",
});