import React, { useRef, useState } from 'react'
import { message } from 'antd'
import { Button } from '@shared/ui/primitives/Button'
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useAppDispatch, useAppSelector } from '@shared/lib/storeHooks'
import { selectAccessToken } from '@entities/auth/model/authSelectors'
import { apiExecutor } from '@shared/api/apiExecutor'
import { baseApi } from '@shared/api/baseApi'

const CHECK_URL = (name: string) => `/template/check/${encodeURIComponent(name)}`
const UPLOAD_URL = '/storage/template'
const FETCH_URL = (id: string) => `/template/${encodeURIComponent(id)}`

async function uploadFile(
    file: File,
    token: string | null | undefined,
): Promise<{ id: string; path: string }> {
    const baseUrl = (import.meta.env.VITE_API_URL as string) ?? ''
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`${baseUrl}${UPLOAD_URL}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
        credentials: 'include',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as { id: string; path: string }
}

export const ConnectionTemplateUploadButton: React.FC = () => {
    const inputRef = useRef<HTMLInputElement>(null)
    const [isLoading, setIsLoading] = useState(false)
    const confirm = useConfirm()
    const dispatch = useAppDispatch()
    const token = useAppSelector(selectAccessToken)
    const { t: tEntities } = useI18n('entities')

    const handleFileChosen = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) return

        setIsLoading(true)
        try {
            const exists = (await apiExecutor({
                url: CHECK_URL(file.name),
                method: 'GET',
            })) as boolean

            if (exists === true) {
                const ok = await confirm({
                    title: tEntities('connection-template.list.upload.confirmReplace.title'),
                    message: tEntities('connection-template.list.upload.confirmReplace.message'),
                })
                if (!ok) {
                    setIsLoading(false)
                    return
                }
            }

            const { id } = await uploadFile(file, token)
            await apiExecutor({ url: FETCH_URL(id), method: 'GET' })
            dispatch(baseApi.util.invalidateTags([{ type: 'Entity' as any, id: '/template/all' }]))

            message.success(tEntities('connection-template.list.upload.success', { name: file.name }))
        } catch (err) {
            console.error(err)
            message.error(tEntities('connection-template.list.upload.error'))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept=".json,.zip,application/json,application/zip"
                style={{ display: 'none' }}
                onChange={handleFileChosen}
            />
            <Button
                type="primary"
                loading={isLoading}
                onClick={() => inputRef.current?.click()}
            >
                {tEntities('connection-template.list.upload.button')}
            </Button>
        </>
    )
}
