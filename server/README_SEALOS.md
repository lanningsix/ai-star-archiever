
# 🌩️ Cloudflare Workers 部署指南

本项目后端使用 Cloudflare Workers + KV，免费、快速且无需维护服务器。

## 1. 环境准备

确保已安装 Node.js。进入 server 目录并安装依赖：

```bash
cd server
npm install
```

## 2. 登录 Cloudflare

```bash
npx wrangler login
```
根据提示在浏览器中授权。

## 3. 创建 KV 存储

我们需要创建一个 KV 空间来存储数据（命名为 `STAR_DATA`）：

```bash
npx wrangler kv:namespace create STAR_DATA
```

终端会输出类似如下内容：
```toml
[[kv_namespaces]]
binding = "STAR_DATA"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**关键步骤：**
1. 复制上面的 `id`。
2. 打开 `server/wrangler.toml` 文件。
3. 将 `id` 字段替换为你刚刚生成的 ID。
4. (可选) 如果需要本地开发预览，可以再次运行 `npx wrangler kv:namespace create STAR_DATA --preview` 并填入 `preview_id`。

## 4. 部署

```bash
npm run deploy
```

部署成功后，控制台会显示你的 Worker URL，例如：
`https://star-achiever-api.你的用户名.workers.dev`

## 5. 前端配置

1. 复制上面的 Worker URL。
2. 回到项目根目录的 `constants.ts` 文件。
3. 修改 `CLOUD_API_URL` 变量，**注意保留 `/api/sync` 后缀**：

```typescript
export const CLOUD_API_URL = 'https://star-achiever-api.你的用户名.workers.dev/api/sync';
```

4. 重新构建/部署你的前端应用。

## 常见问题

- **Error: KV Binding 'STAR_DATA' not found**: 检查 `wrangler.toml` 中的 id 是否填写正确，且 binding 名称必须是 "STAR_DATA"。
