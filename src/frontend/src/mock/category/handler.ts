import { http, HttpResponse } from 'msw'
import type { Category, CategoryDto } from '@entities/category/model/types'

type FlatCategory = { id: number; name: string; parentId: number | null }

let flat: FlatCategory[] = [
    { id: 1, name: 'Development', parentId: null },
    { id: 2, name: 'Operations', parentId: null },
    { id: 3, name: 'Frontend', parentId: 1 },
    { id: 4, name: 'Backend', parentId: 1 },
]

let nextId = 5

function toCategory(f: FlatCategory, all: FlatCategory[]): Category {
    const parentFlat = all.find((c) => c.id === f.parentId) ?? null
    return {
        id: f.id,
        name: f.name,
        subCategories: all.filter((c) => c.parentId === f.id).map((c) => c.id),
        parentCategory: parentFlat
            ? {
                id: parentFlat.id,
                name: parentFlat.name,
                subCategories: all.filter((c) => c.parentId === parentFlat.id).map((c) => c.id),
              }
            : undefined,
    }
}

export const categoryHandlers = [
    http.get('/category/all', () => {
        return HttpResponse.json(flat.map((f) => toCategory(f, flat)))
    }),

    http.get('/category/:nameOrId', ({ params }) => {
        const raw = params.nameOrId as string
        const asNumber = Number(raw)
        const found = isNaN(asNumber)
            ? flat.find((c) => c.name === raw)
            : flat.find((c) => c.id === asNumber)
        if (!found) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
        return HttpResponse.json(toCategory(found, flat))
    }),

    http.post('/category', async ({ request }) => {
        const body = await request.json() as CategoryDto
        const created: FlatCategory = { id: nextId++, name: body.name, parentId: body.parentCategory ?? null }
        flat.push(created)
        return HttpResponse.json(toCategory(created, flat), { status: 201 })
    }),

    http.put('/category/:id', async ({ params, request }) => {
        const id = Number(params.id)
        const body = await request.json() as Partial<CategoryDto>
        flat = flat.map((c) =>
            c.id === id
                ? { ...c, name: body.name ?? c.name, parentId: body.parentCategory ?? c.parentId }
                : c
        )
        const updated = flat.find((c) => c.id === id)
        if (!updated) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
        return HttpResponse.json(toCategory(updated, flat))
    }),

    http.put('/category/list/delete', async ({ request }) => {
        const body = (await request.json()) as { identifiers: (number | string)[] }
        const ids = (body.identifiers ?? []).map((v) => Number(v))
        flat = flat.filter((c) => !ids.includes(c.id))
        return new HttpResponse(null, { status: 204 })
    }),

    http.delete('/category/:id', ({ params }) => {
        const id = Number(params.id)
        flat = flat.filter((c) => c.id !== id)
        return new HttpResponse(null, { status: 204 })
    }),
]
