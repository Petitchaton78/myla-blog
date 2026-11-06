# Decap CMS 的 GitHub 登录代理

GitHub Pages 没有地方跑 OAuth 回调。`/admin` 的登录要经过这个 Cloudflare Worker：它用 GitHub OAuth App 换 token，再按 Decap 的格式把结果交回浏览器。

实现按 [sterlingwes/decap-proxy](https://github.com/sterlingwes/decap-proxy) 的 `/auth` 和 `/callback`。那边的密钥名叫 `GITHUB_OAUTH_ID` / `GITHUB_OAUTH_SECRET`。这里改成下面两个名字，角色一样。

仓库是公开的。`wrangler.toml` 里 `GITHUB_REPO_PRIVATE = "0"`。授权范围见下一节。改成私有库后再把这个值改成 `"1"`。

密钥只放在 Cloudflare，不要写进 `wrangler.toml`，也不要提交。

## 授权范围

公开博客只申请 `public_repo`。GitHub 用它读写公开仓库的代码、提交、分支和 pull request，编辑流程够用。

不再申请 `user`。那一项在同意页上显示为「Personal user data — Full access」，能读写个人资料、邮箱和关注关系。Decap 3.6 的 GitHub 后端只请求 `GET /user` 来读登录名和公开姓名；仓库令牌就能读到这些公开字段。普通保存走 Git Data API 时不另写作者，由 GitHub 记到当前账号上。因此不需要 `user`、`read:user` 或 `user:email`。

Decap 自己的默认值是 `repo`（见 `AuthenticationPage.js`：没写 `auth_scope` 时，非 open authoring 就用 `repo`）。`repo` 连私有库也包含在内。`admin/config.yml` 写了 `auth_scope: public_repo`，让浏览器向代理提出的范围和这里一致。Worker 仍然不采用地址栏里的 `scope`。那是浏览器传来的，不能拿来扩大权限。范围只由 `cms-oauth/scope.js` 决定：

| `GITHUB_REPO_PRIVATE` | 发给 GitHub 的 scope |
| --- | --- |
| 未设置、`0`、`false` 或其他值 | `public_repo` |
| `1`、`true`、`yes` | `repo` |

两种情况都没有 `user`。

`sterlingwes/decap-proxy` 目前写的是 `public_repo,user` / `repo,user`。这里故意不跟那一项。

改 `scope.js` 之后要重新部署 Worker。只推这个仓库不会更新 `https://myla-cms-oauth.hangkaidiyi.workers.dev` 上正在跑的代码。在本目录执行 `npx wrangler deploy`。部署前，线上同意页仍会要 `public_repo` 和 `user`。

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
