import { useRef, useState } from 'react'
import { message } from 'antd'
import { Button } from '@shared/ui/primitives/Button'
import { Input } from '@shared/ui/primitives/Input'
import { Select } from '@shared/ui/primitives/Select'
import { Typography } from '@shared/ui/primitives/Typography'
import { StepHeader } from '@shared/ui/step-form/StepHeader'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useCreateSupportFileMutation } from '../api/scheduleApi'
import {
    buildSupportFilePayload,
    HEADERS_EXAMPLE,
    levelForState,
    maskJson,
    maskText,
    MASKING_LEVELS,
    type MaskingLevel,
    type MaskSection,
    type MaskState,
    presetForLevel,
    REQUEST_EXAMPLE,
    RESPONSE_EXAMPLE,
    URL_EXAMPLE,
} from '../model/supportLogs'
import { SupportLogsSection } from './SupportLogsSection'
import { LogJsonView } from '@shared/ui/json-view/LogJsonView'

type Props = {
    connectionId: number
    connectionTitle: string
    onClose: () => void
}

export function SupportLogsDialogContent({ connectionId, connectionTitle, onClose }: Props) {
    const { t: tEntities } = useI18n('entities')
    const containerRef = useRef<HTMLDivElement>(null)
    const [mask, setMask] = useState<MaskState>(() => presetForLevel('light'))
    const [createSupportFile, { isLoading }] = useCreateSupportFileMutation()

    const level = levelForState(mask)

    const toggle = (section: MaskSection) =>
        setMask((prev) => ({ ...prev, [section]: !prev[section] }))

    const onLevelChange = (value: MaskingLevel) => {
        if (value === 'custom') return
        setMask(presetForLevel(value))
    }

    const handleSubmit = async () => {
        try {
            await createSupportFile({
                connectionId,
                rules: buildSupportFilePayload(mask),
            }).unwrap()
            message.success(tEntities('schedule.supportLogs.started', { connectionTitle }))
            onClose()
        } catch (err) {
            console.error(err)
            message.error(tEntities('schedule.supportLogs.error'))
        }
    }

    const json = (data: object, section: MaskSection) =>
        mask[section] ? maskJson(data) : data

    return (
        <div ref={containerRef}>
            <StepHeader
                containerRef={containerRef}
                header="schedule.supportLogs.title"
                subheader="schedule.supportLogs.titleHint"
            />
            <Typography variant="label">
                {tEntities('schedule.supportLogs.levelLabel')}
            </Typography>
            <Select<MaskingLevel>
                value={level}
                onChange={onLevelChange}
                options={MASKING_LEVELS.map((value) => ({
                    value,
                    label: tEntities(`schedule.supportLogs.levels.${value}`),
                }))}
            />

            <SupportLogsSection
                label={tEntities('schedule.supportLogs.sections.url')}
                isMasked={mask.url}
                onToggle={() => toggle('url')}
            >
                <Input readOnly value={mask.url ? maskText(URL_EXAMPLE) : URL_EXAMPLE} />
            </SupportLogsSection>

            <SupportLogsSection
                label={tEntities('schedule.supportLogs.sections.headers')}
                isMasked={mask.headers}
                onToggle={() => toggle('headers')}
            >
                <LogJsonView data={json(HEADERS_EXAMPLE, 'headers')} minHeight={64} />
            </SupportLogsSection>

            <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <SupportLogsSection
                        label={tEntities('schedule.supportLogs.sections.request')}
                        isMasked={mask.request}
                        onToggle={() => toggle('request')}
                    >
                        <LogJsonView name="root" data={json(REQUEST_EXAMPLE, 'request')} />
                    </SupportLogsSection>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <SupportLogsSection
                        label={tEntities('schedule.supportLogs.sections.response')}
                        isMasked={mask.response}
                        onToggle={() => toggle('response')}
                    >
                        <LogJsonView name="root" data={json(RESPONSE_EXAMPLE, 'response')} />
                    </SupportLogsSection>
                </div>
            </div>

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 8,
                    marginTop: 20,
                }}
            >
                <Button type="primary" loading={isLoading} onClick={handleSubmit}>
                    {tEntities('schedule.supportLogs.submit')}
                </Button>
                <Button onClick={onClose}>
                    {tEntities('schedule.supportLogs.cancel')}
                </Button>
            </div>
        </div>
    )
}
