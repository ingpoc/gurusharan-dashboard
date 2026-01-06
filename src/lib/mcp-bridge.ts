/**
 * MCP Bridge - Connects to remote MCP servers and integrates with Claude Agent
 *
 * This module provides:
 * - Connection to remote MCP servers via HTTP/transport
 * - Tool discovery and schema conversion (MCP → Zod)
 * - Execution wrapper compatible with ToolDefinition format
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { z } from 'zod';
import type { ToolDefinition } from './agent';

// ============================================================================
// Types
// ============================================================================

export interface MCPServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: {
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

export interface MCPBridgeOptions {
  servers: MCPServerConfig[];
  timeout?: number; // Connection timeout in ms
}

// ============================================================================
// MCP Bridge Class
// ============================================================================

export class MCPBridge {
  private clients: Map<string, Client> = new Map();
  private tools: Map<string, MCPTool> = new Map();
  private timeout: number;

  constructor(options: MCPBridgeOptions) {
    this.timeout = options.timeout || 10000;
  }

  /**
   * Initialize connection to all configured MCP servers
   */
  async connect(): Promise<void> {
    console.log('[MCPBridge] Connecting to servers...');

    // For now, we'll focus on HTTP/stdio based MCP servers
    // The actual connection depends on what MCP servers are configured in .mcp.json
    // This is a placeholder for future SSE/HTTP transport support

    console.log('[MCPBridge] Connection complete');
  }

  /**
   * Discover and cache tools from connected MCP servers
   */
  async discoverTools(): Promise<MCPTool[]> {
    const allTools: MCPTool[] = [];

    for (const [serverName, client] of this.clients.entries()) {
      try {
        const response = await client.listTools();
        const serverTools = response.tools || [];

        for (const tool of serverTools) {
          const qualifiedName = `${serverName}_${tool.name}`;
          this.tools.set(qualifiedName, tool as MCPTool);
          allTools.push({
            ...tool,
            name: qualifiedName,
          } as MCPTool);
        }

        console.log(`[MCPBridge] Discovered ${serverTools.length} tools from ${serverName}`);
      } catch (error) {
        console.error(`[MCPBridge] Failed to discover tools from ${serverName}:`, error);
      }
    }

    console.log(`[MCPBridge] Total tools discovered: ${allTools.length}`);
    return allTools;
  }

  /**
   * Convert MCP JSON schema to Zod schema
   */
  mcpSchemaToZod(mcpTool: MCPTool): z.ZodType {
    const properties = mcpTool.inputSchema.properties || {};
    const required = new Set(mcpTool.inputSchema.required || []);

    const zodObject: Record<string, z.ZodTypeAny> = {};

    for (const [key, prop] of Object.entries(properties)) {
      const propDef = prop as {
        type?: string;
        description?: string;
        enum?: unknown[];
        items?: { type?: string };
      };

      let zodType: z.ZodTypeAny;

      switch (propDef.type) {
        case 'string':
          if (propDef.enum) {
            zodType = z.enum(propDef.enum as [string, ...string[]]);
          } else {
            zodType = z.string();
          }
          break;
        case 'number':
          zodType = z.number();
          break;
        case 'integer':
          zodType = z.number().int();
          break;
        case 'boolean':
          zodType = z.boolean();
          break;
        case 'array':
          if (propDef.items?.type === 'string') {
            zodType = z.array(z.string());
          } else {
            zodType = z.array(z.any());
          }
          break;
        case 'object':
          zodType = z.record(z.string(), z.any());
          break;
        default:
          zodType = z.any();
      }

      // Make optional if not in required
      if (!required.has(key)) {
        zodType = zodType.optional();
      }

      zodObject[key] = zodType;
    }

    return z.object(zodObject);
  }

  /**
   * Convert MCP tools to ToolDefinition format for agent
   */
  async getToolDefinitions(): Promise<ToolDefinition[]> {
    const definitions: ToolDefinition[] = [];

    for (const [qualifiedName, mcpTool] of this.tools.entries()) {
      const zodSchema = this.mcpSchemaToZod(mcpTool);

      definitions.push({
        name: qualifiedName,
        description: mcpTool.description || `MCP tool: ${qualifiedName}`,
        inputSchema: zodSchema,
        execute: async (input: unknown) => {
          return this.executeTool(qualifiedName, input);
        },
      });
    }

    return definitions;
  }

  /**
   * Execute a tool on a remote MCP server
   */
  async executeTool(toolName: string, input: unknown): Promise<unknown> {
    // Parse server name and tool name
    const [serverName, ...nameParts] = toolName.split('_');
    const actualToolName = nameParts.join('_');

    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`MCP server not found: ${serverName}`);
    }

    try {
      const result = await client.callTool({
        name: actualToolName,
        arguments: input as Record<string, unknown>,
      });

      // Extract text content from result
      if (Array.isArray(result.content)) {
        const textParts = result.content
          .filter((c: unknown) => typeof c === 'object' && c !== null && 'type' in c && c.type === 'text')
          .map((c: unknown) => (c as { text?: string }).text || '')
          .join('\n');

        return {
          result: textParts || JSON.stringify(result.content),
          _server: serverName,
          _tool: actualToolName,
        };
      }

      return {
        result: JSON.stringify(result),
        _server: serverName,
        _tool: actualToolName,
      };
    } catch (error) {
      console.error(`[MCPBridge] Tool execution error:`, error);
      throw error;
    }
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    console.log('[MCPBridge] Closing connections...');
    for (const [name, client] of this.clients.entries()) {
      try {
        await client.close();
        console.log(`[MCPBridge] Closed ${name}`);
      } catch (error) {
        console.error(`[MCPBridge] Error closing ${name}:`, error);
      }
    }
    this.clients.clear();
    this.tools.clear();
  }

  /**
   * Get list of connected server names
   */
  getConnectedServers(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Get count of available tools
   */
  getToolCount(): number {
    return this.tools.size;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create MCP bridge from .mcp.json configuration
 */
export async function createMCPBridge(): Promise<MCPBridge> {
  // For now, return an empty bridge
  // In the future, this could read .mcp.json and connect to configured servers
  const bridge = new MCPBridge({
    servers: [],
    timeout: 10000,
  });

  await bridge.connect();

  return bridge;
}

/**
 * Get all MCP tools as ToolDefinition array
 * Convenience function for agent initialization
 */
export async function getMCPToolDefinitions(): Promise<ToolDefinition[]> {
  const bridge = await createMCPBridge();
  const tools = await bridge.getToolDefinitions();
  await bridge.close();
  return tools;
}
