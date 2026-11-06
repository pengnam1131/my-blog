// ──────────────────────────────────────────────
// 사이트 기본 정보 — 이 파일만 고치면 이름·소개·링크가 전부 바뀝니다.
// ──────────────────────────────────────────────
export default {
  // 실제 도메인 (가비아에서 산 주소). RSS·사이트맵·공유 미리보기에 쓰입니다.
  url: "https://www.bulbkitty.com",

  // 사이트 이름과 주인 정보
  title: "전구냥이의 작업실",
  author: "김정훈",
  // 홈 화면 첫 줄 아래에 들어가는 한두 문장 소개
  intro:
    "만든 것과 배운 것을 기록합니다. 프로젝트는 왜 만들었는지부터, 글은 막혔던 지점부터 씁니다.",
  // 검색엔진·공유 미리보기에 쓰이는 설명
  description: "전구냥이의 포트폴리오와 블로그",

  // 연락처·링크 (없는 항목은 빈 문자열 "" 로 두면 화면에서 숨겨집니다)
  links: {
    email: "pengnam1131@gmail.com",
    github: "https://github.com/pengnam1131",
    linkedin: "",
    instagram: "",
  },

  // 홈 화면에 보여줄 개수
  home: {
    recentPosts: 5,
    featuredProjects: 3,
  },

  // 댓글 (선택) — giscus.app 에서 값을 발급받아 넣으면 글 아래에 댓글창이 생깁니다.
  // 비워두면 댓글 기능이 꺼집니다.
  giscus: {
    repo: "",        // 예: "your-id/my-blog"
    repoId: "",
    category: "",
    categoryId: "",
  },
};
