---
title: Blog Update (ver.1.1)
date: 2019-07-11 20:07:02
category: 기록한다
---

## ver.1.1

블로그 페이지를 blog.dowha.kim 서브도메인으로 분리해서 연결하고 메인 페이지를 따로 구축했다. 그리고 Netlify에서 제공하는 기본 주소들은 gatsby-plugin-netlify 플러그인을 설치해서 만든 \_redirects 파일을 통해 dowha.kim 도메인으로만 연결되도록 설정했다.

---

#### Done Lists

- [x] 서브도메인 분리
- [x] _.netlify.com 주소 _.dowha.kim으로 redirect 설정

---

#### To-Do List

- [ ] dowha.kim 메인 페이지 하단 모바일 CSS padding값 재설정
- [ ] 파비콘 흰 배경으로 변경
- [ ] 제목 포맷 변경 및 통일
- [ ] 리뷰 게시물 하단부 포맷 통일
- [ ] 다크모드 게시물 목록 hover 흰색 그림자 제거
- [ ] 느리게 로딩되는 프로필이미지 border-radius 설정 확인
- [ ] 카테고리 클릭 시 내려가는 스크롤 조정
- [ ] 메인페이지 title 변경 후 고정
- [ ] 블로그 콘텐츠 Contentful로 이전 및 연동
- [ ] bio - social media 부분에 링크드인 추가
- [ ] about 페이지에 타이틀과 bio 추가
- [ ] 게시물 상단 날짜 추가
- [ ] 메인 페이지 게시물 목록 날짜 추가
- [ ] 소셜미디어 공유 메타데이터 설정
- [ ] .gitignore 설정 확인(/public 등)
- [ ] 없는 페이지 Netlify redirect 설정(마주한다.dowha.kim/\* 등)
- [ ] 페이지(contact 등) 추가
- [ ] 게시물 아카이브 페이지(movie-list, book-list 등) 추가
- [ ] 게시물 해시태그 추가 후 블로그 제목 옆에 드롭다운 메뉴로 추가
- [ ] Buy Me a Coffee 버튼 bio 부분으로 이동
- [ ] 메인 페이지 게시물 목록에 이미지 썸네일 추가
- [ ] 게시물 하단 이전 URL 링크 추가
- [ ] 구글 애드센스 추가
- [ ] 게시물 제목 CSS work-break, 영문 text-transform: capitalize 설정
- [ ] 한글 URL 해결책 검색 및 적용
- [ ] 상단 바이오와 하단 바이오 분리
- [ ] 영어/한국어 언어 버튼 추가 및 페이지에 적용(i18n 플러그인)
- [ ] 스티비 API 활용해서 구독 form 붙이기 (참고: [1](https://github.com/revolunet/react-mailchimp-subscribe/blob/master/src/index.js), [2](https://www.npmjs.com/package/gatsby-plugin-mailchimp), [3](https://www.netlify.com/docs/form-handling/), [4](https://help.stibee.com/ko/articles/1040878-api))
