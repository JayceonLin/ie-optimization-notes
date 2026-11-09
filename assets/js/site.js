/* =========================================================
   工工最佳化講義 — 全站共用腳本
   負責：頂端列、側邊欄、課程標頭、本頁目錄、上一課／下一課、
         首頁課程目錄、KaTeX 數學渲染、載入互動元件、頁尾。
   講義頁只需要寫 <article class="lesson"> 的內容，其餘都由這支檔案產生。
   規則見 AGENTS.md 第 5、9 節。
   ========================================================= */
(function () {
  "use strict";

  // 全站設定：改網站名稱或 repo 網址時只改這裡
  var SITE = {
    name: "工工最佳化講義",
    repo: "https://github.com/JayceonLin/ie-optimization-notes",
    author: "JayceonLin"
  };
  var LEVELS = { 1: "入門", 2: "基礎", 3: "進階" };

  // 由 site.js 自己的位置推回網站根目錄，所以在本機直接打開 HTML 也能運作
  var ROOT = new URL("../../", document.currentScript.src);
  function href(path) { return new URL(path, ROOT).href; }

  var lessons = Array.isArray(window.LESSONS) ? window.LESSONS : [];
  function numOf(l) { return parseInt(l.id.slice(0, 2), 10); }
  function lessonHref(l) { return href("lessons/" + l.id + ".html"); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // 網站標誌：Wyndor 例題的可行解區域，紅點是最佳解
  var BRAND_SVG =
    '<svg viewBox="0 0 32 32" aria-hidden="true">' +
    '<path class="b-axis" d="M5 3 V27 H29"/>' +
    '<path class="b-region" d="M5 27 H19 V17 L12 7 H5 Z"/>' +
    '<circle class="b-dot" cx="12" cy="7" r="2.8"/>' +
    "</svg>";

  function buildTopbar(isLesson) {
    var header = document.createElement("header");
    header.className = "topbar";
    header.innerHTML =
      '<a class="skip-link" href="#main">跳到主要內容</a>' +
      (isLesson
        ? '<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="sidebar">課程列表</button>'
        : "") +
      '<a class="brand" href="' + href("index.html") + '">' + BRAND_SVG + "<span>" + esc(SITE.name) + "</span></a>" +
      '<nav class="topnav" aria-label="主選單">' +
      '<a class="hide-lesson-sm" href="' + href("index.html#lessons") + '">課程目錄</a>' +
      '<a class="hide-sm" href="' + SITE.repo + '/blob/main/AGENTS.md">寫作規則</a>' +
      '<a href="' + SITE.repo + '">GitHub</a>' +
      "</nav>";
    document.body.insertBefore(header, document.body.firstChild);
  }

  function buildFooter() {
    var footer = document.createElement("footer");
    footer.className = "site-footer";
    footer.innerHTML =
      "<p>" + esc(SITE.name) + " 是 " + esc(SITE.author) +
      " 的生成式 AI 課程作業，所有頁面都依照專案裡的 AGENTS.md 規則撰寫。" +
      ' <a href="' + SITE.repo + '">在 GitHub 查看原始碼</a></p>';
    document.body.appendChild(footer);
  }

  // ---------- 講義頁 ----------
  function buildLesson() {
    var id = document.body.getAttribute("data-lesson");
    var idx = -1;
    for (var i = 0; i < lessons.length; i++) if (lessons[i].id === id) idx = i;
    var article = document.querySelector("article.lesson");
    if (!article) return null;

    var layout = document.createElement("div");
    layout.className = "layout";

    var sidebar = document.createElement("nav");
    sidebar.className = "sidebar";
    sidebar.id = "sidebar";
    sidebar.setAttribute("aria-label", "課程列表");
    sidebar.innerHTML =
      '<p class="sidebar-title">全部課程</p><ol>' +
      lessons.map(function (l, i) {
        return '<li><a href="' + lessonHref(l) + '"' + (i === idx ? ' aria-current="page"' : "") + ">" +
          '<span class="no">' + numOf(l) + "</span><span>" + esc(l.title) + "</span></a></li>";
      }).join("") +
      "</ol>";

    var main = document.createElement("main");
    main.id = "main";
    var toc = document.createElement("aside");
    toc.className = "toc";
    toc.setAttribute("aria-label", "本頁目錄");

    article.parentNode.insertBefore(layout, article);
    layout.appendChild(sidebar);
    layout.appendChild(main);
    layout.appendChild(toc);

    if (idx === -1) {
      var err = document.createElement("p");
      err.className = "page-error";
      err.textContent = "找不到 id 為「" + id + "」的課程。請到 data/lessons.js 登記這一課（AGENTS.md 第 4 節）。";
      main.appendChild(err);
      main.appendChild(article);
      return article;
    }

    var l = lessons[idx];
    var header = document.createElement("header");
    header.className = "lesson-header";
    header.innerHTML =
      '<p class="lesson-no">第 ' + numOf(l) + " 課</p>" +
      "<h1>" + esc(l.title) + "</h1>" +
      '<p class="lesson-en" lang="en">' + esc(l.en) + "</p>" +
      '<ul class="lesson-meta">' +
      "<li>難度：" + (LEVELS[l.level] || "未標示") + "</li>" +
      "<li>閱讀約 " + esc(l.minutes) + " 分鐘</li>" +
      "<li>" + (l.tags || []).map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</li>" +
      "</ul>" +
      '<p class="lesson-summary">' + esc(l.summary) + "</p>";
    main.appendChild(header);
    main.appendChild(article);

    // 上一課／下一課
    var prev = lessons[idx - 1];
    var next = lessons[idx + 1];
    var pager = document.createElement("nav");
    pager.className = "pager";
    pager.setAttribute("aria-label", "上一課與下一課");
    pager.innerHTML =
      (prev ? '<a class="prev" href="' + lessonHref(prev) + '"><span class="dir">上一課</span>第 ' + numOf(prev) + " 課：" + esc(prev.title) + "</a>" : "") +
      (next
        ? '<a class="next" href="' + lessonHref(next) + '"><span class="dir">下一課</span>第 ' + numOf(next) + " 課：" + esc(next.title) + "</a>"
        : '<a class="next" href="' + href("index.html#lessons") + '"><span class="dir">這是最後一課</span>回到課程目錄</a>');
    main.appendChild(pager);

    // 本頁目錄：取 article 底下每個 section 的 h2
    var heads = article.querySelectorAll(":scope > section[id] > h2");
    var items = [];
    heads.forEach(function (h) {
      items.push('<li><a href="#' + h.parentNode.id + '">' + esc(h.textContent) + "</a></li>");
    });
    toc.innerHTML = '<p class="toc-title">本頁內容</p><ol>' + items.join("") + "</ol>";
    var links = Array.prototype.slice.call(toc.querySelectorAll("a"));
    if ("IntersectionObserver" in window) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          links.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id); });
        });
      }, { rootMargin: "-15% 0px -75% 0px" });
      article.querySelectorAll(":scope > section[id]").forEach(function (s) { spy.observe(s); });
    }

    // 手機版：課程列表開關
    var btn = document.querySelector(".menu-toggle");
    if (btn) {
      var setOpen = function (open) {
        document.body.classList.toggle("nav-open", open);
        btn.setAttribute("aria-expanded", String(open));
        btn.textContent = open ? "關閉列表" : "課程列表";
      };
      btn.addEventListener("click", function () { setOpen(!document.body.classList.contains("nav-open")); });
      sidebar.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
    }
    return article;
  }

  // ---------- 首頁 ----------
  function buildHome() {
    var list = document.getElementById("lesson-list");
    if (!list) return;
    list.innerHTML = lessons.map(function (l) {
      return '<li><a href="' + lessonHref(l) + '">' +
        '<span class="s-no">' + numOf(l) + "</span>" +
        '<span class="s-line"><span class="s-title">' + esc(l.title) + '</span><span class="s-en" lang="en">' + esc(l.en) +
        '</span><span class="s-leader" aria-hidden="true"></span><span class="s-min">' + (LEVELS[l.level] || "") + "，約 " + esc(l.minutes) + " 分鐘</span></span>" +
        '<span class="s-summary">' + esc(l.summary) + "</span>" +
        "</a></li>";
    }).join("");
  }

  // ---------- KaTeX ----------
  function renderMath(root) {
    if (!root || typeof window.renderMathInElement !== "function") return;
    window.renderMathInElement(root, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\[", right: "\\]", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false }
      ],
      ignoredClasses: ["no-math"],
      throwOnError: false
    });
  }

  // ---------- 互動元件 ----------
  // 用法：<figure class="widget" data-widget="名稱"><script type="application/json">{設定}</script><figcaption>…</figcaption></figure>
  // 元件檔案放在 assets/js/widgets/名稱.js，並註冊 window.OptWidgets["名稱"] = function (body, config, figure) {…}
  window.OptWidgets = window.OptWidgets || {};
  var loading = {};
  function loadWidget(name) {
    if (window.OptWidgets[name]) return Promise.resolve(window.OptWidgets[name]);
    if (!loading[name]) {
      loading[name] = new Promise(function (resolve, reject) {
        var s = document.createElement("script");
        s.src = href("assets/js/widgets/" + name + ".js");
        s.onload = function () {
          if (window.OptWidgets[name]) resolve(window.OptWidgets[name]);
          else reject(new Error(name + ".js 沒有註冊 window.OptWidgets[\"" + name + "\"]"));
        };
        s.onerror = function () { reject(new Error("找不到元件檔案 assets/js/widgets/" + name + ".js")); };
        document.head.appendChild(s);
      });
    }
    return loading[name];
  }
  function mountWidgets(root) {
    root.querySelectorAll("[data-widget]").forEach(function (figure) {
      var name = figure.getAttribute("data-widget");
      var body = document.createElement("div");
      body.className = "widget-body";
      figure.insertBefore(body, figure.querySelector("figcaption"));
      var config = {};
      var cfgNode = figure.querySelector('script[type="application/json"]');
      try {
        config = cfgNode ? JSON.parse(cfgNode.textContent) : {};
      } catch (e) {
        body.innerHTML = '<p class="widget-error">元件設定不是合法 JSON：' + esc(e.message) + "</p>";
        return;
      }
      loadWidget(name).then(function (fn) { fn(body, config, figure); }).catch(function (e) {
        body.innerHTML = '<p class="widget-error">' + esc(e.message) + "</p>";
      });
    });
  }

  // ---------- 啟動 ----------
  var page = document.body.getAttribute("data-page");
  buildTopbar(page === "lesson");
  var content = document.body;
  if (page === "lesson") content = buildLesson() || document.body;
  if (page === "home") buildHome();
  buildFooter();
  renderMath(content);
  mountWidgets(document.body);
})();
