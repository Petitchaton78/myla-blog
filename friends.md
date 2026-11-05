---
layout: page
title: 友情链接
permalink: /friends/
---

这里留着友链的位置。下面四个地址都是 `example.com`，换掉再发布。

{% for friend in site.data.friends %}
<a class="book-btn" href="{{ friend.url }}" target="_blank" rel="noopener">{{ friend.title }}</a>
{% endfor %}

想加一条，就编辑 `_data/friends.yml`：写上标题和网址，再推一次。对方站点如果也愿意链回来，把你的地址告诉他们就行。
