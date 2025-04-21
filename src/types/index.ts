// MMP 类型定义

/**
 * 内容类型枚举
 */
export type ContentType = 'json' | 'markdown' | 'xml' | 'plaintext';

/**
 * 记忆节点定义
 */
export interface MemoryNode {
  path: string;
  name: string;
  description?: string;
  attention?: string;
  needInit?: boolean;
  format?: string;
  type: ContentType;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 记忆集合定义
 */
export interface Memory {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
}

/**
 * 添加记忆节点请求
 */
export interface AddNodeRequest {
  memoryId?: string;
  node: Omit<MemoryNode, 'createdAt' | 'updatedAt'>;
}

/**
 * 添加记忆节点响应
 */
export interface AddNodeResponse {
  path: string;
}

/**
 * 获取记忆节点请求
 */
export interface GetNodeRequest {
  memoryId?: string;
  path: string;
  outputFormat?: 'xml' | 'json' | 'text';
}

/**
 * 记忆节点列表请求过滤器
 */
export interface NodeFilter {
  path?: string;
  type?: ContentType;
  needInit?: boolean;
}

/**
 * 分页参数
 */
export interface Pagination {
  offset?: number;
  limit?: number;
}

/**
 * 获取记忆节点列表请求
 */
export interface ListNodesRequest {
  memoryId?: string;
  filter?: NodeFilter;
  pagination?: Pagination;
}

/**
 * 获取记忆节点列表响应
 */
export interface ListNodesResponse {
  total: number;
  nodes: Array<Pick<MemoryNode, 'path' | 'name' | 'description'>>;
}

/**
 * 更新记忆节点请求
 */
export interface UpdateNodeRequest {
  memoryId?: string;
  path: string;
  updates: Partial<Omit<MemoryNode, 'path' | 'createdAt' | 'updatedAt'>>;
}

/**
 * 更新记忆节点响应
 */
export interface UpdateNodeResponse {
  path: string;
  updatedAt: string;
}

/**
 * 删除记忆节点请求
 */
export interface DeleteNodeRequest {
  memoryId?: string;
  path: string;
  recursive?: boolean;
}

/**
 * 删除记忆节点响应
 */
export interface DeleteNodeResponse {
  success: boolean;
  deletedCount: number;
}

/**
 * 创建记忆集合请求
 */
export interface CreateMemoryRequest {
  name: string;
  description: string;
  metadata?: Record<string, any>;
}

/**
 * 创建记忆集合响应
 */
export interface CreateMemoryResponse {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

/**
 * 记忆模板节点
 */
export interface MemoryTemplateNode extends Omit<MemoryNode, 'createdAt' | 'updatedAt'> {
  needInit: boolean;
}

/**
 * 应用模板请求
 */
export interface ApplyTemplateRequest {
  memoryId?: string;
  template: MemoryTemplateNode[];
}

/**
 * 应用模板响应
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
 * 批量获取记忆节点请求
 */
export interface BatchGetRequest {
  requests: Array<{
    memoryId?: string;
    path: string;
  }>;
}

/**
 * 错误响应
 */
export interface ErrorResponse {
  code: number;
  message: string;
  data?: Record<string, any>;
}

/**
 * 获取待初始化节点请求
 */
export interface GetInitNodesRequest {
  memoryId?: string;
  filter?: {
    path?: string;
  };
}

/**
 * 获取待初始化节点响应
 */
export interface GetInitNodesResponse {
  nodes: Array<Pick<MemoryNode, 'path' | 'name' | 'description' | 'attention'>>;
}