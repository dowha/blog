/**
 * `==강조할 문장==` → <mark>강조할 문장</mark> (옵시디언·타이포라와 같은 하이라이트 문법)
 *
 * 마크다운 글자(text) 노드만 바꾼다. 코드 블록·인라인 코드·HTML(iframe 등)은 건드리지 않는다.
 * `==` 바로 안쪽이 공백이면 하이라이트로 보지 않아 `a == b` 같은 문장은 그대로 둔다.
 * 한계: 굵게 등 다른 서식을 가로지르는 하이라이트(==**a** b==)는 지원하지 않는다.
 */
type Node = { type: string; value?: string; children?: Node[]; data?: Record<string, unknown> }

export const MARK_PATTERN = /==(?=\S)([^=\n]*?\S)==/g

function splitText(value: string): Node[] | null {
  // matchAll은 정규식의 lastIndex를 이어받으므로 test()를 먼저 쓰지 않는다
  const matches = Array.from(value.matchAll(new RegExp(MARK_PATTERN.source, 'g')))
  if (!matches.length) return null
  const out: Node[] = []
  let last = 0
  for (const m of matches) {
    const start = m.index ?? 0
    if (start > last) out.push({ type: 'text', value: value.slice(last, start) })
    out.push({ type: 'mark', data: { hName: 'mark' }, children: [{ type: 'text', value: m[1] }] })
    last = start + m[0].length
  }
  if (last < value.length) out.push({ type: 'text', value: value.slice(last) })
  return out
}

function walk(node: Node) {
  if (!node.children) return
  const next: Node[] = []
  for (const child of node.children) {
    if (child.type === 'text' && child.value) {
      next.push(...(splitText(child.value) ?? [child]))
    } else {
      walk(child)
      next.push(child)
    }
  }
  node.children = next
}

export default function remarkMark() {
  return (tree: Node) => walk(tree)
}
