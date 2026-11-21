#!/bin/zsh
# blog-shorts-draft 함수의 Discord 슬래시 명령(/short, /post)을 등록한다 (DO-94).
# 이름이 같은 명령은 덮어쓰고, 예전 /draft는 지운다.
# 등록 후 Discord 앱에 반영되기까지 최대 1시간쯤 걸릴 수 있다.
#
# 사용: ./register-commands.sh
#   애플리케이션 ID(공개값)와 봇 토큰(비밀값)을 물어본다. 토큰은 화면·기록에 남지 않는다.
#   둘 다 Discord 개발자 포털 > 해당 앱 > General Information / Bot 에 있다.
set -eu

printf "애플리케이션 ID: "
read -r APP_ID
printf "봇 토큰(입력 안 보임): "
read -rs BOT_TOKEN
echo

register() {
  local body="$1"
  local code
  code=$(curl -sS -o /tmp/discord_cmd_resp.$$ -w '%{http_code}' \
    -X POST "https://discord.com/api/v10/applications/${APP_ID}/commands" \
    -H "Authorization: Bot ${BOT_TOKEN}" \
    -H "Content-Type: application/json" \
    --data "$body")
  echo "HTTP ${code}: $(head -c 200 /tmp/discord_cmd_resp.$$)"
  rm -f /tmp/discord_cmd_resp.$$
}

# type 1 = 슬래시 명령, 옵션 type 3 = 문자열
register '{"name":"short","type":1,"description":"Shorts 초안 저장 (비우면 여러 줄 입력 창)","options":[{"type":3,"name":"text","description":"내용 (280자 이내)","required":false,"max_length":280}]}'
register '{"name":"post","type":1,"description":"글(posts) 초안 저장 — 제목·본문 입력 창"}'

# 예전 /draft 삭제 (/short로 대체). 전역 명령과, 봇이 들어간 각 서버(길드) 명령을 모두 확인한다.
API="https://discord.com/api/v10"
DRAFT_ID_PY='import json,sys
d=json.load(sys.stdin)
print(next((c["id"] for c in d if isinstance(c,dict) and c.get("name")=="draft"),"") if isinstance(d,list) else "")'

delete_draft() {
  local cmds="$1" where="$2" id
  id=$(curl -sS "${API}/${cmds}" -H "Authorization: Bot ${BOT_TOKEN}" | python3 -c "$DRAFT_ID_PY")
  if [ -n "$id" ]; then
    curl -sS -o /dev/null -w "${where} /draft 삭제 HTTP %{http_code}\n" -X DELETE \
      "${API}/${cmds}/${id}" -H "Authorization: Bot ${BOT_TOKEN}"
  else
    echo "${where} /draft 없음"
  fi
}

delete_draft "applications/${APP_ID}/commands" "전역"
GUILDS=$(curl -sS "${API}/users/@me/guilds" -H "Authorization: Bot ${BOT_TOKEN}" \
  | python3 -c 'import json,sys
d=json.load(sys.stdin)
print(" ".join(g["id"] for g in d) if isinstance(d,list) else "")')
for gid in ${=GUILDS}; do
  delete_draft "applications/${APP_ID}/guilds/${gid}/commands" "서버 ${gid}"
done
