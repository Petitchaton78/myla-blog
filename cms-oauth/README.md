# Decap CMS 的 GitHub 登录代理

GitHub Pages 没有地方跑 OAuth 回调。`/admin` 的登录要经过这个 Cloudflare Worker：它用 GitHub OAuth App 换 token，再按 Decap 的格式把结果交回浏览器。

实现按 [sterlingwes/decap-proxy](https://github.com/sterlingwes/decap-proxy) 的 `/auth` 和 `/callback`。那边的密钥名叫 `GITHUB_OAUTH_ID` / `GITHUB_OAUTH_SECRET`。这里改成下面两个名字，角色一样。

仓库是公开的。`wrangler.toml` 里 `GITHUB_REPO_PRIVATE = "0"`，授权范围是 `public_repo,user`。改成私有库后再把这个值改成 `"1"`。

密钥只放在 Cloudflare，不要写进 `wrangler.toml`，也不要提交。

## 你要做的

1. 在 GitHub 打开 **Settings → Developer settings → OAuth Apps → New OAuth App**。
   - Homepage URL：`https://blog.myla.monster`
   - Authorization callback URL 必须一字不差，包括问号后面的部分：
     `https://<Worker 的主机名>/callback?provider=github`
   - Worker 还没部署时，主机名还不知道。可以先填一个临时值，部署后回来改成真实地址。GitHub 要求回调和 Worker 实际使用的地址完全相同。

2. 部署 Worker。在本目录执行：

   ```bash
   npx wrangler login
   npx wrangler secret put GITHUB_CLIENT_ID
   npx wrangler secret put GITHUB_CLIENT_SECRET
   npx wrangler deploy
   ```

   `GITHUB_CLIENT_ID` 是 OAuth App 的 Client ID。`GITHUB_CLIENT_SECRET` 是它的 Client secret。`wrangler deploy` 结束时会打印 Worker 地址，形如 `https://myla-cms-oauth.<你的子域>.workers.dev`。

3. 把第 1 步的回调改成这个地址加上 `/callback?provider=github`。不要漏掉 `?provider=github`。

4. 打开 `admin/config.yml`，把 `backend.base_url` 换成 Worker 的根地址，不要末尾斜杠。现在那里是占位：

   ```yaml
   base_url: https://REPLACE-WITH-YOUR-WORKER.workers.dev
   ```

   改完推到 `main`。`auth_endpoint` 保持 `/auth`。

5. 打开 `https://blog.myla.monster/admin`，用 **使用 GitHub 登录**。登录的 GitHub 账号需要对 `Petitchaton78/myla-blog` 有写权限。编辑流程会开 pull request，文章不会直接落到 `main`，直到你在 GitHub 上把它合并。

不需要为这个代理另建 GitHub 账号或 Cloudflare 之外的账号。OAuth App 和 Worker 都用你现有的 GitHub 与 Cloudflare 账号。
