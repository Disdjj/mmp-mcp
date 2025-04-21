import {
  Memory,
  MemoryNode,
  AddNodeRequest,
  AddNodeResponse,
  GetNodeRequest,
  UpdateNodeRequest,
  UpdateNodeResponse,
  DeleteNodeRequest,
  DeleteNodeResponse,
  ListNodesRequest,
  ListNodesResponse,
  CreateMemoryRequest,
  CreateMemoryResponse,
  ApplyTemplateRequest,
  ApplyTemplateResponse,
  BatchGetRequest,
  GetInitNodesRequest,
  GetInitNodesResponse,
  MemoryTemplateNode
} from '../types/index.js';

import {
  initStorage,
  generateMemoryId,
  getMemory,
  saveMemory,
  getNode,
  saveNode,
  deleteNode,
  getAllNodes,
  getFilteredNodes,
  getChildNodePaths,
  nodePathExists,
  getAllMemories
} from '../utils/storage.js';

/**
 * 记忆管理服务
 */
class MemoryService {
  private defaultMemoryId: string = '';

  constructor() {
    // 初始化存储
    this.init();
  }

  /**
   * 设置默认记忆ID
   */
  setDefaultMemoryId(memoryId: string): void {
    this.defaultMemoryId = memoryId;
  }

  /**
   * 获取默认记忆ID
   */
  getDefaultMemoryId(): string {
    return this.defaultMemoryId;
  }

  /**
   * 初始化服务
   */
  private async init(): Promise<void> {
    await initStorage();
  }

  /**
   * 创建新的记忆集合
   */
  async createMemory(params: CreateMemoryRequest): Promise<CreateMemoryResponse> {
    const id = generateMemoryId();
    const now = new Date().toISOString();

    const memory: Memory = {
      id,
      name: params.name,
      description: params.description,
      createdAt: now,
      metadata: params.metadata
    };

    await saveMemory(memory);

    return {
      id: memory.id,
      name: memory.name,
      description: memory.description,
      createdAt: memory.createdAt
    };
  }

  /**
   * 获取待初始化节点
   */
  async getInitNodes(params: GetInitNodesRequest): Promise<GetInitNodesResponse> {
    // 如果没有指定memoryId，使用默认值
    const memoryId = params.memoryId || this.defaultMemoryId;
    if (!memoryId) {
      throw new Error("No memoryId provided and no default memoryId set");
    }

    const { filter } = params;

    // 验证记忆ID是否存在
    const memory = await getMemory(memoryId);
    if (!memory) {
      throw new Error(`Memory ${memoryId} not found`);
    }

    // 获取所有待初始化节点
    const nodes = await getFilteredNodes(memoryId, filter?.path, undefined, true);

    return {
      nodes: nodes.map(node => ({
        path: node.path,
        name: node.name,
        description: node.description || '',
        attention: node.attention || ''
      }))
    };
  }

  /**
   * 添加记忆节点
   */
  async addNode(params: AddNodeRequest): Promise<AddNodeResponse> {
    // 如果没有指定memoryId，使用默认值
    const memoryId = params.memoryId || this.defaultMemoryId;
    if (!memoryId) {
      throw new Error("No memoryId provided and no default memoryId set");
    }

    const { node } = params;

    // 验证记忆ID是否存在
    const memory = await getMemory(memoryId);
    if (!memory) {
      throw new Error(`Memory ${memoryId} not found`);
    }

    // 检查路径是否已存在
    const exists = await nodePathExists(memoryId, node.path);
    if (exists) {
      throw new Error(`Node path ${node.path} already exists in memory ${memoryId}`);
    }

    // 保存节点
    await saveNode(memoryId, node);

    return {
      path: node.path
    };
  }

  /**
   * 获取记忆节点
   */
  async getNode(params: GetNodeRequest): Promise<MemoryNode> {
    // 如果没有指定memoryId，使用默认值
    const memoryId = params.memoryId || this.defaultMemoryId;
    if (!memoryId) {
      throw new Error("No memoryId provided and no default memoryId set");
    }

    const { path } = params;

    // 验证记忆ID是否存在
    const memory = await getMemory(memoryId);
    if (!memory) {
      throw new Error(`Memory ${memoryId} not found`);
    }

    // 获取节点
    const node = await getNode(memoryId, path);
    if (!node) {
      throw new Error(`Node ${path} not found in memory ${memoryId}`);
    }

    return node;
  }

  /**
   * 获取记忆节点列表
   */
  async listNodes(params: ListNodesRequest): Promise<ListNodesResponse> {
    // 如果没有指定memoryId，使用默认值
    const memoryId = params.memoryId || this.defaultMemoryId;
    if (!memoryId) {
      throw new Error("No memoryId provided and no default memoryId set");
    }

    const { filter, pagination } = params;

    // 验证记忆ID是否存在
    const memory = await getMemory(memoryId);
    if (!memory) {
      throw new Error(`Memory ${memoryId} not found`);
    }

    // 获取符合条件的节点
    const nodes = await getFilteredNodes(
      memoryId,
      filter?.path,
      filter?.type,
      filter?.needInit
    );

    // 应用分页
    const offset = pagination?.offset || 0;
    const limit = pagination?.limit || 50;
    const pagedNodes = nodes.slice(offset, offset + limit);

    return {
      total: nodes.length,
      nodes: pagedNodes.map(node => ({
        path: node.path,
        name: node.name,
        description: node.description || ''
      }))
    };
  }

