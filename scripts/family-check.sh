#!/usr/bin/env bash
# blog.dowha.kim과 dowha.kim(hello)이 같게 유지해야 하는 부분을 비교한다.
# 공유 파일을 고친 뒤 실행: pnpm check:family
# hello 저장소 위치는 기본값이 ../hello이고, HELLO_DIR 환경 변수로 바꿀 수 있다.
set -uo pipefail

BLOG="$(cd "$(dirname "$0")/.." && pwd)"
HELLO="${HELLO_DIR:-$BLOG/../hello}"
if [ ! -d "$HELLO" ]; then
  echo "hello 저장소를 찾을 수 없습니다: $HELLO (HELLO_DIR로 지정하세요)"
  exit 2
fi
HELLO="$(cd "$HELLO" && pwd)"

fail=0

# 서로를 가리키는 머리 주석('⚠️ … 같은 내용을 유지', '규칙 원본')과 'use client'는 빼고 비교한다
strip() {
  grep -v -e '⚠️' -e '규칙 원본' -e "^'use client'" "$1" | sed '/./,$!d'
}

# CSS 공통 블록만 잘라낸다
css_block() {
  sed -n '/공통 블록 시작/,/공통 블록 끝/p' "$1"
}

# tailwind 설정의 사이트 공통 색 줄만 뽑는다
colors() {
  grep -E '^[[:space:]]*(page|brand|warn):' "$1" | sed 's/^[[:space:]]*//'
}

compare() { # 이름, blog 쪽 출력, hello 쪽 출력
  if diff -u <(printf '%s\n' "$2") <(printf '%s\n' "$3") >/tmp/family-check.diff 2>&1; then
    echo "  같음  $1"
  else
    echo "  다름  $1"
    sed 's/^/        /' /tmp/family-check.diff | head -20
    fail=1
  fi
}

pair() { # 이름, blog 파일, hello 파일
  if [ ! -f "$BLOG/$2" ] || [ ! -f "$HELLO/$3" ]; then
    echo "  없음  $1 ($2 / $3)"
    fail=1
    return
  fi
  compare "$1" "$(strip "$BLOG/$2")" "$(strip "$HELLO/$3")"
}

echo "패밀리 점검: $BLOG ↔ $HELLO"
compare "CSS 공통 블록" "$(css_block "$BLOG/styles/globals.css")" "$(css_block "$HELLO/app/globals.css")"
compare "색 이름 (tailwind)" "$(colors "$BLOG/tailwind.config.ts")" "$(colors "$HELLO/tailwind.config.ts")"
pair "관리자 버튼 스타일" components/desk/ui.ts components/wave/ui.ts
pair "날짜 선택기" components/desk/DatePicker.tsx components/ui/date-picker.tsx
pair "확인창" components/desk/ConfirmDialog.tsx components/wave/confirm-dialog.tsx
pair "표기 점검 규칙" lib/styleCheck.ts lib/styleCheck.ts

# 사이트 색은 색 이름(brand, warn, page 등)으로만 쓴다
hex=$(grep -rniE '\[#(0086FF|006fd6|c8481c|ee6033|fcfcfc|fef3ee|f8c8b5|eef6ff|b3dbff|a93c17)\]' \
  "$BLOG/pages" "$BLOG/components" "$BLOG/lib" "$HELLO/app" "$HELLO/components" "$HELLO/lib" 2>/dev/null)
if [ -z "$hex" ]; then
  echo "  같음  사이트 색을 직접 적은 곳 없음"
else
  echo "  다름  사이트 색을 직접 적은 곳 (색 이름으로 바꿀 것)"
  echo "$hex" | sed "s|$BLOG/|blog/|; s|$HELLO/|hello/|; s/^/        /" | cut -c1-160
  fail=1
fi

rm -f /tmp/family-check.diff
if [ $fail -eq 0 ]; then echo "결과: 모두 같습니다."; else echo "결과: 맞춰야 할 곳이 있습니다."; fi
exit $fail
