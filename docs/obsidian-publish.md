# 从 Obsidian 发布

笔记可以继续留在 Obsidian 里。站点构建时会处理 `[[双链]]`、`![[图片]]`、标注，以及缺了日期或短名的情况。有两条路，用一条就够。

## 这条路会做什么

构建先跑 `ruby script/publish_obsidian.rb`，再跑标签页和 `jekyll build`。

- `obsidian/` 里前言写了 `share: true` 的笔记，会生成 `_posts/YYYY-MM-DD-短名.obsidian.md`。这个生成文件不进 git，源文件留在 `obsidian/`。
- 插件直接提交到 `_posts/` 的文章如果还带着双链或标注，构建时会就地改成普通 Markdown。改过一次之后再跑不会再改。
- 围栏代码块和行内代码里的 `[[关于]]` 保持原样。
- 对不上的双链只留下显示文字，不会变成打不开的链接。
- `![[文件名]]` 会按这个顺序找图：`obsidian/attachments/`、`assets/uploads/`、`assets/covers/`、`assets/`。只在附件目录里的图会复制到 `assets/uploads/`。
- `> [!tip]` 变成提示框，`> [!warning]`（以及 caution、attention、danger、failure、bug）变成警告框。
- 没有 `date` 时，用文件名里的 `YYYY-MM-DD`，再没有就用文件修改时间，时区按上海。只有日期、没有钟点时，写成当天 `09:00:00 +0800`。
- 没有 `slug` 时，用标题做成短名。标题里没有可用字符时，用 `note-` 加标题摘要的前 8 位。
- `share: false` 或没写 `share` 的笔记不会从 `obsidian/` 发出。

固定页面：`[[关于]]` → `/about/`，`[[近况]]` → `/now/`，`[[友链]]` 和 `[[友情链接]]` → `/friends/`，`[[首页]]` → `/`。文章按标题、文件名或 `slug` 对上已有的文章地址。

仓库里的例子是 `obsidian/从-Obsidian-发出的卡片.md`，发布后的地址是 `/2026/03/14/from-obsidian-card/`。

## GitHub Publisher

插件现在也叫 Enveloppe，社区插件里搜 **GitHub Publisher**。它用你自己的 GitHub 令牌把选中的笔记推到这个仓库。令牌自己在 GitHub 建，不要写进仓库。

**GitHub**

| 项 | 值 |
| --- | --- |
| GitHub 用户名 | `Petitchaton78` |
| 仓库 | `myla-blog` |
| 分支 | `main` |
| 令牌 | 自己的 personal access token，公开仓库至少要 `public_repo`。不要提交到笔记或仓库。 |

**发布标记**

| 项 | 值 |
| --- | --- |
| Share key | `share` |
| 要发布的值 | `true` |

命令用 **Upload single current active note**，或在前言里写 `share: true` 后用批量上传。没标的笔记不要传。

**文件夹和文件名**

| 项 | 值 |
| --- | --- |
| Folder behavior / 目录行为 | Fixed folder（固定目录） |
| Default folder / 根目录 | `_posts` |
| 文件名 | 使用前言字段 `filename` |
| 附件 | 打开转移附件 |
| 附件目录 | `assets/uploads` |
| 把双链转成 Markdown | 关掉。构建会转。插件如果已经转过，构建看到的是普通链接，不会再改。 |

每篇要发的笔记写成：

```yaml
---
title: 文章标题
date: 2026-03-14
slug: my-note
filename: 2026-03-14-my-note
share: true
tags: [笔记]
categories: [记录]
description: 一句话，可省略。
---
```

`filename` 不要带 `.md`。插件会把它放到 `_posts/2026-03-14-my-note.md`。`date` 可以只写 `YYYY-MM-DD`。封面如果有，用站点路径，例如 `image: /assets/uploads/cover.png`。

## Obsidian Git

不想给插件单独的令牌时，用 **Obsidian Git** 同步整个库。

| 项 | 值 |
| --- | --- |
| 仓库 | `Petitchaton78/myla-blog` |
| 分支 | `main` |
| 要同步的目录 | 把要发的笔记放在仓库的 `obsidian/`，附件放在 `obsidian/attachments/` |

笔记前言同样写 `share: true`。不需要 `filename`。构建会按 `date` 和 `slug` 生成 `_posts/` 里的文章。`share: false` 的笔记可以留在同一个库里，不会出现在网站上。

两条路不要对同一篇笔记各发一次，否则会有两份。
