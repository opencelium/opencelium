import {Icon} from '@shared/ui/primitives/Icon'
import type {IconName} from '@shared/ui/primitives/Icon/Icon.types'
import {Tooltip} from '@shared/ui/primitives/Tooltip'
import {Loading} from '@shared/ui/primitives/Loading/Loading'
import {ImageCropDialog} from '@shared/ui/image-crop/ImageCropDialog'
import {IMAGE_UPLOAD_ACCEPT} from '@shared/utils/imageUploadRules'
import {useImagePicker} from './useImagePicker'
import * as s from './WizardImageEditor.styles'

/** An extra hover action on a filled tile, rendered between replace and delete. */
export type ImageTileAction = {
    key: string
    iconName: IconName
    /** Already translated; shown as the tooltip. */
    label: string
    testId: string
    onClick: () => void
}

type Props = {
    src: string | null
    fileName?: string
    isInteractive: boolean
    isLoading?: boolean
    /**
     * Entities-namespace prefix for the copy. Expects `uploadButton`, `hint`, `replace`,
     * `invalidType`, `tooLarge` and `crop.{title,zoom,cancel,apply,instruction}` under it,
     * plus `delete` when `onDelete` is given.
     */
    i18nPrefix: string
    testIdPrefix: string
    onPicked: (file: File) => void
    /** Omit to hide the delete action (e.g. when the backend has no delete endpoint). */
    onDelete?: () => void
    extraActions?: ImageTileAction[]
}

/** A 114px image tile: pick (with crop) when empty; replace or delete on hover when filled. */
export const ImageTileEditor = ({
    src, fileName, isInteractive, isLoading, i18nPrefix, testIdPrefix, onPicked, onDelete,
    extraActions = [],
}: Props) => {
    const {t, inputRef, cropFile, openPicker, cancelCrop, handlePick, handleCropConfirm} =
        useImagePicker({i18nPrefix, onPicked})
    const canEdit = isInteractive && !isLoading

    return (
        <>
            {src ? (
                <div className="oc-wizard-image-tile" style={{...s.tileStyle, ...s.filledTileStyle}}>
                    <img className="oc-wizard-image-image" src={src} alt={fileName ?? ''} style={s.imgStyle} />

                    {canEdit && (
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
                            {extraActions.map(action => (
                                <Tooltip key={action.key} content={action.label}>
                                    <button
                                        type="button"
                                        className="oc-wizard-image-action"
                                        style={s.actionChipStyle}
                                        onClick={action.onClick}
                                        data-testid={action.testId}
                                    >
                                        <Icon name={action.iconName} size={18} color="inherit" />
                                    </button>
                                </Tooltip>
                            ))}
                            {onDelete && (
                                <Tooltip content={t(`${i18nPrefix}.delete`)}>
                                    <button
                                        type="button"
                                        className="oc-wizard-image-action"
                                        style={s.actionChipDangerStyle}
                                        onClick={onDelete}
                                        data-testid={`${testIdPrefix}-delete`}
                                    >
                                        <Icon name="delete" size={18} color="inherit" />
                                    </button>
                                </Tooltip>
                            )}
                        </div>
                    )}
                    {isLoading && <div style={s.loadingStyle}><Loading size="sm" inline /></div>}
                </div>
            ) : (
                <button
                    type="button"
                    className="oc-wizard-image-tile oc-wizard-image-tile--empty"
                    style={{...s.tileStyle, ...s.emptyTileStyle, cursor: canEdit ? 'pointer' : 'default'}}
                    onClick={canEdit ? openPicker : undefined}
                    disabled={!canEdit}
                    data-testid={`${testIdPrefix}-upload`}
                >
                    {isLoading ? <Loading size="sm" inline /> : (
                        <div style={s.emptyContentStyle}>
                            <Icon name="upload" size={20} color="primary" />
                            <span style={s.emptyLabelStyle}>{t(`${i18nPrefix}.uploadButton`)}</span>
                            <span style={s.emptyHintStyle}>{t(`${i18nPrefix}.hint`)}</span>
                        </div>
                    )}
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
        </>
    )
}
