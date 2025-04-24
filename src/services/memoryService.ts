import { v4 as uuidv4 } from "uuid";

/**
 * JSON-RPC请求类型定义
 */
interface JsonRpcRequest {
  jsonrpc: string;
  id: string;
  method: string;
  params: any;
}

/**
 * JSON-RPC响应类型定义
 */
interface JsonRpcResponse {
  jsonrpc: string;
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

/**
 * Memory接口定义
 */
export interface Memory {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
  metadata?: any;
}

/**
 * 记忆节点接口定义
 */
export interface MemoryNode {
  path: string;
  name: string;
  description?: string;
  attention?: string;
  needInit?: boolean;
  format?: string;
  type: "json" | "markdown" | "xml" | "plaintext";
  content?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 记忆模板节点接口定义
 */
export interface MemoryTemplateNode {
  name: string;
  description?: string;
  path: string;
  attention?: string;
  needInit: boolean;
  format?: string;
  type: "json" | "markdown" | "xml" | "plaintext";
  content?: string;
}

/**
 * GetInitNodes请求参数
 */
export interface GetInitNodesRequest {
  memoryId: string;
  filter?: {
    path?: string;
  };
}

/**
 * GetInitNodes响应结果
 */
export interface GetInitNodesResponse {
  nodes: Array<{
    path: string;
    name: string;
    description: string;
    attention: string;
  }>;
}

/**
 * AddNode请求参数
 */
export interface AddNodeRequest {
  memoryId: string;
  node: MemoryNode;
}

/**
 * AddNode响应结果
 */
export interface AddNodeResponse {
  path: string;
}

/**
 * GetNode请求参数
 */
export interface GetNodeRequest {
  memoryId: string;
  path: string;
  outputFormat?: "xml" | "json" | "text";
}

/**
 * ListNodes请求参数
 */
export interface ListNodesRequest {
  memoryId: string;
  filter?: {
    path?: string;
    type?: string;
    needInit?: boolean;
  };
  pagination?: {
    offset?: number;
    limit?: number;
  };
}

/**
 * ListNodes响应结果
 */
export interface ListNodesResponse {
  total: number;
  nodes: Array<{
    path: string;
    name: string;
    description: string;
  }>;
}

/**
 * UpdateNode请求参数
 */
export interface UpdateNodeRequest {
  memoryId: string;
  path: string;
  updates: {
    name?: string;
    description?: string;
    content?: string;
    attention?: string;
    format?: string;
    needInit?: boolean;
  };
}

/**
 * UpdateNode响应结果
 */
export interface UpdateNodeResponse {
  path: string;
  updatedAt: string;
}

/**
 * DeleteNode请求参数
 */
export interface DeleteNodeRequest {
  memoryId: string;
  path: string;
  recursive?: boolean;
}

/**
 * DeleteNode响应结果
 */
export interface DeleteNodeResponse {
  success: boolean;
  deletedCount: number;
}

/**
 * BatchGet请求参数
 */
export interface BatchGetRequest {
  requests: Array<{
    memoryId: string;
    path: string;
  }>;
}

/**
 * CreateMemory请求参数
 */
export interface CreateMemoryRequest {
  name: string;
  description: string;
  metadata?: any;
}

/**
 * CreateMemory响应结果
 */
export interface CreateMemoryResponse {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

/**
 * ApplyTemplate请求参数
 */
export interface ApplyTemplateRequest {
  memoryId: string;
  template: MemoryTemplateNode[];
}

/**
 * ApplyTemplate响应结果
 */
export interface ApplyTemplateResponse {
  memoryId: string;
  success: boolean;
  createdNodes: Array<{
    path: string;
    needInit: boolean;
  }>;
}

/**
 * 记忆管理服务
 */
class MemoryService {
  private defaultMemoryId: string = "";

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
   * 发送RPC请求
   * @param method RPC方法名
   * @param params 参数对象
   * @returns Promise<any>
   */
  private async sendRpcRequest(method: string, params: any): Promise<any> {
    const rpcEndpoint = process.env.MMP_RPC_ENDPOINT;
    if (!rpcEndpoint) {
      throw new Error("RPC endpoint not configured");
    }

    try {
      const request: JsonRpcRequest = {
        jsonrpc: "2.0",
        id: uuidv4(),
        method,
        params,
      };

      const response = await fetch(rpcEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const result: JsonRpcResponse = await response.json();

      if (result.error) {
        throw new Error(
          `RPC error: ${result.error.message || JSON.stringify(result.error)}`
        );
      }

      return result.result;
    } catch (error) {
      console.error(`RPC request failed for method ${method}:`, error);
      throw error;
    }
  }

  /**
   * 创建新的记忆集合
   * @param params 创建记忆集合的参数
   * @returns Promise<CreateMemoryResponse>
   */
  async createMemory(
    params: CreateMemoryRequest
  ): Promise<CreateMemoryResponse> {
    return this.sendRpcRequest("memManager.Create", params);
  }

  /**
   * 获取待初始化节点
   * @param params 获取待初始化节点的参数
   * @returns Promise<GetInitNodesResponse>
   */
  async getInitNodes(
    params: GetInitNodesRequest
  ): Promise<GetInitNodesResponse> {
    // 如果没有指定memoryId，使用默认值
    const memoryId = this.defaultMemoryId || params.memoryId;
    if (!memoryId) {
      throw new Error("No memoryId provided and no default memoryId set");
    }

    return this.sendRpcRequest("memory.GetInitNodes", {
      ...params,
      memoryId,
    });
  }

  /**
   * 添加记忆节点
   * @param params 添加记忆节点的参数
   * @returns Promise<AddNodeResponse>
   */
  async addNode(params: AddNodeRequest): Promise<AddNodeResponse> {
    // 如果没有指定memoryId，使用默认值
    const memoryId = this.defaultMemoryId || params.memoryId;
    if (!memoryId) {
      throw new Error("No memoryId provided and no default memoryId set");
    }

    return this.sendRpcRequest("memory.Add", {
      ...params,
      memoryId,
    });
  }

  /**
   * 获取记忆节点
   * @param params 获取记忆节点的参数
   * @returns Promise<MemoryNode>
   */
  async getNode(params: GetNodeRequest): Promise<MemoryNode> {
    // 如果没有指定memoryId，使用默认值
    const memoryId = this.defaultMemoryId || params.memoryId;
    if (!memoryId) {
      throw new Error("No memoryId provided and no default memoryId set");
    }

    return this.sendRpcRequest("memory.Get", {
      ...params,
      memoryId,
    });
  }

  /**
   * 获取记忆节点列表
   * @param params 获取记忆节点列表的参数
   * @returns Promise<ListNodesResponse>
   */
  async listNodes(params: ListNodesRequest): Promise<ListNodesResponse> {
    // 如果没有指定memoryId，使用默认值
    const memoryId = this.defaultMemoryId || params.memoryId;
    if (!memoryId) {
      throw new Error("No memoryId provided and no default memoryId set");
    }

    return this.sendRpcRequest("memory.List", {
      ...params,
      memoryId,
    });
  }

  /**
   * 更新记忆节点
   * @param params 更新记忆节点的参数
   * @returns Promise<UpdateNodeResponse>
   */
  async updateNode(params: UpdateNodeRequest): Promise<UpdateNodeResponse> {
    // 如果没有指定memoryId，使用默认值
    const memoryId = this.defaultMemoryId || params.memoryId;
    if (!memoryId) {
      throw new Error("No memoryId provided and no default memoryId set");
    }

    return this.sendRpcRequest("memory.Update", {
      ...params,
      memoryId,
    });
  }

  /**
   * 删除记忆节点
   * @param params 删除记忆节点的参数
   * @returns Promise<DeleteNodeResponse>
   */
  async deleteNode(params: DeleteNodeRequest): Promise<DeleteNodeResponse> {
    // 如果没有指定memoryId，使用默认值
    const memoryId = this.defaultMemoryId || params.memoryId;
    if (!memoryId) {
      throw new Error("No memoryId provided and no default memoryId set");
    }

    return this.sendRpcRequest("memory.Delete", {
      ...params,
      memoryId,
    });
  }

  /**
   * 为指定的记忆ID应用一组记忆节点模板
   * @param params 应用模板的参数
   * @returns Promise<ApplyTemplateResponse>
   */
  async applyTemplate(
    params: ApplyTemplateRequest
  ): Promise<ApplyTemplateResponse> {
    // 如果没有指定memoryId，使用默认值
    const memoryId = this.defaultMemoryId || params.memoryId;
    if (!memoryId) {
      throw new Error("No memoryId provided and no default memoryId set");
    }

    return this.sendRpcRequest("memManager.ApplyTemplate", {
      ...params,
      memoryId,
    });
  }

  /**
   * 批量获取记忆节点
   * @param params 批量获取记忆节点的参数
   * @returns Promise<MemoryNode[]>
   */
  async batchGetNodes(params: BatchGetRequest): Promise<MemoryNode[]> {
    // 处理每个请求中可能需要的默认memoryId
    const requests = params.requests.map((req) => ({
      ...req,
      memoryId: this.defaultMemoryId || req.memoryId,
    }));

    // 检查每个请求是否都有memoryId
    for (const req of requests) {
      if (!req.memoryId) {
        throw new Error(
          "One or more requests have no memoryId and no default memoryId is set"
        );
      }
    }

    return this.sendRpcRequest("memory.Batch", {
      requests,
    });
  }
}

// 创建单例实例
const memoryService = new MemoryService();

export { memoryService };
