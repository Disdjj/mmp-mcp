# MMP-MCP (Model-Memory-Protocol MCP)

一种用于AI模型记忆管理的开放协议实现，支持树形结构化记忆的存储和检索。

## 介绍

MMP-MCP是Model-Memory-Protocol的MCP实现，提供了一套完整的API接口，用于管理AI模型的记忆树。MMP支持树形结构化记忆，可以方便地存储和检索AI模型在交互过程中产生的记忆，实现跨会话的记忆管理。

## 功能特点

- 创建和管理记忆集合
- 树形结构化记忆存储
- 支持多种内容类型（JSON、Markdown、XML、纯文本）
- 记忆节点初始化管理
- 批量操作支持

## 安装

```bash
npm install mmp-mcp
# 或
yarn add mmp-mcp
# 或
pnpm add mmp-mcp
```

## 使用方法

### 启动MCP服务器

```bash
npx mmp-mcp
```

或在代码中使用：

```typescript
import { startMMPServer } from 'mmp-mcp';

startMMPServer({
  port: 8080,
  endpoint: '/mmp'
});
```

### API接口

MMP-MCP提供了以下API接口：

- `memory.GetInitNodes`: 获取所有待初始化节点
- `memory.Add`: 添加记忆
- `memory.Get`: 获取记忆
- `memory.List`: 获取记忆列表
- `memory.Update`: 更新记忆
- `memory.Delete`: 删除记忆
- `memory.Batch`: 批量获取记忆节点
- `memManager.Create`: 创建新的记忆树ID
- `memManager.ApplyTemplate`: 为记忆ID应用模板

详细的API文档请参考OpenRPC规范。

## 许可证

MIT