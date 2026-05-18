import { useState } from 'react'
import { Switch } from '@shared/ui/primitives/Switch'
import { apiExecutor } from '@shared/api/apiExecutor'

type Props = {
    id: number
    active: boolean
}

export function ActiveSwitchCell({ id, active }: Props) {
    const [loading, setLoading] = useState(false)

    const handleChange = async (next: boolean) => {
        setLoading(true)
        try {
            await apiExecutor({
                url: `/aggregator/${id}/status`,
                method: 'PUT',
                body: { active: next },
            })
        } finally {
            setLoading(false)
        }
    }

    return <Switch checked={active} loading={loading} onChange={handleChange} />
}
