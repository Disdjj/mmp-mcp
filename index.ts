#!/usr/bin/env node

import { FastMCP } from "fastmcp";
import minimist from "minimist";
import memoryTools from "./src/tools/memoryTools.js";
import { memoryService } from "./src/services/memoryService.js";

// 读取RPC端点和默认memoryId
const rpcEndpoint = process.env.MMP_RPC_ENDPOINT || "";
const defaultMemoryId = process.env.MMP_DEFAULT_MEMORY_ID || "";

// 如果设置了默认memoryId，设置到memoryService中
if (defaultMemoryId) {
  memoryService.setDefaultMemoryId(defaultMemoryId);
  console.log(`已设置默认memoryId: ${defaultMemoryId}`);
}

// 如果设置了rpcEndpoint，输出提示
if (rpcEndpoint) {
  console.log(`已设置RPC端点: ${rpcEndpoint}`);
  // 设置全局RPC端点到process.env以便在服务中使用
  process.env.MMP_RPC_ENDPOINT = rpcEndpoint;
}

// 创建MCP服务器
const server = new FastMCP({
  name: "MMP-MCP",
  version: "1.0.0",
});

// 注册所有记忆工具
for (const tool of Object.values(memoryTools)) {
  server.addTool(tool as any);
}

// 添加服务器信息提示
server.addPrompt({
  name: "mmp-info",
  description: "获取MMP服务器信息",
  load: async () => {
    let info = `
# MMP (Model-Memory-Protocol) 服务

MMP是一种用于AI模型记忆管理的开放协议，支持树形结构化记忆的存储和检索。`;

    if (defaultMemoryId) {
      info += `\n\n## 默认记忆ID\n\n当前默认记忆ID: \`${defaultMemoryId}\``;
    }

    if (rpcEndpoint) {
      info += `\n\n## RPC端点\n\n当前RPC端点: \`${rpcEndpoint}\``;
    }

    info += `

## 可用工具

- memory.GetInitNodes: 获取所有待初始化节点
- memory.Add: 添加记忆
- memory.Get: 获取记忆
- memory.List: 获取记忆列表
- memory.Update: 更新记忆
- memory.Delete: 删除记忆
- memory.Batch: 批量获取记忆节点
- memManager.Create: 创建新的记忆树ID
- memManager.ApplyTemplate: 为记忆ID应用模板

## 示例流程

1. 首先使用 \`memManager.Create\` 创建一个新的记忆集合
2. 然后可以使用 \`memory.Add\` 添加记忆节点
3. 使用 \`memory.Get\` 获取特定节点内容
4. 可以通过 \`memory.List\` 浏览记忆树结构
`;
    return info;
  },
});

server.start({
  transportType: "stdio",
});
