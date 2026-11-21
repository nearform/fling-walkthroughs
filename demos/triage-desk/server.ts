// The triage desk's server: /api/* at the site's own address. It asks Claude to triage a ticket
// with the site's ANTHROPIC_API_KEY, which never reaches the page, and signs the draft reply with
// whoever is signed in.
import { secret, viewer } from '@nearform/fling/server'

const MODEL = 'claude-haiku-5-5'
const MAX_TICKET = 8000

const TOOL = {
  name: 'triage',
  description: 'Record the triage of a support ticket.',
  input_schema: {
    type: 'object',
    required: ['category', 'priority', 'team', 'summary', 'draftReply'],
    properties: {
      category: { type: 'string', enum: ['Billing', 'Bug', 'Account', 'Feature request', 'Question'] },
      priority: { type: 'string', enum: ['P1', 'P2', 'P3', 'P4'], description: 'P1: money or data at risk, or blocked today. P4: a wish.' },
      team: { type: 'string', enum: ['Payments', 'Platform', 'Identity', 'Product', 'Support'] },
      summary: { type: 'string', description: 'One sentence for the queue.' },
      draftReply: { type: 'string', description: 'A short, warm reply to the customer, without a sign-off.' },
    },
  },
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

async function triage(ticket: string) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': secret('ANTHROPIC_API_KEY'),
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 800,
      system: 'You triage customer support tickets for a billing software company. Be decisive.',
      tools: [TOOL],
      tool_choice: { type: 'tool', name: 'triage' },
      messages: [{ role: 'user', content: `Triage this ticket:\n\n${ticket}` }],
    }),
  })
  if (!res.ok) throw new Error(`Claude answered ${res.status}`)
  const body = (await res.json()) as { content: { type: string; input?: Record<string, string> }[] }
  const call = body.content.find(c => c.type === 'tool_use')
  if (!call?.input) throw new Error('Claude gave no triage')
  return call.input
}

export default {
  async fetch(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url)
    const who = viewer(request)

    if (pathname === '/api/health') {
      secret('ANTHROPIC_API_KEY') // throws, naming it, when it isn't set
      return json({ ok: true })
    }
    if (pathname === '/api/me') return json({ email: who?.email ?? null })
    if (pathname === '/api/triage' && request.method === 'POST') {
      if (!who) return json({ error: 'Sign in to triage tickets.' }, 401)
      const { ticket } = (await request.json().catch(() => ({}))) as { ticket?: string }
      if (!ticket?.trim()) return json({ error: 'Paste a ticket first.' }, 400)
      const started = Date.now()
      const t = await triage(ticket.slice(0, MAX_TICKET))
      const name = who.email.split('@')[0].replace(/^./, c => c.toUpperCase())
      // logs carry the viewer id, never the address: everyone who publishes the site reads them
      console.log(`triaged for ${who.id}: ${t.priority} ${t.category} in ${Date.now() - started} ms`)
      return json({ ...t, draftReply: `${t.draftReply}\n\n${name}, Customer Support` })
    }
    return json({ error: 'Not found' }, 404)
  },
}
