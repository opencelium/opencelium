import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { apiExecutor } from '@shared/api/apiExecutor'
import { notifyError } from '@shared/ui/feedback/notifyError'
import { cleanConnectionForDuplicate } from '@entities/connection/model/cleanConnectionForDuplicate'
import type { Connection } from '@entities/connection/model/types'
import type { DuplicatedWorkflowLocationState } from '@features/workflow/hooks/useDuplicatedWorkflowHint'

const MAX_TITLE_ATTEMPTS = 100

type TitleCheck = 'EXISTS' | 'FREE' | 'FAILED'

const checkTitle = async (title: string): Promise<TitleCheck> => {
    const check: unknown = await apiExecutor({
        url: `/connection/check?name=${encodeURIComponent(title)}`,
        method: 'GET',
    })
    if (!check || typeof check !== 'object' || !('message' in check)) return 'FAILED'
    return check.message === 'EXISTS' ? 'EXISTS' : 'FREE'
}

export const useDuplicateConnection = (row: Connection) => {
    const { t: tEntities } = useI18n('entities')
    const navigate = useNavigate()
    const [isDuplicating, setIsDuplicating] = useState(false)

    const buildTitle = (attempt: number) =>
        attempt === 0
            ? tEntities('connection.list.duplicate.defaultTitle', { title: row.title })
            : tEntities('connection.list.duplicate.numberedTitle', { title: row.title, number: attempt })

    const findFreeTitle = async (): Promise<string | null> => {
        for (let attempt = 0; attempt < MAX_TITLE_ATTEMPTS; attempt++) {
            const title = buildTitle(attempt)
            const result = await checkTitle(title)
            if (result === 'FAILED') return null
            if (result === 'FREE') return title
        }
        notifyError(tEntities('connection.list.duplicate.error'))
        return null
    }

    const duplicate = async () => {
        if (row.id == null || isDuplicating) return
        setIsDuplicating(true)
        try {
            const title = await findFreeTitle()
            if (title == null) return

            // apiExecutor returns the RTK Query error object (already surfaced via
            // errorBus) instead of throwing, so reject anything missing the
            // connection shape before we clean and re-post it.
            const source = await apiExecutor({ url: `/connection/${row.id}`, method: 'GET' })
            if (!source || typeof source !== 'object' || !('fromConnector' in source)) return

            const body = cleanConnectionForDuplicate(source, { title, description: row.description ?? '' })

            const created: unknown = await apiExecutor({ url: '/connection', method: 'POST', body })
            if (!created || typeof created !== 'object' || !('connectionId' in created)) return

            const state: DuplicatedWorkflowLocationState = { duplicatedTitle: title }
            navigate(`/workflow/update/${encodeURIComponent(String(created.connectionId))}`, { state })
        } catch (err) {
            console.error(err)
            notifyError(tEntities('connection.list.duplicate.error'))
        } finally {
            setIsDuplicating(false)
        }
    }

    return { duplicate, isDuplicating }
}
