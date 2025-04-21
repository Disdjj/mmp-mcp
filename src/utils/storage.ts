import storage from 'node-persist';
import { v4 as uuidv4 } from 'uuid';
import { Memory, MemoryNode } from '../types/index.js';
import path from 'path';

// 存储初始化
const initStorage = async () => {
  await storage.init({
    dir: process.env.STORAGE_PATH || './data',
    stringify: JSON.stringify,
    parse: JSON.parse,
  });
};

// 记忆ID生成
const generateMemoryId = (): string => {
  return `mm-${uuidv4()}`;
};

// RPC请求客户端
const requestRPC = async (method: string, params: any): Promise<any> => {
  const rpcEndpoint = process.env.MMP_RPC_ENDPOINT;
  if (!rpcEndpoint) {
    throw new Error('RPC endpoint not configured');
  }

  try {
    const response = await fetch(rpcEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: uuidv4(),
        method,
        params
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(`RPC error: ${result.error.message || JSON.stringify(result.error)}`);
    }

    return result.result;
  } catch (error) {
    console.error(`RPC request failed for method ${method}:`, error);
    throw error;
  }
};

// 检查是否使用RPC
const isUsingRPC = (): boolean => {
  return !!process.env.MMP_RPC_ENDPOINT;
};

// 获取记忆集合
const getMemory = async (memoryId: string): Promise<Memory | null> => {
  try {
    if (isUsingRPC()) {
      // 我们需要从RPC获取完整的内存对象，但这个方法在RPC中可能不存在
      // 这里我们可以通过尝试获取一个记忆节点列表来检查memoryId是否存在
      await requestRPC('memory.List', { memoryId, pagination: { limit: 1 } });
      // 如果没有抛出错误，说明memoryId存在
      // 由于RPC可能没有直接获取Memory对象的方法，我们创建一个模拟对象
      return {
        id: memoryId,
        name: `Memory ${memoryId}`,
        description: 'Accessed via RPC',
        createdAt: new Date().toISOString()
      };
    }

    const memory = await storage.getItem(`memory:${memoryId}`);
    return memory || null;
  } catch (error) {
    console.error(`Error getting memory ${memoryId}:`, error);
    return null;
  }
};

// 保存记忆集合
const saveMemory = async (memory: Memory): Promise<Memory> => {
  try {
    if (isUsingRPC()) {
      // 我们假设RPC中有一个对应的方法，否则这里需要抛出错误
      return await requestRPC('memManager.Create', {
        name: memory.name,
        description: memory.description,
        metadata: memory.metadata
      });
    }

    await storage.setItem(`memory:${memory.id}`, memory);
    return memory;
  } catch (error) {
    console.error(`Error saving memory ${memory.id}:`, error);
    throw error;
  }
};

// 获取记忆节点
const getNode = async (memoryId: string, nodePath: string): Promise<MemoryNode | null> => {
  try {
    if (isUsingRPC()) {
      return await requestRPC('memory.Get', {
        memoryId,
        path: nodePath
      });
    }

    const node = await storage.getItem(`node:${memoryId}:${nodePath}`);
    return node || null;
  } catch (error) {
    console.error(`Error getting node ${nodePath} in memory ${memoryId}:`, error);
    return null;
  }
};

// 保存记忆节点
const saveNode = async (memoryId: string, node: MemoryNode): Promise<MemoryNode> => {
  try {
    const now = new Date().toISOString();

    // 如果是新建节点，设置创建时间
    if (!node.createdAt) {
      node.createdAt = now;
    }

    // 更新时间
    node.updatedAt = now;

    if (isUsingRPC()) {
      // 检查是否存在节点，决定使用Add还是Update
      const existingNode = await getNode(memoryId, node.path);

      if (existingNode) {
        // 更新节点，创建一个不包含path的更新对象
        const { path, ...updates } = { ...node };

        await requestRPC('memory.Update', {
          memoryId,
          path: node.path,
          updates
        });
      } else {
        // 添加新节点
        await requestRPC('memory.Add', {
          memoryId,
          node
        });
      }

      return node;
    }

    await storage.setItem(`node:${memoryId}:${node.path}`, node);

    // 更新记忆集合的更新时间
    const memory = await getMemory(memoryId);
    if (memory) {
      memory.updatedAt = now;
      await saveMemory(memory);
    }

    return node;
  } catch (error) {
    console.error(`Error saving node ${node.path} in memory ${memoryId}:`, error);
    throw error;
  }
};

