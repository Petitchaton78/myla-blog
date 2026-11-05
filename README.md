# Myla's Blog

个人博客，地址是 [https://blog.myla.monster](https://blog.myla.monster)。

静态站，用 **Jekyll** 生成。文章是 Markdown，推送到 `main` 后由 **GitHub Pages 从分支构建**，不需要在自己的电脑上先生成网页。

## 发布设置

仓库的 **Settings → Pages**：

- **Source** 选 **Deploy from a branch**（不是 GitHub Actions）
- **Branch** 选 `main`，文件夹选 `/ (root)`

自定义域名用仓库根目录的 `CNAME`，内容是一行 `blog.myla.monster`。DNS 已经把 `blog` CNAME 到 `petitchaton78.github.io`，这里不用再改解析。

## 改站名和简介

编辑 `_config.yml`：

- `title`：顶栏站名，也是浏览器标题。现在的占位是 `Myla's Blog`。
- `tagline`：首页标签页标题里跟在站名后面的短句。
- `description`：首页那一句简介，也会写进 RSS 和搜索结果摘要。
- `author`：RSS 里的作者名。

## 写一篇新文章

在 `_posts/` 里新建文件。文件名必须是：

```text
YYYY-MM-DD-短英文名.md
```

例如 `_posts/2026-11-05-first-note.md`。日期用写这篇的当天或过去的某一天，**不要写未来的日期**。Jekyll 默认不发布未来的文章，那种文件会从首页、归档和 RSS 里消失。

文件内容：

```markdown
---
layout: post
title: 文章标题
date: 2026-11-05 10:00:00 +0800
description: 一句话摘要，可省略。
---

正文从这里开始，用 Markdown 写。
```

`layout: post` 可以省，`_config.yml` 里已经给所有文章指定了这个布局。留着也无妨，看着更明白。

写好后提交，推到 `main`。GitHub Pages 构建完就会出现在首页和 [归档](https://blog.myla.monster/archive/)。

不想公开、先留在仓库里时，在开头加上 `published: false`。

两篇带「示例」的文章是占位，看完版式后直接删除对应文件。

## 页面

| 路径 | 作用 |
| --- | --- |
| `/` | 首页，按时间列出文章 |
| `/archive/` | 归档，按年份 |
| `/about/` | 关于，改 `about.md` |
| `/feed.xml` | RSS |

## 本地预览

需要 Ruby 3 和 Bundler。

```bash
bundle install
bundle exec jekyll serve
```

浏览器打开 `http://127.0.0.1:4000`。改文章或样式后会自动刷新。浅色和深色跟着系统的 `prefers-color-scheme`，本地把系统主题切换一下就能看到。

只想确认能构建、不启动服务器：

```bash
bundle exec jekyll build
```

生成结果在 `_site/`，这个目录不要提交。
