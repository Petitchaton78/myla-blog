---
layout: post
title: 不进订阅的一篇（示例）
date: 2026-04-08 11:00:00 +0800
categories: [记录]
tags: [示例]
exclude_rss: true
sample: true
description: 网站上能看到，RSS 里应该没有它。
---

这篇文章在首页和归档里都在，但订阅源里不该出现。它用来确认 `exclude_rss: true` 生效。

打开 [/index.xml]({{ '/index.xml' | relative_url }})，搜这篇的标题，应该搜不到。
