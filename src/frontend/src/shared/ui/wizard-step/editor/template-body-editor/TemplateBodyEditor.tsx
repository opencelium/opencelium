import React, { useEffect, useMemo } from 'react'
import AceEditor from 'react-ace'
import 'ace-builds/src-noconflict/mode-text'
import 'ace-builds/src-noconflict/theme-github'
import { useController, useFormContext } from 'react-hook-form'
import { useFetchEntitiesQuery } from '@shared/api/genericApi'
import type { Aggregator } from '@entities/notificationTemplate/model/types'
import {
    toDisplayFormat,
    replaceInactiveArgs,
    findOcArgNotExistMarkers,
} from '@entities/notificationTemplate/lib/templateArgUtils'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { Mode } from '@/engine/entity/EntityDefinition'
import { FormControl } from '@shared/ui/form/FormControl'

interface TemplateBodyEditorProps {
    name: string
    label?: string
    mode?: Mode
}

const SERVER_ARG_RE = /\{\{\d+\}\}/

export function TemplateBodyEditor({ name, label, mode }: TemplateBodyEditorProps) {
    const { t } = useI18n('entities')
    const { control, watch, formState: { errors } } = useFormContext()
    const { field } = useController({ name, control })
    const { data: aggregators = [] } = useFetchEntitiesQuery('/aggregator/all')

    const error = errors[name]?.message as string | undefined

    // Convert server format {{argId}} → display format {{aggregatorName.argName}} on load
    useEffect(() => {
        const value = field.value as string | undefined
        if (value && SERVER_ARG_RE.test(value)) {
            const converted = toDisplayFormat(value, aggregators as Aggregator[])
            if (converted !== value) field.onChange(converted)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [aggregators])

    // Replace any inactive aggregator's arg refs with {{OC_ARG_NOT_EXIST}} whenever value or aggregators change.
    // replaceInactiveArgs is idempotent ({{OC_ARG_NOT_EXIST}} has no dot, won't re-match), so no infinite loop.
    useEffect(() => {
        if ((aggregators as Aggregator[]).length === 0) return
        const value = (field.value as string) ?? ''
        const replaced = replaceInactiveArgs(value, aggregators as Aggregator[])
        if (replaced !== value) field.onChange(replaced)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [aggregators, field.value])

    // Mark every {{OC_ARG_NOT_EXIST}} with red background
    const markers = useMemo(() =>
        findOcArgNotExistMarkers((field.value as string) ?? '').map((m) => ({
            startRow: m.row,
            startCol: m.startCol,
            endRow: m.row,
            endCol: m.endCol,
            className: 'oc-arg-not-exist-marker',
            type: 'text' as const,
            inFront: true,
        })),
    [field.value])

    const readOnly = mode === 'view'
    const translatedLabel = label ? t(label, { defaultValue: label }) : undefined

    return (
        <>
            <style>{`.oc-arg-not-exist-marker { position: absolute; background: rgba(255,77,79,0.35); }`}</style>
            <FormControl label={translatedLabel} error={error} name={name}>
                <AceEditor
                    mode="text"
                    theme="github"
                    onChange={field.onChange}
                    value={field.value ?? ''}
                    name={`ace_${name}`}
                    width="100%"
                    height="200px"
                    fontSize={12}
                    markers={markers}
                    setOptions={{ useWorker: false, showPrintMargin: false }}
                    readOnly={readOnly}
                />
            </FormControl>
        </>
    )
}
