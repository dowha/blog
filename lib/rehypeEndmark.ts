/**
 * 글 끝에 엔드마크를 붙이는 rehype 플러그인.
 * - 마지막 블록이 문단·목록·인용문이면, 가장 마지막 단어(중첩 목록·인용 포함) 뒤에 인라인 점을 붙인다
 * - 이미지·영상 등으로 끝나면 다음 줄 왼쪽(본문 정렬선)에 블록 점을 둔다
 */
type HastNode = {
  type: string
  tagName?: string
  value?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}

const DESCEND = new Set(['ul', 'ol', 'li', 'blockquote'])

const isBlank = (n: HastNode) => n.type === 'text' && !(n.value ?? '').trim()

const lastChild = (n: HastNode) => {
  const kids = (n.children ?? []).filter((c) => !isBlank(c))
  return kids[kids.length - 1]
}

const mark = (className: string): HastNode => ({
  type: 'element',
  tagName: 'span',
  properties: { className: [className], ariaHidden: 'true' },
  children: [],
})

export default function rehypeEndmark() {
  return (tree: HastNode) => {
    let node = lastChild(tree)
    if (!node || node.type !== 'element') return

    // 목록·인용은 마지막 항목 → 그 안의 마지막 블록으로 계속 내려간다
    while (node.tagName && DESCEND.has(node.tagName)) {
      const next: HastNode | undefined = lastChild(node)
      if (node.tagName === 'li' && (!next || next.type !== 'element' || !['ul', 'ol', 'p'].includes(next.tagName ?? ''))) {
        break // 항목 끝이 글자(또는 인라인)면 여기에 붙인다
      }
      if (!next || next.type !== 'element') break
      node = next
    }

    if (node.tagName === 'p' || node.tagName === 'li') {
      node.children = [...(node.children ?? []), mark('endmark-inline')]
    } else {
      tree.children = [...(tree.children ?? []), mark('endmark-block')]
    }
  }
}
