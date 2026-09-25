import { useRef, useState, type ChangeEvent } from 'react'
import { LOGO_ACCEPT, useSystemLogoAdmin } from '@entities/ui/ui/useSystemLogoAdmin'
import { AppLogo } from '@features/branding/AppLogo'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useTheme } from '@shared/theme/hooks/useTheme'
import { Button } from '@shared/ui/primitives/Button'
import { Typography } from '@shared/ui/primitives/Typography'
import { FormControl } from '@shared/ui/form/FormControl'
import { ImageCropDialog } from '@shared/ui/image-crop/ImageCropDialog'

// Sized like the login screen's own logo slot, so the preview shows what users will see.
const previewStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 260,
    height: 84,
    padding: 12,
    borderRadius: 12,
    background: 'var(--color-background-surface)',
    border: '1px solid var(--color-border-default)',
} as const

/**
 * Admin-only: replaces the OpenCelium logo with the org's own for every user
 * (`app_logo`). Sits under the theme editor because it is the other half of the same
 * branding decision.
 */
export const SystemLogoSection = () => {
    const { t: tEntities } = useI18n('entities')
    const { theme } = useTheme()
    const inputRef = useRef<HTMLInputElement>(null)
    const [cropFile, setCropFile] = useState<File | null>(null)
    const { isAdmin, isConfigured, isBusy, isUploading, isRemoving, upload, remove } =
        useSystemLogoAdmin()

    if (!isAdmin) return null

    const handlePick = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) setCropFile(file)
        // Reset so picking the same file again still fires onChange.
        event.target.value = ''
    }

    const handleCropConfirm = (file: File) => {
        setCropFile(null)
        void upload(file)
    }

    return (
        <FormControl label="ui.systemLogo.title">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                <Typography variant="body" isSubtle>
                    {tEntities('ui.systemLogo.description')}
                </Typography>

                <div style={previewStyle}>
                    <AppLogo
                        height={52}
                        surfaceColor={theme.color.background.surface}
                        testId="ui-system-logo-preview"
                    />
                </div>

                <Typography variant="caption" isSubtle>
                    {tEntities(isConfigured ? 'ui.systemLogo.hint' : 'ui.systemLogo.usingDefault')}
                </Typography>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button
                        type="primary"
                        loading={isUploading}
                        disabled={isBusy}
                        onClick={() => inputRef.current?.click()}
                        testId="ui-system-logo-upload"
                    >
                        {tEntities(isConfigured ? 'ui.systemLogo.replace' : 'ui.systemLogo.upload')}
                    </Button>
                    {isConfigured && (
                        <Button
                            loading={isRemoving}
                            disabled={isBusy}
                            onClick={remove}
                            testId="ui-system-logo-remove"
                        >
                            {tEntities('ui.systemLogo.remove')}
                        </Button>
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    accept={LOGO_ACCEPT}
                    style={{ display: 'none' }}
                    onChange={handlePick}
                    data-testid="ui-system-logo-input"
                />

                {/* The logo has no target shape, so the selection keeps the source's own
                    ratio: the crop trims padding instead of forcing the picture into a box.
                    It also downscales, which is what usually keeps an upload under 5 MB. */}
                <ImageCropDialog
                    key={cropFile ? `${cropFile.name}-${cropFile.lastModified}` : 'closed'}
                    file={cropFile}
                    aspect="image"
                    onCancel={() => setCropFile(null)}
                    onConfirm={handleCropConfirm}
                    title={tEntities('ui.systemLogo.crop.title')}
                    zoomLabel={tEntities('ui.systemLogo.crop.zoom')}
                    cancelLabel={tEntities('ui.systemLogo.crop.cancel')}
                    confirmLabel={tEntities('ui.systemLogo.crop.apply')}
                    instruction={tEntities('ui.systemLogo.crop.instruction')}
                />
            </div>
        </FormControl>
    )
}
