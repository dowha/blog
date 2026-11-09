import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyOwner } from '@/lib/deskAuth'
import {
  SPELL_CATEGORY_LABEL,
  SPELL_MAX_CHARS,
  markdownToPlain,
  type SpellField,
  type SpellIssue,
  type SpellResult,
} from '@/lib/spellcheck'

const BAREUN_URL = 'https://api.bareun.ai/bareun.RevisionService/CorrectError'

// 바른 응답은 protojson이라 camelCase/snake_case 둘 다 올 수 있어 양쪽을 받는다
type Revision = { revised?: string; category?: string; helpId?: string; help_id?: string }
type Block = {
  origin?: { content?: string }
  revised?: string
  revisions?: Revision[]
}
type BareunResponse = {
  revisedBlocks?: Block[]
  revised_blocks?: Block[]
  helps?: Record<string, { comment?: string }>
}

async function correct(field: SpellField, apiKey: string): Promise<SpellIssue[]> {
  const content = markdownToPlain(field.text)
  if (!content) return []

  const res = await fetch(BAREUN_URL, {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document: { content, language: 'ko-KR' },
      encoding_type: 'UTF32',
      // 보조 용언 붙여 쓰기(알려줘서·읽어봤다)는 허용 표기라 경고하지 않는다 (표기 규칙 §13)
      config: { disable_vx_spacing: true, treat_as_title: field.title === true },
    }),
  })
  if (!res.ok) throw new Error(`바른 API 오류 (${res.status})`)

  const data = (await res.json()) as BareunResponse
  const blocks = data.revisedBlocks ?? data.revised_blocks ?? []
  return blocks
    .map((b) => {
      const top = b.revisions?.[0]
      const helpId = top?.helpId ?? top?.help_id
      const category = top?.category ?? ''
      return {
        field: field.label,
        origin: b.origin?.content ?? '',
        revised: top?.revised ?? b.revised ?? '',
        category: SPELL_CATEGORY_LABEL[category] ?? category,
        // 설명에 섞여 오는 바른 내부 표시(<IN>웬지</IN> 등)는 걷어낸다
        comment: helpId ? data.helps?.[helpId]?.comment?.replace(/<\/?[A-Z]+>/g, '') : undefined,
      }
    })
    .filter((i) => i.origin && i.revised && i.origin !== i.revised)
}

/** /desk 편집 화면의 맞춤법 확인. 바른 API가 유료라 소유자만 호출할 수 있다 */
export default async function handler(req: NextApiRequest, res: NextApiResponse<SpellResult>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'POST만 허용됩니다.' })
  }

  const authError = await verifyOwner(req)
  if (authError) return res.status(401).json({ error: authError })

  const apiKey = process.env.BAREUN_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'BAREUN_API_KEY가 설정되지 않았습니다.' })

  const raw = (req.body ?? {}).fields
  if (!Array.isArray(raw)) return res.status(400).json({ error: 'fields가 필요합니다.' })
  const fields: SpellField[] = raw
    .filter((f): f is SpellField => typeof f?.label === 'string' && typeof f?.text === 'string')
    .map((f) => ({ label: f.label, text: f.text, title: f.title === true }))
    .filter((f) => f.text.trim())

  const total = fields.reduce((n, f) => n + f.text.length, 0)
  if (total > SPELL_MAX_CHARS) {
    return res.status(400).json({ error: `한 번에 ${SPELL_MAX_CHARS.toLocaleString()}자까지 검사할 수 있습니다.` })
  }

  try {
    const results = await Promise.all(fields.map((f) => correct(f, apiKey)))
    // 같은 칸의 같은 지적은 한 번만 보여 주고 횟수를 센다
    const merged = new Map<string, SpellIssue>()
    for (const i of results.flat()) {
      const key = `${i.field}\u0000${i.origin}\u0000${i.revised}`
      const prev = merged.get(key)
      if (prev) prev.count = (prev.count ?? 1) + 1
      else merged.set(key, { ...i })
    }
    return res.status(200).json({ issues: [...merged.values()] })
  } catch (e) {
    const message = e instanceof Error ? e.message : '맞춤법 검사에 실패했습니다.'
    console.error('spellcheck 오류:', message)
    return res.status(502).json({ error: message })
  }
}
