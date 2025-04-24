import { z } from "zod";
import { memoryService } from "../services/memoryService.js";
import { ContentType } from "../types/index.js";

// Tool definitions

/**
 * Helper function to get the current default memoryId description
 */
const getMemoryIdDescription = () => {
  const defaultId = memoryService.getDefaultMemoryId();
  return `Target memory collection ID in the format mm-{uuid}${defaultId ? `. Current default: ${defaultId}` : ""}`;
};

/**
 * memory.GetInitNodes tool - Get all nodes that need initialization
 */
const getInitNodesSchema = z.object({
  memoryId: z
    .string()
    .describe(getMemoryIdDescription()),
  filter: z
    .object({
      path: z.string().optional().describe("Path prefix filter"),
    })
    .optional()
    .describe("Filter conditions"),
});

/**
 * memory.Add tool - Add a memory node
 */
const addNodeSchema = z.object({
  memoryId: z
    .string()
    .describe(getMemoryIdDescription()),
  node: z
    .object({
      name: z.string().describe("Node name"),
      description: z.string().optional().describe("Node description"),
      path: z.string().describe("Node path in hierarchical structure"),
      attention: z.string().optional().describe("Special notes"),
      needInit: z
        .boolean()
        .optional()
        .describe("Whether initialization is needed"),
      format: z
        .string()
        .optional()
        .describe("Format requirements for child nodes"),
      type: z
        .enum(["json", "markdown", "xml", "plaintext"])
        .describe("Content type"),
      content: z.string().describe("Node content"),
    })
    .describe("Memory node to add"),
});

/**
 * memory.Get tool - Retrieve a memory node
 */
const getNodeSchema = z.object({
  memoryId: z
    .string()
    .describe(getMemoryIdDescription()),
  path: z.string().describe("Path of the memory node to retrieve"),
  outputFormat: z
    .enum(["xml", "json", "text"])
    .optional()
    .default("text")
    .describe("Output format"),
});

/**
 * memory.List tool - Get a list of memory nodes
 */
const listNodesSchema = z.object({
  memoryId: z
    .string()
    .describe(getMemoryIdDescription()),
  filter: z
    .object({
      path: z.string().optional().describe("Path prefix filter"),
      type: z
        .enum(["json", "markdown", "xml", "plaintext"])
        .optional()
        .describe("Memory type filter"),
      needInit: z
        .boolean()
        .optional()
        .describe("Whether initialization is needed"),
    })
    .optional()
    .describe("Filter conditions"),
  pagination: z
    .object({
      offset: z.number().optional().default(0).describe("Offset"),
      limit: z.number().optional().default(50).describe("Limit"),
    })
    .optional()
    .describe("Pagination parameters"),
});

/**
 * memory.Update tool - Update a memory node
 */
const updateNodeSchema = z.object({
  memoryId: z
    .string()
    .describe(getMemoryIdDescription()),
  path: z.string().describe("Path of the memory node to update"),
  updates: z
    .object({
      name: z.string().optional().describe("Node name"),
      description: z.string().optional().describe("Node description"),
      content: z.string().optional().describe("Node content"),
      attention: z.string().optional().describe("Special notes"),
      format: z.string().optional().describe("Format requirements"),
      needInit: z
        .boolean()
        .optional()
        .describe("Whether initialization is needed"),
    })
    .describe("Fields to update"),
});

/**
 * memory.Delete tool - Delete a memory node
 */
const deleteNodeSchema = z.object({
  memoryId: z
    .string()
    .describe(getMemoryIdDescription()),
  path: z.string().describe("Path of the memory node to delete"),
  recursive: z
    .boolean()
    .optional()
    .default(false)
    .describe("Whether to recursively delete child nodes"),
});

/**
 * memory.Batch tool - Batch retrieve memory nodes
 */
const batchGetNodesSchema = z.object({
  requests: z
    .array(
      z.object({
        memoryId: z.string().describe(getMemoryIdDescription()),
        path: z.string().describe("Path of the memory node"),
      })
    )
    .describe(
      "An array of retrieval requests, each specifying a memory node to retrieve"
    ),
});

/**
 * memManager.Create tool - Create a new memory collection
 */
const createMemorySchema = z.object({
  name: z.string().describe("Name of the memory collection"),
  description: z
    .string()
    .describe("Brief description of the memory collection"),
  metadata: z
    .record(z.any())
    .optional()
    .describe("Metadata of the memory collection"),
});

/**
 * memManager.ApplyTemplate tool - Apply templates to a memory collection
 */
