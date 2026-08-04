import { useEffect, useMemo, useRef, useState } from 'react'
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import { Button } from '@shared/ui/primitives/Button'
import { EntityText } from '@shared/ui/primitives/Text'
import { Steps } from '@shared/ui/primitives/Steps'
import { StepHeader } from '@shared/ui/step-form/StepHeader'
import { useBreakpoints } from '@app/hooks/useBreakpoints'
import { FieldRenderer } from '@/engine/entity/runtime/FieldRenderer'
import { PolicyProvider } from '@/engine/policy/PolicyReactContext'
import type { EntityDefinition } from '@/engine/entity/EntityDefinition'
import type { ReactNode } from 'react'

export type RecordStatus = 'wait' | 'process' | 'finish' | 'error'

type RenderActionsCtx = {
    index: number
    record: unknown
    remove: (index: number) => void
}

type Props = {
    definition: EntityDefinition
    /** Section id from the definition. Defaults to the first section. */
    sectionId?: string
    /** Form path that contains the array of records (e.g. 'items'). */
    name: string

    header: string
    subheader?: string
    image?: string | ReactNode

    addLabel: string
    /** Default value used when the user clicks "Add". */
    defaultRecord: unknown

    emptyKey?: string

    getRecordLabel: (record: unknown, index: number) => ReactNode
    getRecordSubtitle?: (record: unknown, index: number) => ReactNode
    getRecordStatus?: (record: unknown, index: number) => RecordStatus

    renderActions?: (ctx: RenderActionsCtx) => ReactNode

    /** When true, renders every record read-only: no "Add" button, no `renderActions`. */
    readOnly?: boolean
}

const POLICY_CONTEXT = { user: { id: 0, roles: [], permissions: [] } }

export function MultiRecordForm({
    definition,
    sectionId,
    name,
    header,
    subheader,
    image,
    addLabel,
    defaultRecord,
    emptyKey,
    getRecordLabel,
    getRecordSubtitle,
    getRecordStatus,
    renderActions,
    readOnly,
}: Props) {
    const { control } = useFormContext()
    const { fields, append, remove } = useFieldArray({ control, name })
    const watched = useWatch({ control, name }) as unknown
    const liveValues = useMemo<unknown[]>(
        () => (Array.isArray(watched) ? watched : []),
        [watched],
    )
    const { isTabletOrMobile } = useBreakpoints()
    const containerRef = useRef<HTMLDivElement | null>(null)

    const section = useMemo(() => {
        if (sectionId) {
            return definition.sections.find((s) => s.id === sectionId)
        }
        return definition.sections[0]
    }, [definition, sectionId])

    const fieldMap = useMemo(
        () => new Map(definition.fields.map((f) => [f.name, f])),
        [definition],
    )

    const [selected, setSelected] = useState(0)
    const previousLengthRef = useRef(fields.length)
    useEffect(() => {
        const previous = previousLengthRef.current
        const current = fields.length
        previousLengthRef.current = current
        if (current > previous) {
            setSelected(current - 1)
        } else if (selected >= current) {
            setSelected(Math.max(0, current - 1))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fields.length])

    const items = useMemo(
        () =>
            fields.map((field, index) => {
                const record = liveValues[index] ?? field
                return {
                    key: field.id,
                    header: getRecordLabel(record, index),
                    subheader: getRecordSubtitle?.(record, index),
                    status: getRecordStatus?.(record, index) ?? 'process',
                    onClick:
                        index === selected ? undefined : () => setSelected(index),
                }
            }),
        [fields, liveValues, selected, getRecordLabel, getRecordSubtitle, getRecordStatus],
    )

    const selectedRecord = liveValues[selected] ?? fields[selected]

    return (
        <PolicyProvider value={POLICY_CONTEXT}>
            <div ref={containerRef} style={{ padding: 18, borderRadius: 12 }}>
                <StepHeader
                    containerRef={containerRef}
                    header={header}
                    subheader={subheader}
                    image={image}
                />

                <div style={{ display: isTabletOrMobile ? 'grid' : 'flex', gap: 24 }}>
                    <div style={{ flex: 1, marginBottom: isTabletOrMobile ? 24 : 0 }}>
                        {fields.length > 0 && (
                            <Steps items={items} status="process" current={selected} />
                        )}
                        {!readOnly && (
                            <div style={{ marginTop: fields.length > 0 ? 16 : 0 }}>
                                <Button
                                    onClick={() => append(defaultRecord)}
                                    iconLeft="plus"
                                >
                                    <EntityText i18nKey={addLabel} />
                                </Button>
                            </div>
                        )}
                    </div>

                    <div style={{ flex: 3, paddingLeft: isTabletOrMobile ? 0 : 48 }}>
                        {fields[selected] && section ? (
                            <div style={{ display: 'grid', gap: 15 }}>
                                {section.fields.map((fieldName) => {
                                    const field = fieldMap.get(fieldName)
                                    if (!field) return null
                                    return (
                                        <FieldRenderer
                                            key={fieldName}
                                            field={{
                                                ...field,
                                                name: `${name}.${selected}.${fieldName}`,
                                            }}
                                            mode={readOnly ? 'view' : 'create'}
                                        />
                                    )
                                })}

                                {renderActions && !readOnly && (
                                    <div
                                        style={{
                                            marginTop: 24,
                                            display: 'flex',
                                            justifyContent: 'flex-end',
                                            gap: 12,
                                        }}
                                    >
                                        {renderActions({
                                            index: selected,
                                            record: selectedRecord,
                                            remove,
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ color: 'var(--color-text-secondary)' }}>
                                {emptyKey ? <EntityText i18nKey={emptyKey} /> : null}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PolicyProvider>
    )
}
