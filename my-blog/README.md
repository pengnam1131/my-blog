# 나만의 블로그 겸 포트폴리오

마크다운 파일로 글을 쓰면 정적 웹사이트로 바뀌는 블로그입니다. 서버와 DB가 없어서 **Vercel 무료 플랜**으로 운영할 수 있습니다.

## 폴더 구조

```
my-blog/
├─ site.config.mjs     ← 이름, 소개, 링크, 도메인 (먼저 여기부터 수정)
├─ content/
│  ├─ posts/           ← 블로그 글 (.md)
│  ├─ projects/        ← 포트폴리오 프로젝트 (.md)
│  └─ about.md         ← 소개 페이지
├─ public/
│  ├─ images/          ← 사진, 썸네일
│  └─ favicon.svg      ← 브라우저 탭 아이콘
├─ assets/
│  ├─ style.css        ← 디자인 (맨 위 색상 값만 바꿔도 분위기 변경)
│  └─ main.js          ← 다크 모드, 코드 복사 버튼, 목차
└─ build.mjs           ← 마크다운을 HTML로 바꾸는 스크립트 (건드릴 필요 없음)
```

## 1. 내 컴퓨터에서 실행하기

[Node.js](https://nodejs.org) LTS 버전을 설치한 뒤, 이 폴더에서 터미널을 열고 다음을 실행합니다.

```bash
npm install      # 처음 한 번만
npm run dev      # 미리보기 서버 실행
```

브라우저에서 http://localhost:3000 을 열면 사이트가 보입니다. 파일을 저장하면 자동으로 다시 빌드되니 새로고침만 하면 됩니다.

## 2. 글 쓰기

`content/posts/` 에 새 파일을 만듭니다. 파일 이름이 주소가 됩니다.

- `2026-11-10-my-first-post.md` → `내도메인/blog/my-first-post/` (앞의 날짜는 주소에서 빠집니다)

파일 맨 위에 글 정보를 적고, 그 아래에 본문을 씁니다.

```markdown
---
title: 글 제목
date: 2026-11-10
description: 목록에 보일 한 줄 설명
tags: [React, 회고]
---

여기부터 본문입니다.
```

| 항목 | 설명 |
| --- | --- |
| `title` | 글 제목 (필수) |
| `date` | 날짜. 최신순 정렬에 쓰임 (필수) |
| `description` | 목록과 검색 결과에 보이는 설명 |
| `tags` | 태그. 태그별 목록이 자동으로 생김 |
| `thumbnail` | 공유 미리보기 이미지 (예: `/images/cover.jpg`) |
| `draft: true` | 사이트에 공개하지 않음 (임시 저장) |

마크다운 문법은 사이트에 있는 「글쓰기 문법 정리」 글을 참고하세요. 다 보고 나면 그 파일은 지워도 됩니다.

**이미지**는 `public/images/` 에 넣고 본문에서 `![설명](/images/파일명.jpg)` 로 씁니다.

> 글을 쉽게 쓰고 싶다면 [Obsidian](https://obsidian.md)이나 [Typora](https://typora.io) 같은 마크다운 편집기로 `content` 폴더를 열어서 쓰면 velog처럼 미리보며 작성할 수 있습니다.

## 3. 프로젝트 추가하기

`content/projects/` 에 파일을 만듭니다. `sample-project.md` 를 복사해서 쓰는 게 가장 쉽습니다.

```markdown
---
title: 프로젝트 이름
date: 2026-06-01
summary: 한 문장 설명
period: 2026.03 – 2026.06
role: 프론트엔드
stack: [React, TypeScript]
github: https://github.com/...
demo: https://...
thumbnail: /images/project-thumb.png
featured: true
---
```

`featured: true` 를 단 프로젝트가 홈 화면에 보입니다.

## 4. 배포하기 (GitHub → Vercel → 가비아 도메인)

### ① GitHub에 올리기
1. [github.com](https://github.com) 에서 새 저장소(repository)를 만듭니다. 예: `my-blog`
2. 이 폴더를 그 저장소에 올립니다. 명령어가 어렵다면 [GitHub Desktop](https://desktop.github.com) 앱을 쓰면 버튼으로 올릴 수 있습니다.

```bash
git init
git add .
git commit -m "블로그 시작"
git branch -M main
git remote add origin https://github.com/내아이디/my-blog.git
git push -u origin main
```

### ② Vercel에 연결
1. [vercel.com](https://vercel.com) 에 GitHub 계정으로 가입합니다. 플랜은 Hobby(무료)를 고릅니다.
2. **Add New → Project** 에서 `my-blog` 저장소를 고르고 **Deploy** 를 누릅니다.
   빌드 설정은 `vercel.json` 에 들어 있어서 따로 바꿀 것이 없습니다.
3. `프로젝트명.vercel.app` 주소로 사이트가 열리는지 확인합니다.

### ③ 가비아 도메인 연결
1. Vercel 프로젝트의 **Settings → Domains** 에서 내 도메인(예: `mysite.com`)을 추가합니다.
2. Vercel 화면에 나온 **A 레코드 값**과 **CNAME 값**을 복사합니다.
3. 가비아 **My가비아 → 도메인 통합관리툴 → DNS 관리 → DNS 설정**에서 다음과 같이 입력합니다.

| 타입 | 호스트 | 값 |
| --- | --- | --- |
| A | `@` | Vercel에 표시된 IP |
| CNAME | `www` | Vercel에 표시된 CNAME 값 |

   - 원래 있던 `@` A 레코드(가비아 기본 주차 페이지)는 삭제합니다.
4. 몇 분에서 몇 시간 뒤 Vercel 화면에 **Valid Configuration** 이 뜨면 연결이 끝난 것이고, https도 자동으로 적용됩니다.
5. 마지막으로 `site.config.mjs` 의 `url` 을 내 도메인으로 바꾸고 GitHub에 다시 올립니다.

### 이후 글을 올릴 때
새 `.md` 파일을 만들고 GitHub에 올리면(push) 1분 안에 사이트에 반영됩니다.

## 5. 댓글 달기 (선택, 무료)

[giscus.app](https://giscus.app/ko) 에서 GitHub 저장소를 연결하면 `repo`, `repoId`, `category`, `categoryId` 값을 받을 수 있습니다. 이 값을 `site.config.mjs` 의 `giscus` 항목에 넣으면 글 아래에 댓글창이 생깁니다. 저장소를 Public으로 만들고 Discussions 기능을 켜야 합니다.

## 6. 디자인 바꾸기

- 색: `assets/style.css` 맨 위의 `--accent`(링크 색), `--mark`(형광펜 색) 등을 바꿉니다.
- 아이콘: `public/favicon.svg` 의 `홍` 글자를 바꿉니다.
