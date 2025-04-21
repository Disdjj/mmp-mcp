import { z } from 'zod';
import { memoryService } from '../services/memoryService.js';
import { ContentType } from '../types/index.js';

// 工具定义

/**
 * memory.GetInitNodes 工具 - 获取所有待初始化节点
 */
const getInitNodesSchema = z.object({
  memoryId: z.string().describe('目标记忆集合的ID，格式为mm-{uuid}'),
  filter: z.object({
    path: z.string().optional().describe('路径前缀过滤')
  }).optional().describe('过滤条件')
});

/**
 * memory.Add 工具 - 添加记忆
 */
const addNodeSchema = z.object({
  memoryId: z.string().describe('目标记忆集合的ID，格式为mm-{uuid}'),
  node: z.object({
    name: z.string().describe('节点名称'),
    description: z.string().optional().describe('节点描述'),
    path: z.string().describe('节点路径，形如层级结构'),
    attention: z.string().optional().describe('特别说明'),
    needInit: z.boolean().optional().describe('是否需要初始化'),
    format: z.string().optional().describe('该节点下子节点的格式要求'),
    type: z.enum(['json', 'markdown', 'xml', 'plaintext']).describe('内容类型'),
    content: z.string().describe('节点内容')
  }).describe('要添加的记忆节点')
});

/**
 * memory.Get 工具 - 获取记忆
 */
const getNodeSchema = z.object({
  memoryId: z.string().describe('目标记忆集合的ID，格式为mm-{uuid}'),
  path: z.string().describe('要获取的记忆节点的路径'),
  outputFormat: z.enum(['xml', 'json', 'text']).optional().default('text').describe('输出格式')
});

/**
 * memory.List 工具 - 获取记忆列表
 */
const listNodesSchema = z.object({
  memoryId: z.string().describe('目标记忆集合的ID，格式为mm-{uuid}'),
  filter: z.object({
    path: z.string().optional().describe('路径前缀过滤'),
    type: z.enum(['json', 'markdown', 'xml', 'plaintext']).optional().describe('记忆类型过滤'),
    needInit: z.boolean().optional().describe('是否需要初始化')
  }).optional().describe('过滤条件'),
  pagination: z.object({
    offset: z.number().optional().default(0).describe('偏移量'),
    limit: z.number().optional().default(50).describe('限制数量')
  }).optional().describe('分页参数')
});

/**
 * memory.Update 工具 - 更新记忆
 */
const updateNodeSchema = z.object({
  memoryId: z.string().describe('目标记忆集合的ID，格式为mm-{uuid}'),
  path: z.string().describe('要更新的记忆节点的路径'),
  updates: z.object({
    name: z.string().optional().describe('节点名称'),
    description: z.string().optional().describe('节点描述'),
    content: z.string().optional().describe('节点内容'),
    attention: z.string().optional().describe('特别说明'),
    format: z.string().optional().describe('格式要求'),
    needInit: z.boolean().optional().describe('是否需要初始化')
  }).describe('要更新的字段')
});

/**
 * memory.Delete 工具 - 删除记忆
 */
const deleteNodeSchema = z.object({
  memoryId: z.string().describe('目标记忆集合的ID，格式为mm-{uuid}'),
  path: z.string().describe('要删除的记忆节点的路径'),
  recursive: z.boolean().optional().default(false).describe('是否递归删除子节点')
});

/**
 * memory.Batch 工具 - 批量获取记忆节点
 */
const batchGetNodesSchema = z.object({
  requests: z.array(
    z.object({
      memoryId: z.string().describe('记忆ID'),
      path: z.string().describe('记忆节点的路径')
    })
  ).describe('一个包含多个获取请求的数组，每个请求指定要获取的记忆节点')
});

/**
 * memManager.Create 工具 - 创建新的记忆树ID
 */
const createMemorySchema = z.object({
  name: z.string().describe('记忆集合的名称'),
  description: z.string().describe('记忆集合的简短描述'),
  metadata: z.record(z.any()).optional().describe('记忆集合的元数据')
});

/**
 * memManager.ApplyTemplate 工具 - 为记忆ID应用模板
 */
const applyTemplateSchema = z.object({
  memoryId: z.string().describe('目标记忆集合的ID，格式为mm-{uuid}'),
  template: z.array(
    z.object({
      name: z.string().describe('节点名称'),
      description: z.string().optional().describe('节点描述'),
      path: z.string().describe('节点路径'),
      attention: z.string().optional().describe('特别说明'),
      needInit: z.boolean().describe('是否需要初始化，如为true则content不允许为空'),
      format: z.string().optional().describe('格式要求'),
      type: z.enum(['json', 'markdown', 'xml', 'plaintext']).describe('内容类型'),
      content: z.string().optional().describe('节点内容，若needInit为true则不能为空')
    })
  ).describe('要应用的记忆节点模板列表')
});

// 定义工具数组
const tools = [
  // memory.GetInitNodes
  {
    name: 'memory.GetInitNodes',
    description: '获取所有待初始化节点',
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
    name: 'memory.Add',
    description: '向指定的记忆树中添加新的记忆节点',
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
    name: 'memory.Get',
    description: '获取指定记忆树中特定路径节点的内容',
    parameters: getNodeSchema,
    execute: async (args: z.infer<typeof getNodeSchema>) => {
      try {
        const node = await memoryService.getNode(args);

        if (args.outputFormat === 'json') {
          return JSON.stringify(node, null, 2);
        } else if (args.outputFormat === 'xml') {
          // 简单的XML转换，实际项目中可以使用专门的XML库
          let xml = `<node path="${node.path}" name="${node.name}" type="${node.type}">\n`;
          if (node.description) xml += `  <description>${node.description}</description>\n`;
          if (node.content) xml += `  <content>${node.content}</content>\n`;
          xml += '</node>';
          return xml;
        } else {
          // 文本格式
          return `路径: ${node.path}\n名称: ${node.name}\n类型: ${node.type}\n描述: ${node.description || ''}\n内容:\n${node.content || ''}`;
        }
      } catch (error: any) {
        return `Error: ${error.message}`;
      }
    },
  },

  // memory.List
  {
    name: 'memory.List',
    description: '获取指定记忆树中符合条件的记忆节点列表',
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
    name: 'memory.Update',
    description: '更新指定记忆树中特定路径节点的内容',
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
    name: 'memory.Delete',
    description: '删除指定记忆树中特定路径的记忆节点',
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
    name: 'memory.Batch',
    description: '批量获取记忆节点',
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
    name: 'memManager.Create',
    description: '创建新的记忆树ID',
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
    name: 'memManager.ApplyTemplate',
    description: '为指定的记忆ID应用一组记忆节点模板',
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