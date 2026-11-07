/* ============================================================
   上海海洋大学光影社 官方网站 · 全站交互脚本
   文件路径：js/main.js
   说明：纯原生 JavaScript，无框架、无第三方依赖
   功能：汉堡菜单 / 导航高亮 / 公告分页 / 页脚年份 / 回到顶部
   ============================================================ */

(function () {
  'use strict';

  // 等待 DOM 加载完成后再执行
  document.addEventListener('DOMContentLoaded', function () {
    initNavToggle();          // 汉堡菜单展开/收起
    initNavHighlight();       // 当前页面导航高亮
    initHeroBackground();     // 首页 Hero 主视觉：有图自动换图，无图保持渐变
    initAnnounceCarousel();   // 首页 · 最新公告轮换展示（三条推送逐条轮播）
    initNewsPager();          // 信息公开 · 最新公告分页（每页 10 条）
    initFooterYear();         // 页脚年份自动更新
    initBackToTop();          // 回到顶部按钮
  });

  /* ---------- 1. 汉堡菜单展开 / 收起 ---------- */
  function initNavToggle() {
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    if (!toggle || !links) return;

    // 点击按钮切换展开状态
    toggle.addEventListener('click', function () {
      var isOpen = links.classList.toggle('is-open');
      toggle.classList.toggle('is-open', isOpen);
      // 更新无障碍属性
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // 点击任意导航链接后自动收起（移动端体验）
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('is-open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- 2. 当前页面导航高亮 ---------- */
  function initNavHighlight() {
    var links = document.querySelectorAll('.nav-links a');
    if (!links.length) return;

    // 获取当前文件名（如 "about.html"），首页为 "index.html"
    var path = window.location.pathname;
    var current = path.substring(path.lastIndexOf('/') + 1) || 'index.html';

    links.forEach(function (link) {
      var href = link.getAttribute('href') || '';
      // 判断链接 href 的文件名是否等于当前文件名
      var linkFile = href.substring(href.lastIndexOf('/') + 1);
      if (linkFile === current) {
        link.classList.add('is-active');
      }
    });
  }

  /* ---------- 3. 首页 Hero 主视觉：有图自动换图，无图保持渐变 ---------- */
  function initHeroBackground() {
    var hero = document.querySelector('.hero');
    if (!hero) return;

    var root = document.documentElement;

    // 按优先顺序尝试同一素材的多种格式，首个能加载的成功即采用
    function probe(urls, onMatched) {
      if (!urls.length) return;

      var img = new Image();
      img.onload = function () {
        onMatched(urls[0]);
      };
      img.onerror = function () {
        probe(urls.slice(1), onMatched);
      };
      img.src = urls[0];
    }

    // 命中后把图片地址写入 CSS 变量，并给 .hero 加上切换图片背景的类；
    // 所有素材都不存在时不加类，页面保持原品牌渐变
    function usePhoto(cssVar) {
      return function (url) {
        root.style.setProperty(cssVar, 'url("' + url + '")');
        hero.classList.add('has-hero-photo');
      };
    }

    // 桌面横版（2560×800 左右）：WebP 优先，其次 JPG
    probe([
      'assets/images/hero-bg.webp',
      'assets/images/hero-bg.jpg'
    ], usePhoto('--hero-photo-desktop'));

    // 手机竖版（1080×1350 左右）：可缺省，缺省时 CSS 自动退回桌面图；
    // 仅在窄屏下探测，避免桌面端多出无谓请求
    if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) {
      probe([
        'assets/images/hero-bg-mobile.webp',
        'assets/images/hero-bg-mobile.jpg'
      ], usePhoto('--hero-photo-mobile'));
    }
  }

  /* ---------- 4. 首页 · 最新公告轮换展示（三条推送逐条轮播） ---------- */
  function initAnnounceCarousel() {
    var carousel = document.getElementById('announce-carousel');
    if (!carousel) return;

    var items = Array.prototype.slice.call(carousel.querySelectorAll('.announce-item'));
    var controls = carousel.querySelector('.announce-controls');
    var dotsBox = carousel.querySelector('.announce-dots');
    if (items.length < 2 || !controls || !dotsBox) return;

    var prevBtn = controls.querySelector('[data-announce="prev"]');
    var nextBtn = controls.querySelector('[data-announce="next"]');
    var INTERVAL = 6000;   // 自动轮换间隔（毫秒）
    var current = 0;
    var timer = null;
    var paused = false;
    var dots = [];

    // 开启轮换：容器加 .is-carousel 后，非当前条目才隐藏；脚本未启用时三条完整展示
    carousel.classList.add('is-carousel');
    controls.hidden = false;

    // 依据推送条数生成圆点
    items.forEach(function (item, index) {
      var title = item.querySelector('h3');
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'announce-dot' + (index === 0 ? ' is-current' : '');
      dot.setAttribute('aria-label', title
        ? '第 ' + (index + 1) + ' 条：' + title.textContent.trim()
        : '第 ' + (index + 1) + ' 条公告');
      dot.addEventListener('click', function () {
        show(index);
        start();
      });
      dotsBox.appendChild(dot);
      dots.push(dot);
    });

    // 切换到指定一条：同步卡片显隐、可达性与圆点状态
    function show(index) {
      current = (index + items.length) % items.length;

      items.forEach(function (item, i) {
        var isCurrent = i === current;
        item.classList.toggle('is-active', isCurrent);
        item.setAttribute('aria-hidden', isCurrent ? 'false' : 'true');
        item.setAttribute('tabindex', isCurrent ? '0' : '-1');
      });

      dots.forEach(function (dot, i) {
        var isCurrent = i === current;
        dot.classList.toggle('is-current', isCurrent);
        dot.setAttribute('aria-current', isCurrent ? 'true' : 'false');
      });
    }

    function prefersReducedMotion() {
      return window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    // 启动自动轮换：页面切到后台或条数不足时不轮换
    function start() {
      stop();
      if (prefersReducedMotion()) return;
      timer = window.setInterval(function () {
        if (!paused && !document.hidden) show(current + 1);
      }, INTERVAL);
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        show(current - 1);
        start();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        show(current + 1);
        start();
      });
    }

    // 鼠标悬停或键盘聚焦时暂停，离开后继续，避免阅读时被切走
    carousel.addEventListener('mouseenter', function () { paused = true; });
    carousel.addEventListener('mouseleave', function () { paused = false; });
    carousel.addEventListener('focusin', function () { paused = true; });
    carousel.addEventListener('focusout', function () { paused = false; });

    show(0);
    start();
  }

  /* ---------- 5. 信息公开 · 最新公告分页（每页 10 条） ---------- */
  function initNewsPager() {
    var list = document.getElementById('news-list');
    var pager = document.getElementById('news-pager');
    if (!list || !pager) return;

    var items = Array.prototype.slice.call(list.querySelectorAll('.news-item'));
    if (!items.length) return;

    // 每页条数：优先读取分页条上的 data-per-page，默认 10 条
    var perPage = parseInt(pager.getAttribute('data-per-page'), 10) || 10;
    var totalPages = Math.ceil(items.length / perPage);
    if (totalPages <= 1) return;

    var prevBtn = pager.querySelector('[data-pager="prev"]');
    var nextBtn = pager.querySelector('[data-pager="next"]');
    var pagesBox = pager.querySelector('.pager-pages');
    var info = pager.querySelector('.pager-info');
    var pageBtns = [];
    var current = 1;

    // 依据总页数生成页码按钮
    for (var i = 1; i <= totalPages; i++) {
      (function (page) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pager-btn';
        btn.textContent = page;
        btn.setAttribute('aria-label', '第 ' + page + ' 页');
        btn.addEventListener('click', function () {
          renderPage(page);
        });
        if (pagesBox) pagesBox.appendChild(btn);
        pageBtns.push(btn);
      })(i);
    }

    // 渲染指定页：隐藏非当前页条目，同步页码高亮与按钮状态
    function renderPage(page) {
      current = page;

      items.forEach(function (item, index) {
        var itemPage = Math.floor(index / perPage) + 1;
        var isHidden = itemPage !== page;
        item.classList.toggle('is-hidden', isHidden);
        item.setAttribute('aria-hidden', isHidden ? 'true' : 'false');
      });

      pageBtns.forEach(function (btn, index) {
        btn.classList.toggle('is-current', index + 1 === page);
      });

      if (prevBtn) prevBtn.disabled = page === 1;
      if (nextBtn) nextBtn.disabled = page === totalPages;
      if (info) {
        info.textContent = '共 ' + items.length + ' 条 · 第 ' + page + ' / ' + totalPages + ' 页';
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        if (current > 1) renderPage(current - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (current < totalPages) renderPage(current + 1);
      });
    }

    /* 支持 #news-N 深链：首页三条推送等外部入口直达某条公告时，
       自动切换到该条目所在的分页（条目落在第 2、3 页时也不会跳到空白处） */
    function locateHashTarget() {
      var hash = window.location.hash;
      if (!hash || hash.length < 2) return null;

      var target;
      try {
        target = document.querySelector(hash);
      } catch (e) {
        return null;
      }
      if (!target || items.indexOf(target) < 0) return null;

      return {
        target: target,
        page: Math.floor(items.indexOf(target) / perPage) + 1
      };
    }

    var hashTarget = locateHashTarget();
    renderPage(hashTarget ? hashTarget.page : 1);

    if (hashTarget && hashTarget.page > 1) {
      // 分页切换完成后再滚动到目标条目
      window.setTimeout(function () {
        hashTarget.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);
    }

    // 同一页面内改变锚点（如从首页跳入后再次点击其他公告）时同步翻页
    window.addEventListener('hashchange', function () {
      var located = locateHashTarget();
      if (located && located.page !== current) {
        renderPage(located.page);
      }
    });
  }

  /* ---------- 6. 页脚年份自动更新 ---------- */
  function initFooterYear() {
    var yearEl = document.getElementById('footer-year');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }
  }

  /* ---------- 7. 回到顶部按钮 ---------- */
  function initBackToTop() {
    // 动态创建按钮，避免每个 HTML 重复书写
    var btn = document.createElement('button');
    btn.className = 'back-top';
    btn.textContent = '↑';
    btn.title = '回到顶部';
    btn.setAttribute('aria-label', '回到顶部');
    document.body.appendChild(btn);

    // 滚动超过一定距离时显示按钮
    window.addEventListener('scroll', function () {
      if (window.scrollY > 300) {
        btn.classList.add('is-visible');
      } else {
        btn.classList.remove('is-visible');
      }
    });

    // 点击回到顶部
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
})();
