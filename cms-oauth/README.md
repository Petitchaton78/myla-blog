# Decap CMS 的 GitHub 登录代理

GitHub Pages 没有地方跑 OAuth 回调。`/admin` 的登录要经过这个 Cloudflare Worker：它用 GitHub OAuth App 换 token，再按 Decap 的格式把结果交回浏览器。

实现按 [sterlingwes/decap-proxy](https://github.com/sterlingwes/decap-proxy) 的 `/auth` 和 `/callback`。那边的密钥名叫 `GITHUB_OAUTH_ID` / `GITHUB_OAUTH_SECRET`。这里改成下面两个名字，角色一样。

仓库是公开的。`wrangler.toml` 里 `GITHUB_REPO_PRIVATE = "0"`，授权范围是 `public_repo,user`。改成私有库后再把这个值改成 `"1"`。

密钥只放在 Cloudflare，不要写进 `wrangler.toml`，也不要提交。

## 现在的地址

Worker 已经部署在 `https://myla-cms-oauth.hangkaidiyi.workers.dev`。`admin/config.yml` 的 `backend.base_url` 就是这个根地址，没有末尾斜杠。`auth_endpoint` 是 `/auth`。

GitHub OAuth App 的 Authorization callback URL 必须一字不差：

`https://myla-cms-oauth.hangkaidiyi.workers.dev/callback?provider=github`

Homepage URL 是 `https://blog.myla.monster`。密钥 `GITHUB_CLIENT_ID` 和 `GITHUB_CLIENT_SECRET` 只放在 Cloudflare，不进仓库。

打开 `https://blog.myla.monster/admin`，用 **使用 GitHub 登录**。登录的 GitHub 账号需要对 `Petitchaton78/myla-blog` 有写权限。编辑流程会开 pull request，文章不会直接落到 `main`，直到在 GitHub 上合并。

Worker 换了地址时，要同时改 OAuth App 的回调和 `backend.base_url`。重新部署、轮换密钥时，在本目录执行：

```bash
npx wrangler login
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler deploy
```

不需要为这个代理另建 GitHub 账号或 Cloudflare 之外的账号。OAuth App 和 Worker 都用你现有的 GitHub 与 Cloudflare 账号。
