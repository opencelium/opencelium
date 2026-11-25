import { FieldRenderer } from '@/engine/entity/runtime/FieldRenderer'
import type { SectionOverrideProps } from '@/engine/entity/overrides/types'
import { AvailableUpdatesHeader } from './AvailableUpdatesHeader'
import { UpdateModeCards } from './UpdateModeCards'
import './availableUpdates.css'

/** `updateMode` is rendered as the mode cards; every other field goes through FieldRenderer. */
export function AvailableUpdatesSection({ fields, mode }: SectionOverrideProps) {
    return (
        <div className="ua-available">
            <AvailableUpdatesHeader />
            <UpdateModeCards />
            {fields
                .filter((field) => field.name !== 'updateMode')
                .map((field) => (
                    <FieldRenderer key={field.name} field={field} mode={mode} />
                ))}
        </div>
    )
}
