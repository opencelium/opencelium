import type {Mode} from '@/engine/entity/EntityDefinition'
import {Icon} from '@shared/ui/primitives/Icon'
import {Tooltip} from '@shared/ui/primitives/Tooltip'
import {ImageCropDialog} from '@shared/ui/image-crop/ImageCropDialog'
import {IMAGE_UPLOAD_ACCEPT} from '@shared/utils/imageUploadRules'
import {useWizardImageEditor} from './useWizardImageEditor'
import * as s from './WizardImageEditor.styles'

type Props = {
    mode?: Mode
    /** Form field holding the image: File = upload/replace, null = delete, string = unchanged. */
    fieldName?: string
    /**
     * Entities-namespace prefix for the copy. Expects `uploadButton`, `hint`, `replace`,
     * `delete`, `invalidType`, `tooLarge`, `confirmDelete.{title,message}` and
     * `crop.{title,zoom,cancel,apply,instruction}` under it.
     */
    i18nPrefix: string
    resolveUrl: (path: string) => string | null
    testIdPrefix: string
}

/**
 * The wizard's top-right image as an editor: pick (with crop), replace, or delete an
 * entity's image. Plugged in through `wizard.renderImage`.
 */
export const WizardImageEditor = ({mode, fieldName = 'icon', i18nPrefix, resolveUrl, testIdPrefix}: Props) => {
    const {
        t, inputRef, cropFile, src, fileName, openPicker, cancelCrop,
        handlePick, handleCropConfirm, handleDelete,
    } = useWizardImageEditor({fieldName, i18nPrefix, resolveUrl})
    const isInteractive = mode !== 'view'

    return (
        <div style={s.wrapperStyle}>
            {src ? (
                <div className="oc-wizard-image-tile" style={{...s.tileStyle, ...s.filledTileStyle}}>
                    <img className="oc-wizard-image-image" src={src} alt={fileName} style={s.imgStyle} />

                    {fileName && <span style={s.filenameStyle}>{fileName}</span>}

                    {isInteractive && (
                        <div className="oc-wizard-image-overlay" style={s.overlayStyle}>
                            <Tooltip content={t(`${i18nPrefix}.replace`)}>
                                <button
                                    type="button"
                                    className="oc-wizard-image-action"
                                    style={s.actionChipStyle}
                                    onClick={openPicker}
                                    data-testid={`${testIdPrefix}-upload`}
                                >
                                    <Icon name="upload" size={18} color="inherit" />
                                </button>
                            </Tooltip>
                            <Tooltip content={t(`${i18nPrefix}.delete`)}>
                                <button
                                    type="button"
                                    className="oc-wizard-image-action"
                                    style={s.actionChipDangerStyle}
                                    onClick={handleDelete}
                                    data-testid={`${testIdPrefix}-delete`}
                                >
                                    <Icon name="delete" size={18} color="inherit" />
                                </button>
                            </Tooltip>
                        </div>
                    )}
                </div>
            ) : (
                <button
                    type="button"
                    className="oc-wizard-image-tile oc-wizard-image-tile--empty"
                    style={{...s.tileStyle, ...s.emptyTileStyle, cursor: isInteractive ? 'pointer' : 'default'}}
                    onClick={isInteractive ? openPicker : undefined}
                    disabled={!isInteractive}
                    data-testid={`${testIdPrefix}-upload`}
                >
                    <div style={s.emptyContentStyle}>
                        <Icon name="upload" size={20} color="primary" />
                        <span style={s.emptyLabelStyle}>{t(`${i18nPrefix}.uploadButton`)}</span>
                        <span style={s.emptyHintStyle}>{t(`${i18nPrefix}.hint`)}</span>
                    </div>
                </button>
            )}

            {isInteractive && (
                <input
                    ref={inputRef}
                    type="file"
                    accept={IMAGE_UPLOAD_ACCEPT}
                    style={{display: 'none'}}
                    onChange={handlePick}
                    data-testid={`${testIdPrefix}-input`}
                />
            )}

            {/* Square: the image is drawn on a disc everywhere it appears. */}
            <ImageCropDialog
                key={cropFile ? `${cropFile.name}-${cropFile.lastModified}` : 'closed'}
                file={cropFile}
                onCancel={cancelCrop}
                onConfirm={handleCropConfirm}
                title={t(`${i18nPrefix}.crop.title`)}
                zoomLabel={t(`${i18nPrefix}.crop.zoom`)}
                cancelLabel={t(`${i18nPrefix}.crop.cancel`)}
                confirmLabel={t(`${i18nPrefix}.crop.apply`)}
                instruction={t(`${i18nPrefix}.crop.instruction`)}
            />

            <style>{s.hoverCss}</style>
        </div>
    )
}
