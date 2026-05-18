import { http, HttpResponse } from 'msw'

export const authHandlers = [
    http.post('/login', async ({ request }) => {
        const { password } = await request.json() as { email: string; password: string }

        if (password !== 'password') {
            return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
        }

        // payload: {"userId":1} → base64url: eyJ1c2VySWQiOjF9
        const mockToken = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjF9.mock-signature'

        return new HttpResponse(null, {
            status: 200,
            headers: { Authorization: `Bearer ${mockToken}` },
        })
    }),

    http.post('/auth/logout', () => {
        return new HttpResponse(null, { status: 200 })
    }),
]
