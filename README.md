# Myla's Blog

个人博客，地址是 [https://blog.myla.monster](https://blog.myla.monster)。

静态站，用 **Jekyll** 生成。版式是侧栏加正文的阅读页：标签、分类、归档、站内搜索、目录、字数、系列、上下篇、友链、近况，以及一份 RSS。

仓库根目录的 `CNAME` 必须保持为 `blog.myla.monster`。

## 发布

用 **GitHub Actions** 发布，不要用「从分支部署」。

仓库 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**。

推到 `main` 后，工作流会先跑 `ruby script/generate_pages.rb`，再 `jekyll build`，然后用 `actions/deploy-pages` 发布。标签页、分类页和 `/posts/` 的第 2 页起都是这一步生成的。GitHub Pages 自带的插件名单里没有能按标签自动建页的插件，所以这一步放在 Actions 里。

只想在本地看结果：

```bash
bundle install
ruby script/generate_pages.rb
bundle exec jekyll serve
```

## 改站名

编辑 `_config.yml`：

- `title`：侧栏和浏览器标题。现在是 `Myla's Blog`。
- `tagline`：首页标签页标题里跟在站名后面的短句。
- `description`：RSS 和搜索结果里的简介。
- `taglines`：侧栏站名下面的两行。
- `author`：RSS 里的作者名。

## 写一篇文章

在 `_posts/` 新建 `YYYY-MM-DD-短英文名.md`。日期不要写未来，否则不会出现。

```markdown
---
layout: post
title: 文章标题
date: 2026-11-05 10:00:00 +0800
categories: [日常]
tags: [笔记]
description: 一句话摘要，可省略。
image: /assets/covers/window.svg
image_caption: 图注，可省略。
series: 某个系列
series_order: 1
exclude_rss: false
---

正文。用 <!-- more --> 把列表摘要截断。
```

- `categories` 和 `tags` 可以写多个。新名字在下次构建时自动有自己的页面。
- `series` 相同的文章会在文末互相列出，顺序看 `series_order`。
- `exclude_rss: true` 的文章留在站上，但不进 [/index.xml](/index.xml)。[/feed.xml](/feed.xml) 是同一份订阅。
- 封面图放在 `assets/` 里，用站点内的路径。正文里的图片同样写相对路径，宽度会限制在栏内。
- 给某段加上 `class="spoiler"`，悬停之前会模糊。

现有带「示例」的文章看完版式后可以删。

## 其它页面

| 路径 | 改哪里 |
| --- | --- |
| `/` | `index.html` |
| `/posts/` | 文章列表，每页篇数是 `_config.yml` 的 `list_per_page` |
| `/archive/` | 按年的短列表 |
| `/tags/`、`/categories/` | 总览；单个标签和分类的页面由脚本生成 |
| `/about/` | `about.md` |
| `/now/` | `now.md` |
| `/friends/` | `_data/friends.yml` |
| `/index.xml` | RSS |

侧栏链接在 `_data/menu.yml`。

## 评论

评论用 [giscus](https://giscus.app/)，数据在 GitHub Discussions 里，不需要自己的服务器。

1. 仓库 **Settings → General → Features** 打开 Discussions。
2. 打开 [giscus.app](https://giscus.app/)，选这个仓库和讨论分类，复制 `data-repo`、`data-repo-id`、`data-category-id`。
3. 填进 `_config.yml` 的 `giscus.repo`、`giscus.repo_id`、`giscus.category_id`。

三个值都空着时，文章底部只显示一段说明，不会加载评论脚本。

文末的表情只记在读者自己的浏览器里，换一台设备不会同步。

## 搜索和深色

侧栏的搜索框读取构建出来的 `/search.json`，在浏览器里过滤标题、标签和正文。按 `/` 可以聚焦搜索框。

深色默认跟着系统。侧栏底部的按钮可以固定成浅色或深色。
