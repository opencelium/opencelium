// Dimmed, indented connection label that signals the exec row belongs to the
// schedule above it.
export function ScheduleExecConnectionCell({title}: {title?: string}) {
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                paddingLeft: 20,
                color: 'var(--color-text-secondary)',
                fontSize: 13,
            }}
        >
            <span aria-hidden style={{opacity: 0.7}}>↳</span>
            {title ?? ''}
        </span>
    )
}
