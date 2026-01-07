/**
 * MCP Bridge - Connects to remote MCP servers and integrates with Claude Agent
 *
 * This module provides:
 * - Connection to MCP servers via stdio from .mcp.json
 * - Tool discovery and schema conversion (MCP → Zod)
 * - Execution wrapper compatible with ToolDefinition format
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { z } from 'zod';
import type { ToolDefinition } from './agent';
import { readFileSync } from 'fs';
import { join } from 'path';

// ============================================================================
// Types
// ============================================================================

export interface MCPServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
}

interface ConnectedClient {
  client: Client;
  transport: StdioClientTransport;
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
  allowedServers?: string[]; // Allowlist of server names to load
}

// ============================================================================
// MCP Bridge Class
// ============================================================================

export class MCPBridge {
  private clients: Map<string, ConnectedClient> = new Map();
  private tools: Map<string, MCPTool> = new Map();
  private timeout: number;
  private allowedServers?: string[];

  constructor(options: MCPBridgeOptions) {
    this.timeout = options.timeout || 10000;
    this.allowedServers = options.allowedServers;
  }

  /**
   * Load MCP configuration from .mcp.json
   */
  private loadConfig(): MCPConfig {
    try {
      const configPath = join(process.cwd(), '.mcp.json');
      const configContent = readFileSync(configPath, 'utf-8');
      return JSON.parse(configContent);
    } catch (error) {
      console.error('[MCPBridge] Failed to load .mcp.json:', error);
      return { mcpServers: {} };
    }
  }

  /**
   * Timeout wrapper for async operations
   */
  private async withTimeout<T>(promise: Promise<T>, ms: number, operation: string): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${operation} timed out after ${ms}ms`)), ms)
    );
    return Promise.race([promise, timeout]);
  }

  /**
   * Connect to a single MCP server
   */
  private async connectToServer(config: MCPServerConfig): Promise<ConnectedClient> {
    // Merge env variables, filtering out undefined values
    const envVars: Record<string, string> = {};
    // Copy process.env, excluding undefined values
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        envVars[key] = value;
      }
    }
    // Override with server-specific env
    if (config.env) {
      for (const [key, value] of Object.entries(config.env)) {
        if (value !== undefined) {
          envVars[key] = value;
        }
      }
    }

    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args || [],
      env: Object.keys(envVars).length > 0 ? envVars : undefined,
    });

    const client = new Client(
      {
        name: `mcp-bridge-${config.name}`,
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    await this.withTimeout(client.connect(transport), 5000, `Connection to ${config.name}`);

    return { client, transport };
  }

  /**
   * Initialize connection to all configured MCP servers
   */
  async connect(): Promise<void> {
    console.log('[MCPBridge] Connecting to servers...');

    const config = this.loadConfig();
    let servers = Object.entries(config.mcpServers);

    // Filter by allowlist if provided
    if (this.allowedServers && this.allowedServers.length > 0) {
      const allowedSet = new Set(this.allowedServers);
      servers = servers.filter(([name]) => allowedSet.has(name));
      console.log(`[MCPBridge] Filtered to allowed servers: ${this.allowedServers.join(', ')}`);
    }

    if (servers.length === 0) {
      console.log('[MCPBridge] No servers configured in .mcp.json');
      return;
    }

    // Connect to each server with graceful degradation
    for (const [name, serverConfig] of servers) {
      try {
        console.log(`[MCPBridge] Connecting to ${name}...`);
        const connected = await this.connectToServer({ ...serverConfig, name });
        this.clients.set(name, connected);
        console.log(`[MCPBridge] ✓ Connected to ${name}`);
      } catch (error) {
        console.error(`[MCPBridge] ✗ Failed to connect to ${name}:`, error);
        // Continue with other servers - graceful degradation
      }
    }

    console.log(`[MCPBridge] Connected to ${this.clients.size}/${servers.length} servers`);
  }

  /**
   * Discover and cache tools from connected MCP servers
   */
  async discoverTools(): Promise<MCPTool[]> {
    const allTools: MCPTool[] = [];

    for (const [serverName, { client }] of this.clients.entries()) {
      try {
        const response = await this.withTimeout(
          client.listTools(),
          3000,
          `Tool discovery from ${serverName}`
        );
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

    const connected = this.clients.get(serverName);
    if (!connected) {
      throw new Error(`MCP server not found: ${serverName}`);
    }

    try {
      const result = await this.withTimeout(
        connected.client.callTool({
          name: actualToolName,
          arguments: input as Record<string, unknown>,
        }),
        30000,
        `Tool execution: ${serverName}.${actualToolName}`
      );

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
    for (const [name, { client, transport }] of this.clients.entries()) {
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
export async function createMCPBridge(allowedServers?: string[]): Promise<MCPBridge> {
  const bridge = new MCPBridge({
    servers: [], // Not used anymore - config loaded from .mcp.json
    timeout: 10000,
    allowedServers,
  });

  await bridge.connect();
  await bridge.discoverTools();

  return bridge;
}

/**
 * Get all MCP tools as ToolDefinition array
 * Convenience function for agent initialization
 */
export async function getMCPToolDefinitions(allowedServers?: string[]): Promise<ToolDefinition[]> {
  const bridge = await createMCPBridge(allowedServers);
  const tools = await bridge.getToolDefinitions();
  await bridge.close();
  return tools;
}
