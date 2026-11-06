/*
  页面上的交互都在这里，不依赖构建插件：
  搜索、目录、标题锚点、深色切换、随机一篇、表情、热力图、点击复制代码、标签底色。
*/
(function () {
  var root = document.documentElement;

  function tagColor(text) {
    var hash = 0;
    for (var i = 0; i < text.length; i += 1) {
      hash = (hash * 33 + text.charCodeAt(i)) >>> 0;
    }
    var hue = hash % 360;
    return "hsl(" + hue + " 45% 45% / 0.16)";
  }

  document.querySelectorAll(".tag, .tag-small").forEach(function (node) {
    node.style.setProperty("--tag-color", tagColor(node.textContent.trim()));
  });

  /* 目录：从正文的 h2 / h3 现扫，不用插件。 */
  var article = document.querySelector(".markdown");
  var desktopToc = document.getElementById("TableOfContents");
  var mobileToc = document.getElementById("TableOfContentsMobile");
  if (article && desktopToc) {
    var headings = article.querySelectorAll("h2, h3");
    if (headings.length) {
      var list = document.createElement("ul");
      var current = null;
      headings.forEach(function (heading) {
        if (!heading.id) {
          heading.id = heading.textContent.trim().toLowerCase().replace(/\s+/g, "-");
        }
        if (!heading.querySelector(".anchor")) {
          var anchor = document.createElement("a");
          anchor.className = "anchor";
          anchor.href = "#" + heading.id;
          anchor.textContent = "#";
          heading.appendChild(anchor);
        }
        var item = document.createElement("li");
        var link = document.createElement("a");
        link.href = "#" + heading.id;
        link.textContent = heading.childNodes[0].textContent.trim();
        item.appendChild(link);
        if (heading.tagName === "H2") {
          list.appendChild(item);
          current = item;
        } else if (current) {
          var nested = current.querySelector("ul");
          if (!nested) {
            nested = document.createElement("ul");
            current.appendChild(nested);
          }
          nested.appendChild(item);
        } else {
          list.appendChild(item);
        }
      });
      desktopToc.appendChild(list);
      if (mobileToc) mobileToc.appendChild(list.cloneNode(true));
      document.body.classList.add("has-toc");
    }
  }

  /* 站内搜索。索引是构建时生成的 /search.json。 */
  var searchInput = document.getElementById("book-search-input");
  var searchResults = document.getElementById("book-search-results");
  var searchData = null;
  var searchRequest = null;

  function renderSearch() {
    if (!searchResults) return;
    searchResults.innerHTML = "";
    if (!searchInput || !searchInput.value.trim() || !searchData) return;
    var query = searchInput.value.trim().toLowerCase();
    var found = 0;
    searchData.forEach(function (entry) {
      if (found >= 8) return;
      var haystack = (entry.title + " " + entry.tags + " " + entry.content).toLowerCase();
      if (haystack.indexOf(query) === -1) return;
      found += 1;
      var link = document.createElement("a");
      link.href = entry.url;
      var title = document.createElement("span");
      title.textContent = entry.title;
      var meta = document.createElement("small");
      meta.textContent = entry.tags || "正文";
      link.appendChild(title);
      link.appendChild(meta);
      searchResults.appendChild(link);
    });
    if (!found) {
      var empty = document.createElement("div");
      empty.className = "search-empty";
      empty.textContent = "没有匹配的文章。换个词再试。";
      searchResults.appendChild(empty);
    }
  }

  function loadSearch() {
    if (searchData) return Promise.resolve(searchData);
    if (searchRequest) return searchRequest;
    var endpoint = (searchInput && searchInput.getAttribute("data-search")) || "/search.json";
    searchRequest = fetch(endpoint)
      .then(function (response) { return response.json(); })
      .then(function (data) {
        searchData = data;
        return data;
      })
      .catch(function () {
        searchRequest = null;
        return [];
      });
    return searchRequest;
  }

  if (searchInput) {
    searchInput.addEventListener("focus", function () { loadSearch().then(renderSearch); });
    searchInput.addEventListener("input", function () { loadSearch().then(renderSearch); });
    document.addEventListener("keydown", function (event) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      var tag = (event.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      event.preventDefault();
      searchInput.focus();
    });
  }

  /* 随机一篇。文章地址在页面底部的 JSON 里。 */
  function goRandom() {
    var holder = document.getElementById("post-urls");
    if (!holder) return;
    var urls = [];
    try { urls = JSON.parse(holder.textContent || "[]"); } catch (error) { return; }
    var here = window.location.pathname;
    var pool = urls.filter(function (url) { return url !== here; });
    if (!pool.length) pool = urls;
    if (!pool.length) return;
    window.location.href = pool[Math.floor(Math.random() * pool.length)];
  }
  ["random-post", "random-post-inline"].forEach(function (id) {
    var node = document.getElementById(id);
    if (node) node.addEventListener("click", goRandom);
  });

  /* 深色 / 浅色。没点过按钮时跟着系统。样式表的底色是浅色。 */
  var themeButton = document.getElementById("theme-toggle");
  function currentTheme() {
    if (root.getAttribute("data-theme") === "dark") return "dark";
    if (root.getAttribute("data-theme") === "light") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function giscusThemeName() {
    var host = document.getElementById("giscus");
    var darkName = (host && host.getAttribute("data-theme-dark")) || "dark";
    var lightName = (host && host.getAttribute("data-theme-light")) || "light";
    return currentTheme() === "dark" ? darkName : lightName;
  }
  function syncGiscusTheme() {
    var frame = document.querySelector("iframe.giscus-frame");
    if (!frame || !frame.contentWindow) return;
    frame.contentWindow.postMessage({
      giscus: { setConfig: { theme: giscusThemeName() } }
    }, "https://giscus.app");
  }
  function paintThemeButton() {
    if (!themeButton) return;
    themeButton.textContent = currentTheme() === "dark" ? "浅色模式" : "深色模式";
  }
  paintThemeButton();
  if (themeButton) {
    themeButton.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("myla-theme", next); } catch (error) {}
      paintThemeButton();
      syncGiscusTheme();
    });
  }

  /* 表情计数只存在这台浏览器里。 */
  document.querySelectorAll("[data-reactions] button").forEach(function (button) {
    var emoji = button.getAttribute("data-emoji");
    var label = button.getAttribute("data-label") || button.textContent.trim();
    var key = "myla-reaction:" + window.location.pathname + ":" + emoji;
    var count = 0;
    try { count = Number(localStorage.getItem(key) || "0"); } catch (error) {}
    function paint() {
      button.innerHTML = label + (count ? '<span class="count">' + count + "</span>" : "");
      button.setAttribute("aria-pressed", count ? "true" : "false");
    }
    paint();
    button.addEventListener("click", function () {
      count = count ? 0 : 1;
      try { localStorage.setItem(key, String(count)); } catch (error) {}
      paint();
    });
  });

  /* 点击代码块复制。选中文字时不打断复制操作。 */
  document.querySelectorAll("pre").forEach(function (block) {
    block.addEventListener("click", function () {
      if (window.getSelection && String(window.getSelection())) return;
      var text = block.innerText;
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(text).then(function () {
        block.classList.add("copied");
        window.setTimeout(function () { block.classList.remove("copied"); }, 800);
      });
    });
  });

  /* 近一年的写作热力图。数据是首页上的日期数组。 */
  var heatmap = document.getElementById("heatmap");
  var heatmapData = document.getElementById("heatmap-data");
  if (heatmap && heatmapData) {
    var dates = [];
    try { dates = JSON.parse(heatmapData.textContent || "[]"); } catch (error) {}
    var counts = {};
    dates.forEach(function (day) { counts[day] = (counts[day] || 0) + 1; });
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var start = new Date(today);
    start.setDate(start.getDate() - start.getDay() - 52 * 7);
    for (var week = 0; week < 53; week += 1) {
      for (var weekday = 0; weekday < 7; weekday += 1) {
        var day = new Date(start);
        day.setDate(start.getDate() + week * 7 + weekday);
        var month = String(day.getMonth() + 1).padStart(2, "0");
        var date = String(day.getDate()).padStart(2, "0");
        var key = day.getFullYear() + "-" + month + "-" + date;
        var cell = document.createElement("i");
        var value = counts[key] || 0;
        var level = 0;
        if (value >= 4) level = 4;
        else if (value >= 3) level = 3;
        else if (value >= 2) level = 2;
        else if (value >= 1) level = 1;
        if (day > today) level = 0;
        cell.setAttribute("data-level", String(level));
        cell.title = key + "：" + value + " 篇";
        heatmap.appendChild(cell);
      }
    }
  }

  /* 文章页顶部的细进度条，按正文滚过的比例填充。 */
  var progress = document.getElementById("reading-progress");
  var progressFill = document.getElementById("reading-progress-fill");
  if (progress && progressFill && document.body.classList.contains("kind-post")) {
    var paintProgress = function () {
      var article = document.querySelector("article.post");
      var total = article ? article.offsetHeight - window.innerHeight : 0;
      var scrolled = 0;
      if (article) {
        scrolled = Math.min(Math.max(-article.getBoundingClientRect().top, 0), Math.max(total, 0));
      }
      var pct = total <= 40 ? 100 : Math.round((scrolled / total) * 100);
      if (pct > 100) pct = 100;
      progressFill.style.width = pct + "%";
      progress.setAttribute("aria-valuenow", String(pct));
    };
    paintProgress();
    document.addEventListener("scroll", paintProgress, { passive: true });
    window.addEventListener("resize", paintProgress);
  }

  /* R 随机一篇，T 切换主题。输入框里打字时不拦截。/ 仍用来聚焦搜索。 */
  document.addEventListener("keydown", function (event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    var tag = (event.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select" || event.target.isContentEditable) return;
    if (event.key === "r" || event.key === "R") {
      event.preventDefault();
      goRandom();
    }
    if ((event.key === "t" || event.key === "T") && themeButton) {
      event.preventDefault();
      themeButton.click();
    }
  });

  /* 评论框。主题跟站点走，不跟系统单独走。 */
  var giscusHost = document.getElementById("giscus");
  if (giscusHost && giscusHost.getAttribute("data-repo")) {
    var giscusScript = document.createElement("script");
    giscusScript.src = "https://giscus.app/client.js";
    giscusScript.async = true;
    giscusScript.crossOrigin = "anonymous";
    giscusScript.setAttribute("data-repo", giscusHost.getAttribute("data-repo"));
    giscusScript.setAttribute("data-repo-id", giscusHost.getAttribute("data-repo-id"));
    giscusScript.setAttribute("data-category", giscusHost.getAttribute("data-category"));
    giscusScript.setAttribute("data-category-id", giscusHost.getAttribute("data-category-id"));
    giscusScript.setAttribute("data-mapping", giscusHost.getAttribute("data-mapping") || "pathname");
    giscusScript.setAttribute("data-strict", giscusHost.getAttribute("data-strict") || "0");
    giscusScript.setAttribute("data-reactions-enabled", giscusHost.getAttribute("data-reactions") || "1");
    giscusScript.setAttribute("data-emit-metadata", giscusHost.getAttribute("data-emit") || "0");
    giscusScript.setAttribute("data-input-position", giscusHost.getAttribute("data-input-position") || "bottom");
    giscusScript.setAttribute("data-lang", giscusHost.getAttribute("data-lang") || "zh-CN");
    giscusScript.setAttribute("data-theme", giscusThemeName());
    giscusHost.appendChild(giscusScript);
  }
})();
