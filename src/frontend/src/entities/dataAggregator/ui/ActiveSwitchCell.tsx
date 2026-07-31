import { useState } from 'react'
import { Switch } from '@shared/ui/primitives/Switch'
import { apiExecutor } from '@shared/api/apiExecutor'

type Props = {
    id: number
    archived: boolean
}

// The column represents "archived": the switch is ON when the aggregator is
// archived (active === false). Toggling it flips the underlying `active` flag.
export function ActiveSwitchCell({ id, archived }: Props) {
    const [loading, setLoading] = useState(false)

    const handleChange = async (nextArchived: boolean) => {
        setLoading(true)
        try {
            await apiExecutor({
                url: `/aggregator/${id}/status`,
                method: 'PUT',
                body: { active: !nextArchived },
            })
        } finally {
            setLoading(false)
        }
    }

    return <Switch checked={archived} loading={loading} onChange={handleChange} />
}
