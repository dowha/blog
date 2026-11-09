/**
 * 관리자 화면(blog /desk · hello /wave) 공통 버튼·입력칸 스타일
 * 줄 높이(leading)를 직접 지정해 감싸는 목록·문단의 줄 높이에 영향받지 않게 한다
 * 색 체계: 주 동작 brand(hover brand-dark), 위험 warn, 나머지 회색 (tailwind.config.ts 색 이름)
 * ⚠️ hello/components/wave/ui.ts와 같은 내용을 유지한다. 한쪽을 고치면 다른 쪽도 고치고 blog에서 pnpm check:family로 확인할 것.
 */

// 큰 버튼은 모두 높이 28px (테두리 2 + 위아래 여백 8 + 줄 높이 18). 테두리가 없는 버튼도 투명 테두리로 높이를 맞춘다
const BASE = 'inline-flex shrink-0 items-center justify-center gap-1 transition-colors disabled:cursor-not-allowed disabled:opacity-40'

/** 주 동작: 저장·발행·확인 (화면·항목당 하나) */
export const BTN_PRIMARY = `${BASE} rounded-md border border-transparent bg-brand px-3 py-1 text-xs leading-[18px] font-medium text-white hover:bg-brand-dark disabled:hover:bg-brand`

/** 보조 동작: 초안 저장·새 항목·로그인 */
export const BTN_SECONDARY = `${BASE} rounded-md border border-gray-200 bg-white px-3 py-1 text-xs leading-[18px] font-medium text-gray-700 hover:border-gray-400 hover:text-gray-900`

/** 취소 등 가장 약한 동작 */
export const BTN_GHOST = `${BASE} rounded-md border border-transparent px-3 py-1 text-xs leading-[18px] text-gray-500 hover:bg-gray-100 hover:text-gray-800`

/** 위험 동작 확인 (삭제 확인창의 확인 버튼) */
export const BTN_DANGER = `${BASE} rounded-md border border-transparent bg-warn px-3 py-1 text-xs leading-[18px] font-medium text-white hover:bg-warn-dark disabled:hover:bg-warn`

/** 목록·입력줄 안의 작은 버튼: 수정·업로드·검사 */
export const BTN_SMALL = `${BASE} rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[11px] leading-4 text-gray-500 hover:border-gray-400 hover:text-gray-800`

/** 작은 삭제 버튼 */
export const BTN_DANGER_SMALL = `${BASE} rounded-md border border-warn-border bg-white px-2 py-0.5 text-[11px] leading-4 text-warn hover:bg-warn-bg disabled:border-gray-200 disabled:text-gray-300 disabled:hover:bg-white`
