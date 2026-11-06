// 정적 사이트 생성기: content/ 의 마크다운 → dist/ 의 HTML
// 실행: npm run build   (변경 감지 모드: npm run dev)
import fs from "node:fs";
import path from "node:path";
import { Marked } from "marked";
import site from "./site.config.mjs";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, "dist");
const CONTENT = path.join(ROOT, "content");

// ── 유틸 ─────────────────────────────────────
const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const slugify = (s) =>
  String(s).toLowerCase().trim()
    .replace(/<[^>]+>/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");

const tagUrl = (t) => `/tags/${encodeURIComponent(t)}/`;

function fmtDate(d, style = "long") {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date)) return String(d);
  const y = date.getFullYear(), m = date.getMonth() + 1, day = date.getDate();
  if (style === "short") return `${String(m).padStart(2, "0")}.${String(day).padStart(2, "0")}`;
  return `${y}년 ${m}월 ${day}일`;
}

function write(rel, html) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dest, e.name);
    e.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

// ── 프론트매터 (--- 사이의 정보) 읽기 ──────────
function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([\w-]+)\s*:\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith("[") && v.endsWith("]")) {
      v = v.slice(1, -1).split(",").map((x) => x.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    } else if (v === "true" || v === "false") {
      v = v === "true";
    } else {
      v = v.replace(/^["']|["']$/g, "");
    }
    data[kv[1]] = v;
  }
  return { data, body: raw.slice(m[0].length) };
}

// ── 마크다운 렌더러 (제목에 앵커, 목차 수집) ──────
function render(md) {
  const toc = [];
  const used = {};
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens);
        let id = slugify(html) || "section";
        if (used[id] != null) id = `${id}-${++used[id]}`; else used[id] = 0;
        if (depth === 2 || depth === 3) toc.push({ depth, id, text: html.replace(/<[^>]+>/g, "") });
        return `<h${depth} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true">#</a>${html}</h${depth}>\n`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const external = /^https?:\/\//.test(href) && !href.startsWith(site.url);
        return `<a href="${esc(href)}"${title ? ` title="${esc(title)}"` : ""}${external ? ' target="_blank" rel="noopener"' : ""}>${text}</a>`;
      },
      image({ href, title, text }) {
        const img = `<img src="${esc(href)}" alt="${esc(text)}" loading="lazy">`;
        return title ? `<figure>${img}<figcaption>${esc(title)}</figcaption></figure>` : img;
      },
    },
  });
  return { html: marked.parse(md), toc };
}

// 한국어 기준 대략 분당 500자
const readingTime = (md) => Math.max(1, Math.round(md.replace(/```[\s\S]*?```/g, "").replace(/\s/g, "").length / 500));

// ── 콘텐츠 불러오기 ───────────────────────────
function loadCollection(dir, base) {
  const full = path.join(CONTENT, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(full, f), "utf8");
      const { data, body } = parseFrontmatter(raw);
      // 파일명 앞의 날짜(2026-11-07-)는 주소에서 뺍니다
      const slug = data.slug || f.replace(/\.md$/, "").replace(/^\d{4}-\d{2}-\d{2}-/, "");
      const { html, toc } = render(body);
      return {
        ...data,
        slug,
        url: `/${base}/${encodeURIComponent(slug)}/`,
        tags: Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : [],
        stack: Array.isArray(data.stack) ? data.stack : data.stack ? [data.stack] : [],
        html, toc,
        minutes: readingTime(body),
      };
    })
    .filter((p) => !p.draft)
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

