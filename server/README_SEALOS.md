
# 🌩️ Cloudflare Workers + D1 部署指南

本项目后端已升级使用 Cloudflare D1 (SQL 数据库)，比 KV 更适合结构化数据存储。

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

## 3. 创建 D1 数据库

我们需要创建一个 D1 数据库来存储数据（命名为 `STAR_DB`）：

```bash
npx wrangler d1 create STAR_DB
```

终端会输出类似如下内容：
```toml
[[d1_databases]]
binding = "DB"
database_name = "STAR_DB"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**关键步骤：**
1. 打开 `server/wrangler.toml` 文件。
2. 如果文件中没有 `[[d1_databases]]` 配置块，请复制上面的输出并粘贴进去。
3. 确保 `binding` 的值为 `"DB"` (代码中通过 `env.DB` 访问)。

## 4. 初始化数据库表结构

执行以下命令应用 SQL Schema（创建表）：

**本地开发环境：**
```bash
npx wrangler d1 execute STAR_DB --local --file=./schema.txt
```

**远程生产环境：**
```bash
npx wrangler d1 execute STAR_DB --remote --file=./schema.txt
```

或者，您可以直接复制 `server/schema.txt` 中的内容，粘贴到 Cloudflare Dashboard -> D1 -> Console 中执行。

## 5. 部署 Worker

```bash
npm run deploy
```

部署成功后，控制台会显示你的 Worker URL，例如：
`https://star-achiever-worker.你的用户名.workers.dev`

## 6. 前端配置

1. 复制上面的 Worker URL。
2. 回到项目根目录的 `constants.ts` 文件。
3. 修改 `CLOUD_API_URL` 变量，**注意保留 `/api/sync` 后缀**（如果 Worker 配置了路由，直接填根路径也可以）：

```typescript
export const CLOUD_API_URL = 'https://star-achiever-worker.你的用户名.workers.dev';
```

4. 重新构建/部署你的前端应用。

## 常见问题

- **Error: D1 Binding 'DB' not found**: 检查 `wrangler.toml` 中的 binding 名称必须是 "DB"。
- **SQL Error**: 确保在部署前执行了 `schema.txt` 中的建表语句。