// 删除记忆节点
const deleteNode = async (memoryId: string, nodePath: string): Promise<boolean> => {
  try {
    if (isUsingRPC()) {
      const result = await requestRPC('memory.Delete', {
        memoryId,
        path: nodePath,
        recursive: false
      });
      return result.success;
    }

    await storage.removeItem(`node:${memoryId}:${nodePath}`);
    return true;
  } catch (error) {
    console.error(`Error deleting node ${nodePath} in memory ${memoryId}:`, error);
    return false;
  }
};

// 获取所有节点
const getAllNodes = async (memoryId: string): Promise<MemoryNode[]> => {
  try {
    if (isUsingRPC()) {
      const result = await requestRPC('memory.List', {
        memoryId,
        pagination: {
          limit: 1000 // 设置一个较大的值
        }
      });

      // result.nodes只包含基本信息，我们需要获取完整节点
      const nodes: MemoryNode[] = [];
      for (const nodeInfo of result.nodes) {
        const node = await getNode(memoryId, nodeInfo.path);
        if (node) {
          nodes.push(node);
        }
      }

      return nodes;
    }

    const keys = await storage.keys();
    const nodePrefix = `node:${memoryId}:`;
    const nodeKeys = keys.filter(key => key.startsWith(nodePrefix));

    const nodes: MemoryNode[] = [];
    for (const key of nodeKeys) {
      const node = await storage.getItem(key);
      if (node) {
        nodes.push(node);
      }
    }

    return nodes;
  } catch (error) {
    console.error(`Error getting all nodes for memory ${memoryId}:`, error);
    return [];
  }
};

// 获取符合条件的节点
const getFilteredNodes = async (
  memoryId: string,
  pathPrefix?: string,
  type?: string,
  needInit?: boolean
): Promise<MemoryNode[]> => {
  try {
    if (isUsingRPC()) {
      const result = await requestRPC('memory.List', {
        memoryId,
        filter: {
          path: pathPrefix,
          type,
          needInit
        },
        pagination: {
          limit: 1000 // 设置一个较大的值
        }
      });

      // result.nodes只包含基本信息，我们需要获取完整节点
      const nodes: MemoryNode[] = [];
      for (const nodeInfo of result.nodes) {
        const node = await getNode(memoryId, nodeInfo.path);
        if (node) {
          nodes.push(node);
        }
      }

      return nodes;
    }

    const allNodes = await getAllNodes(memoryId);
    return allNodes.filter(node => {
      if (pathPrefix && !node.path.startsWith(pathPrefix)) {
        return false;
      }
      if (type && node.type !== type) {
        return false;
      }
      if (needInit !== undefined && node.needInit !== needInit) {
        return false;
      }
      return true;
    });
  } catch (error) {
    console.error(`Error getting filtered nodes for memory ${memoryId}:`, error);
    return [];
  }
};

// 递归获取子节点路径
const getChildNodePaths = async (memoryId: string, parentPath: string): Promise<string[]> => {
  const allNodes = await getAllNodes(memoryId);
  return allNodes
    .filter(node => node.path.startsWith(`${parentPath}/`))
    .map(node => node.path);
};

// 检查节点路径是否已存在
const nodePathExists = async (memoryId: string, nodePath: string): Promise<boolean> => {
  const node = await getNode(memoryId, nodePath);
  return node !== null;
};

// 获取所有记忆集合
const getAllMemories = async (): Promise<Memory[]> => {
  try {
    if (isUsingRPC()) {
      // RPC通常没有提供获取所有memory的方法
      // 如果有默认的memoryId，可以至少返回一个memory
      if (process.env.MMP_DEFAULT_MEMORY_ID) {
        const memory = await getMemory(process.env.MMP_DEFAULT_MEMORY_ID);
        return memory ? [memory] : [];
      }
      return [];
    }

    const keys = await storage.keys();
    const memoryPrefix = 'memory:';
    const memoryKeys = keys.filter(key => key.startsWith(memoryPrefix));

    const memories: Memory[] = [];
    for (const key of memoryKeys) {
      const memory = await storage.getItem(key);
      if (memory) {
        memories.push(memory);
      }
    }

    return memories;
  } catch (error) {
    console.error('Error getting all memories:', error);
    return [];
  }
};

export {
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
  getAllMemories,
  isUsingRPC
};