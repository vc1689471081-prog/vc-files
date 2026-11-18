/* 极简静态站：读取 data/software.json 渲染软件卡片、分类筛选、搜索、赞助区 */
(function () {
  const $ = (sel) => document.querySelector(sel);

  const state = { data: null, cat: "all", q: "" };

  const catName = (id) => {
    if (!state.data) return id;
    const c = state.data.categories.find((x) => x.id === id);
    return c ? c.name : id;
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[m]));
  }

  function renderFilters() {
    const box = $("#filters");
    box.innerHTML = "";
    state.data.categories.forEach((c) => {
      const b = document.createElement("button");
      b.className = "chip";
      b.type = "button";
      b.textContent = c.name;
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", String(c.id === state.cat));
      b.addEventListener("click", () => {
        state.cat = c.id;
        renderFilters();
        renderGrid();
      });
      box.appendChild(b);
    });
  }

  function filtered() {
    const q = state.q.trim().toLowerCase();
    return state.data.software.filter((s) => {
      const okCat = state.cat === "all" || s.category === state.cat;
      if (!okCat) return false;
      if (!q) return true;
      const dlText = (s.downloads || [])
        .map((d) => [d.label, d.note].filter(Boolean).join(" "))
        .join(" ");
      const hay = [s.name, s.desc, (s.tags || []).join(" "), catName(s.category), dlText]
        .join(" ").toLowerCase();
      return hay.includes(q);
    });
  }

  function renderGrid() {
    const grid = $("#grid");
    const tpl = $("#card-tpl");
    const list = filtered();
    grid.innerHTML = "";
    $("#empty").hidden = list.length > 0;
    $("#count").textContent = `${list.length} / ${state.data.software.length} 个`;

    list.forEach((s) => {
      const node = tpl.content.cloneNode(true);
      node.querySelector(".card-title").textContent = s.name;
      node.querySelector(".card-cat").textContent = catName(s.category);
      node.querySelector(".card-desc").textContent = s.desc || "";
      const tags = node.querySelector(".tags");
      (s.tags || []).forEach((t) => {
        const span = document.createElement("span");
        span.className = "tag";
        span.textContent = t;
        tags.appendChild(span);
      });
      const foot = node.querySelector(".card-foot");
      const btn = node.querySelector(".btn");
      btn.remove();

      const sources = s.downloads && s.downloads.length
        ? s.downloads
        : (s.url ? [{ label: "下载", url: s.url }] : []);

      if (!sources.length) {
        const dis = document.createElement("span");
        dis.className = "btn btn-disabled";
        dis.textContent = "地址待补充";
        foot.appendChild(dis);
        return;
      }

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "btn dl-toggle";
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = `下载（${sources.length} 个来源） ▾`;

      const box = document.createElement("div");
      box.className = "sources";
      box.hidden = true;

      sources.forEach((src) => {
        const row = document.createElement("div");
        row.className = "source";

        const head = document.createElement("div");
        head.className = "source-head";
        const name = document.createElement("span");
        name.className = "source-name";
        name.textContent = src.label || "下载";
        const link = document.createElement("a");
        link.className = "btn small";
        link.href = src.url;
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = "打开 ↗";
        head.appendChild(name);
        head.appendChild(link);
        row.appendChild(head);

        if (src.note) {
          const note = document.createElement("p");
          note.className = "source-note";
          note.textContent = src.note;
          row.appendChild(note);
        }
        box.appendChild(row);
      });

      toggle.addEventListener("click", () => {
        const open = !box.hidden;
        box.hidden = open;
        toggle.setAttribute("aria-expanded", String(!open));
        toggle.textContent = open
          ? `下载（${sources.length} 个来源） ▾`
          : `收起下载 ▴`;
      });

      foot.appendChild(toggle);
      foot.appendChild(box);
      grid.appendChild(node);
    });
  }


  function renderContact() {
    const c = (state.data.site || {}).contact;
    const sec = document.getElementById("contact");
    if (!c || !c.email) { if (sec) sec.remove(); return; }

    const cfg = c.captcha || {};
    const locked = document.getElementById("contact-locked");
    const unlocked = document.getElementById("contact-unlocked");
    const area = document.getElementById("captcha-area");
    const slot = document.getElementById("turnstile-slot");
    const local = document.getElementById("local-challenge");
    const mail = document.getElementById("contact-mail");
    const to = document.getElementById("mail-to");
    const copy = document.getElementById("copy-mail");

    const reveal = () => {
      if (locked) locked.hidden = true;
      if (area) area.hidden = true;
      if (unlocked) unlocked.hidden = false;
      mail.textContent = c.email;
      mail.href = "mailto:" + c.email;
      to.href = "mailto:" + c.email;
    };

    document.getElementById("reveal-btn").addEventListener("click", () => {
      area.hidden = false;
      document.getElementById("reveal-btn").disabled = true;

      if (cfg.provider === "turnstile" && cfg.siteKey) {
        slot.hidden = false;
        local.hidden = true;
        loadTurnstile(cfg.siteKey, slot, reveal);
        return;
      }
      // 未配置 Turnstile 时用本地问答兜底
      slot.hidden = true;
      local.hidden = false;
      const q = document.getElementById("challenge-q");
      const a = document.getElementById("challenge-a");
      const tip = document.getElementById("challenge-tip");
      q.textContent = cfg.fallbackQuestion || "请输入下方提示的答案";
      tip.textContent = "";
      document.getElementById("challenge-go").addEventListener("click", () => {
        const want = String(cfg.fallbackAnswer || "").trim().toLowerCase();
        const got = a.value.trim().toLowerCase();
        if (want && got === want) { reveal(); }
        else { tip.textContent = "答案不对，再试一次～"; }
      });
      a.addEventListener("keydown", (e) => {
        if (e.key === "Enter") document.getElementById("challenge-go").click();
      });
    });

    copy.addEventListener("click", async () => {
      const old = copy.textContent;
      try {
        await navigator.clipboard.writeText(c.email);
        copy.textContent = "已复制 ✓";
      } catch (e) {
        copy.textContent = "复制失败，请长按邮箱";
      }
      setTimeout(() => { copy.textContent = old; }, 1600);
    });
  }

  function loadTurnstile(siteKey, slot, onSuccess) {
    const mount = () => {
      if (!window.turnstile) { slot.textContent = "验证组件加载失败，请刷新重试"; return; }
      window.turnstile.render(slot, {
        sitekey: siteKey,
        theme: "auto",
        callback: () => onSuccess(),
        "error-callback": () => { slot.textContent = "验证失败，请刷新重试"; },
      });
    };
    if (window.turnstile) { mount(); return; }
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.defer = true;
    s.onload = mount;
    s.onerror = () => { slot.textContent = "验证组件加载失败（网络原因），请刷新"; };
    document.head.appendChild(s);
  }

  function renderSponsor() {
    const sp = state.data.sponsor;
    if (!sp) return;
    $("#sponsor-title").textContent = sp.title || "赞助支持";
    $("#sponsor-desc").textContent = sp.desc || "";
    const box = $("#sponsor-list");
    box.innerHTML = "";
    (sp.methods || []).forEach((m) => {
      const card = document.createElement("div");
      card.className = "sponsor-card";
      const h = document.createElement("h3");
      h.textContent = m.name;
      card.appendChild(h);

      if (m.image) {
        const img = document.createElement("img");
        img.src = m.image;
        img.alt = `${m.name} 二维码`;
        img.loading = "lazy";
        img.addEventListener("error", () => {
          const ph = document.createElement("div");
          ph.className = "missing";
          ph.textContent = "二维码待上传";
          img.replaceWith(ph);
        });
        card.appendChild(img);
      } else {
        const ph = document.createElement("div");
        ph.className = "missing";
        ph.textContent = "二维码待上传";
        card.appendChild(ph);
      }

      if (m.note) {
        const p = document.createElement("p");
        p.className = "note";
        p.textContent = m.note;
        card.appendChild(p);
      }
      box.appendChild(card);
    });
  }



  const AGREED_KEY = "vc_agreed_v1";

  function initGate() {
    const gate = document.getElementById("gate");
    if (!gate) return;

    let agreed = false;
    try { agreed = localStorage.getItem(AGREED_KEY) === "1"; } catch (e) {}
    if (agreed) { gate.hidden = true; return; }

    gate.hidden = false;
    document.body.classList.add("gate-open");

    const body = document.getElementById("gate-body");
    const btn = document.getElementById("gate-agree");

    const unlock = () => {
      btn.disabled = false;
      btn.textContent = "我已阅读并同意，进入网站";
    };

    const checkScroll = () => {
      const reached = body.scrollTop + body.clientHeight >= body.scrollHeight - 6;
      if (reached) unlock();
    };

    // 内容不足一屏时直接可点
    if (body.scrollHeight <= body.clientHeight + 4) {
      unlock();
    } else {
      btn.textContent = "请先滑到底部";
      body.addEventListener("scroll", checkScroll, { passive: true });
      setTimeout(checkScroll, 300);
    }

    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      try { localStorage.setItem(AGREED_KEY, "1"); } catch (e) {}
      gate.hidden = true;
      document.body.classList.remove("gate-open");
    });
  }


  function initStats() {
    const box = document.getElementById("stats");
    if (!box) return;
    box.hidden = false;

    // 1) 站点访问量：不蒜子（免费、无需注册）
    if (!document.getElementById("busuanzi-script")) {
      const sc = document.createElement("script");
      sc.id = "busuanzi-script";
      sc.src = "https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js";
      sc.async = true;
      sc.onerror = () => {
        document.getElementById("busuanzi_value_site_pv").textContent = "—";
        document.getElementById("busuanzi_value_site_uv").textContent = "—";
      };
      document.head.appendChild(sc);
    }

    // 2) GitHub Release 下载次数（公开 API，缓存 10 分钟）
    const CACHE_KEY = "vc_gh_dl_v1";
    const renderGh = (data) => {
      if (!data) return;
      const el = document.getElementById("gh-dl-total");
      const total = (data.normal || 0) + (data.unlimited || 0);
      if (el) el.textContent = total;
    };
    let cached = null;
    try { cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); } catch (e) {}
    if (cached && Date.now() - (cached.t || 0) < 10 * 60 * 1000) {
      renderGh(cached.data);
    } else {
      fetch("https://api.github.com/repos/vc1689471081-prog/vc-files/releases", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((list) => {
          if (!Array.isArray(list)) return;
          const data = { normal: null, unlimited: null };
          list.forEach((rel) => (rel.assets || []).forEach((a) => {
            if (a.name.includes("normal")) data.normal = a.download_count;
            if (a.name.includes("unlimited")) data.unlimited = a.download_count;
          }));
          renderGh(data);
          try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data })); } catch (e) {}
        })
        .catch(() => {});
    }
  }

  function renderSaveTools() {
    const pathEl = document.getElementById("save-path-text");
    const copyBtn = document.getElementById("copy-path");
    if (!pathEl || !copyBtn) return;
    const path = pathEl.textContent.trim();

    copyBtn.addEventListener("click", async () => {
      const old = copyBtn.textContent;
      try {
        await navigator.clipboard.writeText(path);
        copyBtn.textContent = "已复制 ✓";
      } catch (e) {
        copyBtn.textContent = "复制失败，请长按选中";
      }
      setTimeout(() => { copyBtn.textContent = old; }, 1600);
    });
  }

  function renderMeta() {
    const meta = state.data.site || {};
    document.title = meta.title || document.title;
    $("#site-title").textContent = meta.title || "我的软件清单";
    $("#site-subtitle").textContent = meta.subtitle || "";
    $("#footer-text").textContent = meta.footer || "";
    $("#year").textContent = new Date().getFullYear();
  }

  async function boot() {
    initGate();
    try {
      const res = await fetch("data/software.json", { cache: "no-cache" });
      if (!res.ok) throw new Error(res.status);
      state.data = await res.json();
    } catch (e) {
      $("#empty").hidden = false;
      $("#empty").textContent = "数据加载失败：请通过 HTTP 服务器打开本站（file:// 不支持 fetch）。";
      return;
    }
    if (!state.data.categories || !state.data.categories.length) {
      state.data.categories = [{ id: "all", name: "全部" }];
    }
    renderMeta();
    renderContact();
    renderSaveTools();
    renderFilters();
    renderGrid();
    renderSponsor();

    const q = $("#q");
    const runSearch = (e) => { state.q = e.target.value || ""; renderGrid(); };
    ["input", "change", "keyup"].forEach((ev) => q.addEventListener(ev, runSearch));
    q.addEventListener("search", runSearch);
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
