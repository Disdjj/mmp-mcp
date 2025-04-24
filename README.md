# MMP-MCP (Model-Memory-Protocol MCP)

一种用于 AI 模型记忆管理的开放协议实现，支持树形结构化记忆的存储和检索。

## 介绍

MMP-MCP 是 Model-Memory-Protocol 的 MCP 实现，提供了一套完整的 API 接口，用于管理 AI 模型的记忆树。MMP 支持树形结构化记忆，可以方便地存储和检索 AI 模型在交互过程中产生的记忆，实现跨会话的记忆管理。

## 功能特点

- 创建和管理记忆集合
- 树形结构化记忆存储
- 支持多种内容类型（JSON、Markdown、XML、纯文本）
- 记忆节点初始化管理
- 批量操作支持

## 使用方法

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["mmp-mcp"],
      "env": {
        "MMP_RPC_ENDPOINT": "http://localhost:18080/rpc",
        "MMP_DEFAULT_MEMORY_ID": "mm-xxxx"
      }
    }
  }
}
```

### API 接口

MMP-MCP 提供了以下 API 接口：

- `memory.GetInitNodes`: 获取所有待初始化节点
- `memory.Add`: 添加记忆
- `memory.Get`: 获取记忆
- `memory.List`: 获取记忆列表
- `memory.Update`: 更新记忆
- `memory.Delete`: 删除记忆
- `memory.Batch`: 批量获取记忆节点
- `memManager.Create`: 创建新的记忆树 ID
- `memManager.ApplyTemplate`: 为记忆 ID 应用模板

详细的 API 文档请参考 OpenRPC 规范。

## 许可证

MIT
