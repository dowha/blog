/**
 * 관리자 화면(blog /desk · hello /wave) 공통 버튼·입력칸 스타일
 * 줄 높이(leading)를 직접 지정해 감싸는 목록·문단의 줄 높이에 영향받지 않게 한다
 * 색 체계: 주 동작 파랑 #0086FF(hover #006FD6), 위험 주황 #c8481c, 나머지 회색
 * ⚠️ hello/components/wave/ui.ts와 같은 내용을 유지한다. 한쪽을 고치면 다른 쪽도 고칠 것.
 */

const BASE = 'inline-flex shrink-0 items-center justify-center gap-1 transition-colors disabled:cursor-not-allowed disabled:opacity-40'

/** 주 동작: 저장·발행·확인 (화면·항목당 하나) */
export const BTN_PRIMARY = `${BASE} rounded-md bg-[#0086FF] px-3 py-1.5 text-xs leading-5 font-medium text-white hover:bg-[#006FD6] disabled:hover:bg-[#0086FF]`

/** 보조 동작: 초안 저장·새 항목·로그인 */
export const BTN_SECONDARY = `${BASE} rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs leading-5 font-medium text-gray-700 hover:border-gray-400 hover:text-gray-900`

/** 취소 등 가장 약한 동작 */
export const BTN_GHOST = `${BASE} rounded-md px-3 py-1.5 text-xs leading-5 text-gray-500 hover:bg-gray-100 hover:text-gray-800`

/** 위험 동작 확인 (삭제 확인창의 확인 버튼) */
export const BTN_DANGER = `${BASE} rounded-md bg-[#c8481c] px-3 py-1.5 text-xs leading-5 font-medium text-white hover:bg-[#a93c17] disabled:hover:bg-[#c8481c]`

/** 목록·입력줄 안의 작은 버튼: 수정·업로드·검사 */
export const BTN_SMALL = `${BASE} rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[11px] leading-4 text-gray-500 hover:border-gray-400 hover:text-gray-800`

/** 작은 삭제 버튼 */
export const BTN_DANGER_SMALL = `${BASE} rounded-md border border-[#f8c8b5] bg-white px-2 py-0.5 text-[11px] leading-4 text-[#c8481c] hover:bg-[#fef3ee] disabled:border-gray-200 disabled:text-gray-300 disabled:hover:bg-white`
