import { http, HttpResponse } from 'msw'

// payload: {"userId":1} → base64url: eyJ1c2VySWQiOjF9
const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjF9.mock-signature'

// Placeholder "QR" so the dialog renders a real image in dev. The production
// server returns a data:image/png;base64 value; the frontend is format-agnostic.
const MOCK_QR =
    'data:image/svg+xml,' +
    encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='168' height='168'>` +
            `<rect width='168' height='168' fill='#fff'/>` +
            `<rect x='12' y='12' width='40' height='40' fill='#000'/>` +
            `<rect x='22' y='22' width='20' height='20' fill='#fff'/>` +
            `<rect x='116' y='12' width='40' height='40' fill='#000'/>` +
            `<rect x='126' y='22' width='20' height='20' fill='#fff'/>` +
            `<rect x='12' y='116' width='40' height='40' fill='#000'/>` +
            `<rect x='22' y='126' width='20' height='20' fill='#fff'/>` +
            `<rect x='72' y='72' width='12' height='12' fill='#000'/>` +
            `<rect x='96' y='72' width='12' height='12' fill='#000'/>` +
            `<rect x='72' y='96' width='12' height='12' fill='#000'/>` +
            `<rect x='120' y='96' width='12' height='12' fill='#000'/>` +
            `<rect x='96' y='120' width='12' height='12' fill='#000'/>` +
            `</svg>`,
    )

// Accounts whose email starts with "2fa" require a TOTP code (dev convention).
//  - "2fa-setup@…" → first-time enrolment: response carries the QR + secret.
//  - "2fa@…"       → already enrolled: response carries only { sessionId }.
// The issued sessionId must come back to /totp-validate; the dev code is "123456".
const totpSessions = new Set<string>()

export const authHandlers = [
    http.post('/login', async ({ request }) => {
        const { email, password } = (await request.json()) as { email: string; password: string }

        if (password !== 'password') {
            return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
        }

        const lower = email?.toLowerCase() ?? ''
        if (lower.startsWith('2fa')) {
            const sessionId = crypto.randomUUID()
            totpSessions.add(sessionId)
            if (lower.startsWith('2fa-setup')) {
                return HttpResponse.json(
                    { sessionId, secretKey: '2KAFAEEIYVGHAANU', qr: MOCK_QR },
                    { status: 200 },
                )
            }
            return HttpResponse.json({ sessionId }, { status: 200 })
        }

        return new HttpResponse(null, {
            status: 200,
            headers: { Authorization: `Bearer ${MOCK_TOKEN}` },
        })
    }),

    http.post('/totp-validate', async ({ request }) => {
        const { code, sessionId } = (await request.json()) as { code: string; sessionId: string }

        if (!totpSessions.has(sessionId) || code !== '123456') {
            return HttpResponse.json({ message: 'Invalid or expired code' }, { status: 401 })
        }

        totpSessions.delete(sessionId)
        return new HttpResponse(null, {
            status: 200,
            headers: { Authorization: `Bearer ${MOCK_TOKEN}` },
        })
    }),

    http.post('/auth/logout', () => {
        return new HttpResponse(null, { status: 200 })
    }),
]
