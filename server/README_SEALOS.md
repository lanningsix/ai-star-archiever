
# 🌩️ 如何部署到 Cloudflare Workers

后端服务已切换回 Cloudflare Workers + KV，这是一个免费且极速的 Serverless 方案。

## 步骤 1: 准备环境

确保你安装了 Node.js，然后在 `server` 目录下运行：

```bash
cd server
npm install
```

## 步骤 2: 登录 Cloudflare

```bash
npx wrangler login
```
这会打开浏览器进行授权。

## 步骤 3: 创建 KV 存储

我们需要一个 KV 命名空间来存储家庭数据：

```bash
npx wrangler kv:namespace create STAR_DATA
```

运行后，终端会输出一段配置，看起来像这样：

```toml
[[kv_namespaces]]
binding = "STAR_DATA"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**重要**：复制这个 `id`，打开 `server/wrangler.toml` 文件，将 `id` 和 `preview_id` 替换为你刚刚获得的 ID。

## 步骤 4: 部署

```bash
npm run deploy
```

部署成功后，你会看到一个 URL，例如：
`https://star-achiever-api.你的用户名.workers.dev`

## 步骤 5: 连接前端

1. 复制上面的 Workers URL。
2. 回到项目根目录的 `constants.ts` 文件。
3. 修改 `CLOUD_API_URL`，记得加上 `/api/sync` 后缀：

```typescript
export const CLOUD_API_URL = 'https://star-achiever-api.你的用户名.workers.dev/api/sync';
```

4. 重新部署你的前端页面。

✅ **完成！**
