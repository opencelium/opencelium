import { useState } from 'react'
import { Button } from '@shared/ui/primitives/Button'

type Props = {
    confirmText: string
    cancelText: string
    onCancel: () => void
    onConfirm: () => Promise<void> | void
}

export function NotificationDeleteConfirmFooter({
    confirmText,
    cancelText,
    onCancel,
    onConfirm,
}: Props) {
    const [loading, setLoading] = useState(false)

    const handleConfirm = async () => {
        setLoading(true)
        try {
            await onConfirm()
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Button onClick={onCancel} disabled={loading}>
                {cancelText}
            </Button>
            <Button
                color="danger"
                variant="solid"
                onClick={handleConfirm}
                loading={loading}
            >
                {confirmText}
            </Button>
        </>
    )
}