const applyTemplateSchema = z.object({
  memoryId: z
    .string()
    .describe(getMemoryIdDescription()),
  template: z
    .array(
      z.object({
        name: z.string().describe("Node name"),
        description: z.string().optional().describe("Node description"),
        path: z.string().describe("Node path"),
        attention: z.string().optional().describe("Special notes"),
        needInit: z
          .boolean()
          .describe(
            "Whether initialization is needed, if true content cannot be empty"
          ),
        format: z.string().optional().describe("Format requirements"),
        type: z
          .enum(["json", "markdown", "xml", "plaintext"])
          .describe("Content type"),
        content: z
          .string()
          .optional()
          .describe("Node content, must not be empty if needInit is true"),
      })
    )
    .describe("List of memory node templates to apply"),
});

// Define tools array
const tools = [
  // memory.GetInitNodes
  {
    name: "memory_GetInitNodes",
    description:
      "Retrieves all nodes marked as needing initialization from the specified memory tree",
    parameters: getInitNodesSchema,
    execute: async (args: z.infer<typeof getInitNodesSchema>) => {
      try {
        const result = await memoryService.getInitNodes(args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        return `Error: ${error.message}`;
      }
    },
  },

  // memory.Add
  {
    name: "memory_Add",
    description: "Adds a new memory node to the specified memory tree",
    parameters: addNodeSchema,
    execute: async (args: z.infer<typeof addNodeSchema>) => {
      try {
        const result = await memoryService.addNode(args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        return `Error: ${error.message}`;
      }
    },
  },

  // memory.Get
  {
    name: "memory_Get",
    description:
      "Retrieves the content of a specific node path from the specified memory tree",
    parameters: getNodeSchema,
    execute: async (args: z.infer<typeof getNodeSchema>) => {
      try {
        const node = await memoryService.getNode(args);

        if (args.outputFormat === "json") {
          return JSON.stringify(node, null, 2);
        } else {
          // Simple XML conversion, in actual projects a dedicated XML library would be used
          let xml = `<node path="${node.path}" name="${node.name}" type="${node.type}">\n`;
          if (node.description)
            xml += `  <description>${node.description}</description>\n`;
          if (node.content) xml += `  <content>${node.content}</content>\n`;
          xml += "</node>";
          return xml;
        }
      } catch (error: any) {
        return `Error: ${error.message}`;
      }
    },
  },

  // memory.List
  {
    name: "memory_List",
    description:
      "Retrieves a list of memory nodes matching the specified conditions from the memory tree",
    parameters: listNodesSchema,
    execute: async (args: z.infer<typeof listNodesSchema>) => {
      try {
        const result = await memoryService.listNodes(args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        return `Error: ${error.message}`;
      }
    },
  },

  // memory.Update
  {
    name: "memory_Update",
    description:
      "Updates the content of a specific node path in the specified memory tree",
    parameters: updateNodeSchema,
    execute: async (args: z.infer<typeof updateNodeSchema>) => {
      try {
        const result = await memoryService.updateNode(args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        return `Error: ${error.message}`;
      }
    },
  },

  // memory.Delete
  {
    name: "memory_Delete",
    description:
      "Deletes a specific node path from the specified memory tree, with optional recursive deletion",
    parameters: deleteNodeSchema,
    execute: async (args: z.infer<typeof deleteNodeSchema>) => {
      try {
        const result = await memoryService.deleteNode(args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        return `Error: ${error.message}`;
      }
    },
  },

  // memory.Batch
  {
    name: "memory_Batch",
    description: "Batch retrieves multiple memory nodes in a single operation",
    parameters: batchGetNodesSchema,
    execute: async (args: z.infer<typeof batchGetNodesSchema>) => {
      try {
        const results = await memoryService.batchGetNodes(args);
        return JSON.stringify(results, null, 2);
      } catch (error: any) {
        return `Error: ${error.message}`;
      }
    },
  },

  // memManager.Create
  {
    name: "memManager_Create",
    description:
      "Creates a new memory collection with a unique ID, name, and description",
    parameters: createMemorySchema,
    execute: async (args: z.infer<typeof createMemorySchema>) => {
      try {
        const result = await memoryService.createMemory(args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        return `Error: ${error.message}`;
      }
    },
  },

  // memManager.ApplyTemplate
  {
    name: "memManager_ApplyTemplate",
    description:
      "Applies a set of predefined memory node templates to the specified memory collection",
    parameters: applyTemplateSchema,
    execute: async (args: z.infer<typeof applyTemplateSchema>) => {
      try {
        const result = await memoryService.applyTemplate(args);
        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        return `Error: ${error.message}`;
      }
    },
  },
];

export default tools;
