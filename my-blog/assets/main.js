// 다크 모드 전환 (선택은 브라우저에 기억됩니다)
(() => {
  const root = document.documentElement;
  const btn = document.querySelector(".theme-toggle");
  const isDark = () =>
    root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const sync = () => btn && btn.setAttribute("aria-pressed", String(isDark()));
  sync();
  btn?.addEventListener("click", () => {
    root.dataset.theme = isDark() ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
    sync();
  });
})();

// 코드 블록 색칠 (코드가 있는 글에서만 불러옵니다)
(() => {
  if (!document.querySelector(".prose pre code")) return;
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.10.0/build/highlight.min.js";
  s.onload = () => window.hljs && window.hljs.highlightAll();
  document.head.appendChild(s);
})();

// 코드 블록 복사 버튼
document.querySelectorAll(".prose pre").forEach((pre) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "copy";
  b.textContent = "복사";
  b.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText((pre.querySelector("code") || pre).innerText);
      b.textContent = "복사됨";
      setTimeout(() => (b.textContent = "복사"), 1500);
    } catch (e) {}
  });
  pre.appendChild(b);
});

// 목차: 지금 읽는 부분 표시
(() => {
  const links = [...document.querySelectorAll(".toc a")];
  if (!links.length || !("IntersectionObserver" in window)) return;
  const map = new Map(links.map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((l) => l.classList.remove("active"));
      map.get(e.target.id)?.classList.add("active");
    });
  }, { rootMargin: "0px 0px -75% 0px" });
  map.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
})();