  /**
   * 更新记忆节点
   */
  async updateNode(params: UpdateNodeRequest): Promise<UpdateNodeResponse> {
    // 如果没有指定memoryId，使用默认值
    const memoryId = params.memoryId || this.defaultMemoryId;
    if (!memoryId) {
      throw new Error("No memoryId provided and no default memoryId set");
    }

    const { path, updates } = params;

    // 验证记忆ID是否存在
    const memory = await getMemory(memoryId);
    if (!memory) {
      throw new Error(`Memory ${memoryId} not found`);
    }

    // 获取现有节点
    const existingNode = await getNode(memoryId, path);
    if (!existingNode) {
      throw new Error(`Node ${path} not found in memory ${memoryId}`);
    }

    // 更新节点
    const updatedNode: MemoryNode = {
      ...existingNode,
      ...updates,
      path // 确保路径不变
    };

    // 保存更新后的节点
    const savedNode = await saveNode(memoryId, updatedNode);

    return {
      path: savedNode.path,
      updatedAt: savedNode.updatedAt!
    };
  }

  /**
   * 删除记忆节点
   */
  async deleteNode(params: DeleteNodeRequest): Promise<DeleteNodeResponse> {
    // 如果没有指定memoryId，使用默认值
    const memoryId = params.memoryId || this.defaultMemoryId;
    if (!memoryId) {
      throw new Error("No memoryId provided and no default memoryId set");
    }

    const { path, recursive } = params;

    // 验证记忆ID是否存在
    const memory = await getMemory(memoryId);
    if (!memory) {
      throw new Error(`Memory ${memoryId} not found`);
    }

    // 获取现有节点
    const existingNode = await getNode(memoryId, path);
    if (!existingNode) {
      throw new Error(`Node ${path} not found in memory ${memoryId}`);
    }

    // 需要删除的路径列表
    const pathsToDelete: string[] = [path];

    // 如果递归删除，获取所有子节点
    if (recursive) {
      const childPaths = await getChildNodePaths(memoryId, path);
      pathsToDelete.push(...childPaths);
    } else {
      // 非递归删除，检查是否有子节点
      const childPaths = await getChildNodePaths(memoryId, path);
      if (childPaths.length > 0) {
        throw new Error(`Cannot delete node ${path} with children without recursive flag`);
      }
    }

    // 删除所有路径
    let deletedCount = 0;
    for (const pathToDelete of pathsToDelete) {
      const success = await deleteNode(memoryId, pathToDelete);
      if (success) {
        deletedCount++;
      }
    }

    return {
      success: deletedCount > 0,
      deletedCount
    };
  }

  /**
   * 应用模板到记忆ID
   */
  async applyTemplate(params: ApplyTemplateRequest): Promise<ApplyTemplateResponse> {
    // 如果没有指定memoryId，使用默认值
    const memoryId = params.memoryId || this.defaultMemoryId;
    if (!memoryId) {
      throw new Error("No memoryId provided and no default memoryId set");
    }

    const { template } = params;

    // 验证记忆ID是否存在
    const memory = await getMemory(memoryId);
    if (!memory) {
      throw new Error(`Memory ${memoryId} not found`);
    }

    // 验证模板，如果needInit为true，则content不能为空
    for (const node of template) {
      if (node.needInit && (!node.content || node.content.trim() === '')) {
        throw new Error(`Invalid template: node ${node.path} is marked as needInit but has no content`);
      }
    }

    // 创建模板节点
    const createdNodes: Array<{ path: string; needInit: boolean }> = [];

    for (const templateNode of template) {
      // 检查路径是否已存在
      const exists = await nodePathExists(memoryId, templateNode.path);
      if (exists) {
        continue; // 跳过已存在的节点
      }

      // 保存节点
      await saveNode(memoryId, templateNode);

      createdNodes.push({
        path: templateNode.path,
        needInit: templateNode.needInit
      });
    }

    return {
      memoryId,
      success: true,
      createdNodes
    };
  }

  /**
   * 批量获取记忆节点
   */
  async batchGetNodes(params: BatchGetRequest): Promise<MemoryNode[]> {
    const { requests } = params;

    const results: MemoryNode[] = [];

    for (const request of requests) {
      try {
        // 使用默认记忆ID如果未指定
        const memoryId = request.memoryId || this.defaultMemoryId;
        if (!memoryId) {
          console.error("No memoryId provided and no default memoryId set for request:", request);
          continue;
        }

        const node = await this.getNode({
          memoryId,
          path: request.path
        });

        if (node) {
          results.push(node);
        }
      } catch (error) {
        // 忽略错误，继续处理下一个请求
        console.error(`Error getting node ${request.path} in memory ${request.memoryId}:`, error);
      }
    }

    return results;
  }
}

// 创建单例实例
const memoryService = new MemoryService();

export { memoryService };