/**
 * getStaticProps 안에서 쓰는 Supabase 조회 실패 처리.
 * 빈 목록이나 404로 넘기면 장애 중에 만든 빈 페이지가 캐시·배포에 남는다.
 * 오류를 던지면 ISR 재생성은 기존 페이지를 유지하고, 배포 빌드는 실패해 이전 배포가 계속 서비스된다.
 */
type DbError = { message: string; code?: string } | null

export function throwOnError(error: DbError, label: string): void {
  if (error) throw new Error(`${label} 조회 실패: ${error.message}`)
}

/** .single() 결과용: 행이 없으면(PGRST116) 404 처리를 하도록 false, 그 밖의 오류는 던진다 */
export function foundOrThrow(error: DbError, label: string): boolean {
  if (!error) return true
  if (error.code === 'PGRST116') return false
  throw new Error(`${label} 조회 실패: ${error.message}`)
}
