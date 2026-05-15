import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@shared/lib/storeHooks'
import { selectAccessToken } from '@entities/auth/model/authSelectors'
import { updateAssistantApi } from '@entities/updateAssistant/api/updateAssistantApi'
import { UPDATE_ASSISTANT_TAG } from '@entities/updateAssistant/api/updateAssistant.tags'
import { errorBus } from '@shared/errors/api/errorBus'
import { normalizeError } from '@shared/errors/api/normalizeError'

const UPLOAD_URL = '/assistant/zipfile'

export type OfflineUploadState =
    | { status: 'idle' }
    | { status: 'uploading'; fileName: string; progress: number }
    | { status: 'success' }
    | { status: 'error' }

export function useOfflinePackageUpload() {
    const token = useAppSelector(selectAccessToken)
    const dispatch = useAppDispatch()
    const xhrRef = useRef<XMLHttpRequest | null>(null)
    const [state, setState] = useState<OfflineUploadState>({ status: 'idle' })

    useEffect(() => () => xhrRef.current?.abort(), [])

    const upload = useCallback(
        (file: File) => {
            const xhr = new XMLHttpRequest()
            xhrRef.current = xhr

            const baseUrl = (import.meta.env.VITE_API_URL as string) ?? ''
            xhr.open('POST', `${baseUrl}${UPLOAD_URL}`)
            if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

            let progress = 0
            let hasRealProgress = false
            let timer: number | null = null

            const apply = (next: number) => {
                progress = Math.max(progress, Math.min(99, next))
                setState({ status: 'uploading', fileName: file.name, progress: Math.round(progress) })
            }

            const tick = () => {
                if (hasRealProgress) return
                apply(progress + Math.max(1, (95 - progress) * 0.06))
                if (progress < 95) timer = window.setTimeout(tick, 120)
            }

            const stopTimer = () => {
                if (timer != null) {
                    window.clearTimeout(timer)
                    timer = null
                }
            }

            xhr.upload.onprogress = (e) => {
                if (!e.lengthComputable) return
                hasRealProgress = true
                stopTimer()
                apply((e.loaded / e.total) * 100)
            }

            xhr.onload = () => {
                stopTimer()
                xhrRef.current = null
                if (xhr.status >= 200 && xhr.status < 300) {
                    setState({ status: 'success' })
                    dispatch(
                        updateAssistantApi.util.invalidateTags([
                            { type: UPDATE_ASSISTANT_TAG as any, id: 'OFFLINE_VERSIONS' },
                        ]),
                    )
                } else {
                    setState({ status: 'error' })
                    errorBus.emit(normalizeError({ status: xhr.status }))
                }
            }

            xhr.onerror = () => {
                stopTimer()
                xhrRef.current = null
                setState({ status: 'error' })
                errorBus.emit({ type: 'NETWORK', messageKey: 'unknown' })
            }

            xhr.onabort = () => {
                stopTimer()
                xhrRef.current = null
                setState({ status: 'idle' })
            }

            const formData = new FormData()
            formData.append('file', file)
            setState({ status: 'uploading', fileName: file.name, progress: 0 })
            xhr.send(formData)
            timer = window.setTimeout(tick, 120)
        },
        [token, dispatch],
    )

    const cancel = useCallback(() => {
        xhrRef.current?.abort()
    }, [])

    const reset = useCallback(() => setState({ status: 'idle' }), [])

    return { state, upload, cancel, reset }
}
