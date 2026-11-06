/**
 * 날짜 표시는 항상 한국 시간 기준.
 * 서버(Vercel, UTC)와 브라우저의 시간대가 달라 새벽 0~9시(KST) 글이 하루 밀리거나
 * hydration 불일치가 나는 것을 막는다.
 */
const TZ = 'Asia/Seoul'

/** 'YYYY.MM.DD.' 형태(ko-KR 포맷에서 공백 제거). withYear=false면 'MM.DD.' */
export const formatKstDate = (iso: string, withYear = true) =>
  new Date(iso)
    .toLocaleDateString('ko-KR', {
      timeZone: TZ,
      ...(withYear ? { year: 'numeric' } : {}),
      month: '2-digit',
      day: '2-digit',
    })
    .replace(/\s/g, '')

export const kstYear = (iso: string | Date = new Date()) =>
  Number(new Intl.DateTimeFormat('en', { timeZone: TZ, year: 'numeric' }).format(new Date(iso)))