// ── 공통 레이아웃 ─────────────────────────────
function layout({ title, description, body, path: pagePath = "/", type = "website", image }) {
  const fullTitle = title ? `${title} | ${site.title}` : site.title;
  const desc = description || site.description;
  const canonical = site.url.replace(/\/$/, "") + pagePath;
  const nav = [["/blog/", "글"], ["/projects/", "프로젝트"], ["/about/", "소개"]];
  const current = (href) => (pagePath.startsWith(href) ? ' aria-current="page"' : "");
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(title || site.title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(canonical)}">
${image ? `<meta property="og:image" content="${esc(site.url.replace(/\/$/, "") + image)}">` : ""}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="${esc(site.title)}" href="/rss.xml">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap">
<link rel="stylesheet" href="/assets/style.css">
<script>try{var t=localStorage.getItem("theme");if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
</head>
<body>
<a class="skip" href="#main">본문으로 건너뛰기</a>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="/">${esc(site.title)}</a>
    <nav aria-label="주요 메뉴">
      ${nav.map(([h, l]) => `<a href="${h}"${current(h)}>${l}</a>`).join("")}
      <button class="theme-toggle" type="button" aria-label="다크 모드 전환" title="다크 모드 전환">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.39 5.39 0 0 1-4.4 2.26 5.4 5.4 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>
      </button>
    </nav>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="wrap footer-inner">
    <span>© ${new Date().getFullYear()} ${esc(site.author)}</span>
    <span class="footer-links">${socialLinks()}<a href="/rss.xml">RSS</a></span>
  </div>
</footer>
<script src="/assets/main.js" defer></script>
</body>
</html>`;
}

function socialLinks() {
  const L = site.links || {};
  const items = [
    L.email && [`mailto:${L.email}`, "이메일"],
    L.github && [L.github, "GitHub"],
    L.linkedin && [L.linkedin, "LinkedIn"],
    L.instagram && [L.instagram, "Instagram"],
  ].filter(Boolean);
  return items.map(([h, l]) => `<a href="${esc(h)}"${h.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${l}</a>`).join("");
}

const tagList = (tags) =>
  tags.length ? `<ul class="tags">${tags.map((t) => `<li><a href="${tagUrl(t)}">${esc(t)}</a></li>`).join("")}</ul>` : "";

// 글 목록 한 줄
const postRow = (p) => `
<li class="row">
  <time class="row-date" datetime="${esc(p.date)}">${fmtDate(p.date, "short")}</time>
  <div class="row-body">
    <a class="row-title" href="${p.url}"><span class="mark">${esc(p.title)}</span></a>
    ${p.description ? `<p class="row-desc">${esc(p.description)}</p>` : ""}
  </div>
</li>`;

// 프로젝트 한 줄
const projectRow = (p) => `
<li class="project">
  <a class="project-link" href="${p.url}">
    ${p.thumbnail ? `<img class="project-thumb" src="${esc(p.thumbnail)}" alt="" loading="lazy">` : `<span class="project-thumb project-thumb--empty" aria-hidden="true">${esc((p.title || "").slice(0, 1))}</span>`}
    <span class="project-text">
      <span class="project-title"><span class="mark">${esc(p.title)}</span></span>
      ${p.summary ? `<span class="project-summary">${esc(p.summary)}</span>` : ""}
      ${p.stack.length ? `<span class="project-stack">${p.stack.map(esc).join(", ")}</span>` : ""}
    </span>
    <span class="project-period">${esc(p.period || (p.date ? new Date(p.date).getFullYear() : ""))}</span>
  </a>
</li>`;

// 연도별로 묶기 (글 목록)
function byYear(posts) {
  const groups = new Map();
  for (const p of posts) {
    const y = p.date ? new Date(p.date).getFullYear() : "기타";
    if (!groups.has(y)) groups.set(y, []);
    groups.get(y).push(p);
  }
  return [...groups].map(([y, list]) => `
  <section class="year">
    <h2 class="year-label">${y}</h2>
    <ul class="rows">${list.map(postRow).join("")}</ul>
  </section>`).join("");
}

// ── 페이지 만들기 ─────────────────────────────
function build() {
  const t0 = Date.now();
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  copyDir(path.join(ROOT, "public"), OUT);
  copyDir(path.join(ROOT, "assets"), path.join(OUT, "assets"));

  const posts = loadCollection("posts", "blog");
  const projects = loadCollection("projects", "projects");
  const allTags = new Map();
  for (const p of posts) for (const t of p.tags) allTags.set(t, (allTags.get(t) || 0) + 1);
  const sortedTags = [...allTags].sort((a, b) => b[1] - a[1]);

  // 홈
  const featured = projects.filter((p) => p.featured);
  const homeProjects = (featured.length ? featured : projects).slice(0, site.home.featuredProjects);
  write("index.html", layout({
    path: "/",
    body: `
<section class="hero wrap">
  <h1 class="hero-name">${esc(site.author)}</h1>
  <p class="hero-intro">${esc(site.intro)}</p>
  <p class="hero-links">${socialLinks()}</p>
</section>
${homeProjects.length ? `
<section class="wrap section">
  <div class="section-head"><h2>프로젝트</h2><a href="/projects/">전체 보기</a></div>
  <ul class="projects">${homeProjects.map(projectRow).join("")}</ul>
</section>` : ""}
<section class="wrap section">
  <div class="section-head"><h2>최근 글</h2><a href="/blog/">전체 보기</a></div>
  ${posts.length ? `<ul class="rows">${posts.slice(0, site.home.recentPosts).map(postRow).join("")}</ul>` : `<p class="empty">아직 글이 없습니다. content/posts 폴더에 첫 글을 추가해 보세요.</p>`}
</section>`,
  }));

  // 글 목록
  const tagNav = sortedTags.length
    ? `<nav class="tag-nav" aria-label="태그"><a href="/blog/" aria-current="page">전체 <span>${posts.length}</span></a>${sortedTags.map(([t, n]) => `<a href="${tagUrl(t)}">${esc(t)} <span>${n}</span></a>`).join("")}</nav>`
    : "";
  write("blog/index.html", layout({
    title: "글", path: "/blog/",
    body: `<div class="wrap page"><h1 class="page-title">글</h1>${tagNav}${posts.length ? byYear(posts) : `<p class="empty">아직 글이 없습니다.</p>`}</div>`,
  }));

  // 태그별 목록
  for (const [tag] of sortedTags) {
    const list = posts.filter((p) => p.tags.includes(tag));
    const nav = `<nav class="tag-nav" aria-label="태그"><a href="/blog/">전체 <span>${posts.length}</span></a>${sortedTags.map(([t, n]) => `<a href="${tagUrl(t)}"${t === tag ? ' aria-current="page"' : ""}>${esc(t)} <span>${n}</span></a>`).join("")}</nav>`;
    write(`tags/${tag}/index.html`, layout({
      title: `#${tag}`, path: tagUrl(tag),
      body: `<div class="wrap page"><h1 class="page-title">#${esc(tag)}</h1>${nav}${byYear(list)}</div>`,
    }));
  }

  // 글 상세
  posts.forEach((p, i) => {
    const newer = posts[i - 1], older = posts[i + 1];
    const toc = p.toc.length >= 3
      ? `<aside class="toc" aria-label="목차"><p class="toc-title">목차</p><ol>${p.toc.map((h) => `<li class="d${h.depth}"><a href="#${h.id}">${esc(h.text)}</a></li>`).join("")}</ol></aside>`
      : "";
    write(`blog/${p.slug}/index.html`, layout({
      title: p.title, description: p.description, path: p.url, type: "article", image: p.thumbnail,
      body: `
<article class="article wrap ${toc ? "has-toc" : ""}">
  <header class="article-head">
    <h1>${esc(p.title)}</h1>
    <p class="article-meta"><time datetime="${esc(p.date)}">${fmtDate(p.date)}</time><span>${p.minutes}분 분량</span></p>
    ${tagList(p.tags)}
  </header>
  ${toc}
  <div class="prose">${p.html}</div>
  <nav class="pager" aria-label="이전·다음 글">
    ${older ? `<a class="pager-prev" href="${older.url}"><small>이전 글</small>${esc(older.title)}</a>` : "<span></span>"}
    ${newer ? `<a class="pager-next" href="${newer.url}"><small>다음 글</small>${esc(newer.title)}</a>` : "<span></span>"}
  </nav>
  ${giscus()}
</article>`,
    }));
  });

  // 프로젝트 목록 & 상세
  write("projects/index.html", layout({
    title: "프로젝트", path: "/projects/",
    body: `<div class="wrap page"><h1 class="page-title">프로젝트</h1>${projects.length ? `<ul class="projects">${projects.map(projectRow).join("")}</ul>` : `<p class="empty">아직 프로젝트가 없습니다. content/projects 폴더에 추가해 보세요.</p>`}</div>`,
  }));
  for (const p of projects) {
    const facts = [
      p.period && ["기간", esc(p.period)],
      p.role && ["역할", esc(p.role)],
      p.stack.length && ["사용 기술", p.stack.map(esc).join(", ")],
      p.github && ["코드", `<a href="${esc(p.github)}" target="_blank" rel="noopener">GitHub 저장소</a>`],
      p.demo && ["결과물", `<a href="${esc(p.demo)}" target="_blank" rel="noopener">사이트 열기</a>`],
    ].filter(Boolean);
    write(`projects/${p.slug}/index.html`, layout({
      title: p.title, description: p.summary, path: p.url, type: "article", image: p.thumbnail,
      body: `
<article class="article wrap">
  <header class="article-head">
    <h1>${esc(p.title)}</h1>
    ${p.summary ? `<p class="article-lede">${esc(p.summary)}</p>` : ""}
    ${facts.length ? `<dl class="facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>` : ""}
  </header>
  ${p.thumbnail ? `<img class="article-cover" src="${esc(p.thumbnail)}" alt="">` : ""}
  <div class="prose">${p.html}</div>
  <p class="back"><a href="/projects/">프로젝트 목록으로</a></p>
</article>`,
    }));
  }

  // 소개
  const aboutFile = path.join(CONTENT, "about.md");
  const about = fs.existsSync(aboutFile) ? parseFrontmatter(fs.readFileSync(aboutFile, "utf8")) : { data: {}, body: "" };
  write("about/index.html", layout({
    title: about.data.title || "소개", path: "/about/",
    body: `<article class="article wrap"><header class="article-head"><h1>${esc(about.data.title || "소개")}</h1></header><div class="prose">${render(about.body).html}</div></article>`,
  }));

  // 404
  write("404.html", layout({
    title: "페이지를 찾을 수 없음", path: "/404",
    body: `<div class="wrap page"><h1 class="page-title">이 주소에는 페이지가 없습니다</h1><p class="empty">주소가 바뀌었거나 삭제된 글일 수 있어요. <a href="/blog/">글 목록</a>이나 <a href="/">홈</a>에서 찾아보세요.</p></div>`,
  }));

  // RSS & 사이트맵
  const base = site.url.replace(/\/$/, "");
  write("rss.xml", `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${esc(site.title)}</title><link>${base}/</link><description>${esc(site.description)}</description><language>ko</language>
${posts.slice(0, 30).map((p) => `<item><title>${esc(p.title)}</title><link>${base}${p.url}</link><guid>${base}${p.url}</guid>${p.date ? `<pubDate>${new Date(p.date).toUTCString()}</pubDate>` : ""}<description>${esc(p.description || "")}</description></item>`).join("\n")}
</channel></rss>`);
  const urls = ["/", "/blog/", "/projects/", "/about/", ...posts.map((p) => p.url), ...projects.map((p) => p.url)];
  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `<url><loc>${base}${u}</loc></url>`).join("\n")}
</urlset>`);
  write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);

  console.log(`✓ 빌드 완료: 글 ${posts.length}편, 프로젝트 ${projects.length}개 (${Date.now() - t0}ms) → dist/`);
}

function giscus() {
  const g = site.giscus || {};
  if (!g.repo || !g.repoId) return "";
  return `<section class="comments" aria-label="댓글"><script src="https://giscus.app/client.js"
  data-repo="${esc(g.repo)}" data-repo-id="${esc(g.repoId)}" data-category="${esc(g.category)}" data-category-id="${esc(g.categoryId)}"
  data-mapping="pathname" data-strict="0" data-reactions-enabled="1" data-emit-metadata="0" data-input-position="top"
  data-theme="preferred_color_scheme" data-lang="ko" crossorigin="anonymous" async></script></section>`;
}

build();

// npm run dev: 파일이 바뀌면 다시 빌드하고 http://localhost:3000 에서 미리보기
if (process.argv.includes("--watch")) {
  const http = await import("node:http");
  let timer;
  for (const dir of ["content", "assets", "public"]) {
    fs.watch(path.join(ROOT, dir), { recursive: true }, () => {
      clearTimeout(timer);
      timer = setTimeout(() => { try { build(); } catch (e) { console.error(e.message); } }, 150);
    });
  }
  const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".xml": "application/xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif" };
  http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]);
    let file = path.join(OUT, p);
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!fs.existsSync(file)) { res.writeHead(404, { "content-type": types[".html"] }); return res.end(fs.readFileSync(path.join(OUT, "404.html"))); }
    res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  }).listen(3000, () => console.log("미리보기: http://localhost:3000  (종료: Ctrl+C)"));
}
