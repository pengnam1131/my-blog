---
title: 개인 블로그 겸 포트폴리오
date: 2026-11-07
summary: 마크다운으로 글을 쓰면 정적 페이지로 바뀌는 나만의 블로그
period: 2026.11
role: 기획, 디자인, 개발
stack: [Node.js, Markdown, Vercel]
github: https://github.com/pengnam1131/my-blog
demo: 바로 이곳입니다.
featured: true
---

## 만든 이유

글과 포트폴리오를 한 주소에서 보여주고 싶었습니다. 블로그 서비스는 디자인을 바꾸기 어렵고, 포트폴리오 사이트는 따로 관리해야 해서 번거로웠습니다.

## 구조

- `content/` 의 마크다운 파일을 읽어서 HTML로 변환
- 글 목록, 태그별 목록, RSS, 사이트맵을 자동으로 생성
- GitHub에 올리면 Vercel이 빌드하고 배포

## 배운 점

정적 사이트만으로도 블로그에 필요한 기능 대부분을 만들 수 있었습니다. 댓글은 GitHub Discussions 기반의 giscus로 붙일 수 있습니다.

## 마무리

언젠간 동적 호스팅을 사용해, DB와 연동하려고 합니다.