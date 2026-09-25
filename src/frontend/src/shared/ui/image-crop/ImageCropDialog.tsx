import {useMemo, useRef, useState, type PointerEvent as ReactPointerEvent} from 'react'
import {Button, Modal, Slider} from 'antd'
import type {ImageCropDialogProps} from './ImageCropDialog.types'
import {
    constrainPosition,
    getCropRect,
    getInitialPosition,
    getLayout,
    resolveRatio,
    type Position,
    type Size,
} from './imageCropGeometry'
import './ImageCropDialog.css'

/**
 * Drag-and-zoom crop over a picked image file, resolving to a new `File` of the selected
 * area. Shared by the connector icon (square) and the application logo (`aspect: 'image'`).
 * Copy is passed in already translated so the dialog stays i18n-free; the geometry lives
 * in `imageCropGeometry` so the part worth testing is testable.
 */
export const ImageCropDialog = ({
    file, aspect = 1, onCancel, onConfirm, title, zoomLabel, cancelLabel, confirmLabel, instruction,
}: ImageCropDialogProps) => {
    const imageRef = useRef<HTMLImageElement>(null)
    const dragRef = useRef<{pointerX: number; pointerY: number; position: Position} | null>(null)
    const [imageSize, setImageSize] = useState<Size | null>(null)
    const [zoom, setZoom] = useState(1)
    const [cropPosition, setCropPosition] = useState<Position>({x: 0, y: 0})
    const [saving, setSaving] = useState(false)
    const objectUrl = useMemo(() => file ? URL.createObjectURL(file) : null, [file])
    const ratio = imageSize ? resolveRatio(imageSize, aspect) : 1
    const layout = imageSize ? getLayout(imageSize, zoom, ratio) : null

    const handleZoom = (value: number) => {
        if (imageSize) {
            const oldLayout = getLayout(imageSize, zoom, ratio)
            const newLayout = getLayout(imageSize, value, ratio)
            const center = {
                x: cropPosition.x + oldLayout.cropWidth / 2,
                y: cropPosition.y + oldLayout.cropHeight / 2,
            }
            setCropPosition(constrainPosition({
                x: center.x - newLayout.cropWidth / 2,
                y: center.y - newLayout.cropHeight / 2,
            }, imageSize, value, ratio))
        }
        setZoom(value)
    }

    const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        dragRef.current = {pointerX: event.clientX, pointerY: event.clientY, position: cropPosition}
    }

    const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!dragRef.current || !imageSize) return
        setCropPosition(constrainPosition({
            x: dragRef.current.position.x + event.clientX - dragRef.current.pointerX,
            y: dragRef.current.position.y + event.clientY - dragRef.current.pointerY,
        }, imageSize, zoom, ratio))
    }

    const handleConfirm = async () => {
        const image = imageRef.current
        if (!file || !image || !imageSize) return
        setSaving(true)
        try {
            const rect = getCropRect(imageSize, zoom, ratio, cropPosition)
            const canvas = document.createElement('canvas')
            canvas.width = rect.outputWidth
            canvas.height = rect.outputHeight
            const context = canvas.getContext('2d')
            if (!context) return

            context.drawImage(
                image, rect.sourceX, rect.sourceY, rect.sourceWidth, rect.sourceHeight,
                0, 0, canvas.width, canvas.height,
            )

            const type = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png'
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, 0.92))
            if (!blob) return
            onConfirm(new File([blob], file.name, {type, lastModified: Date.now()}))
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal open={Boolean(file)} title={title} onCancel={onCancel} width={400} destroyOnHidden
            footer={[
                <Button key="cancel" onClick={onCancel}>{cancelLabel}</Button>,
                <Button key="confirm" type="primary" loading={saving} disabled={!imageSize} onClick={handleConfirm}>
                    {confirmLabel}
                </Button>,
            ]}>
            <div className="imageCropViewport">
                {objectUrl && (
                    <img ref={imageRef} src={objectUrl} alt="" draggable={false}
                        onLoad={event => {
                            const size = {
                                width: event.currentTarget.naturalWidth,
                                height: event.currentTarget.naturalHeight,
                            }
                            setImageSize(size)
                            setCropPosition(getInitialPosition(size, resolveRatio(size, aspect)))
                            URL.revokeObjectURL(event.currentTarget.src)
                        }}
                        style={{
                            position: 'absolute', left: layout?.left ?? 0, top: layout?.top ?? 0,
                            width: layout?.width ?? 'auto', height: layout?.height ?? 'auto',
                        }} />
                )}
                {layout && (
                    <div
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={() => { dragRef.current = null }}
                        onPointerCancel={() => { dragRef.current = null }}
                        style={{
                            position: 'absolute', left: cropPosition.x, top: cropPosition.y,
                            width: layout.cropWidth, height: layout.cropHeight,
                        }}
                        className="imageCropSelection"
                    >
                        <span className="imageCropGrid imageCropGridVertical imageCropGridFirst" />
                        <span className="imageCropGrid imageCropGridVertical imageCropGridSecond" />
                        <span className="imageCropGrid imageCropGridHorizontal imageCropGridFirst" />
                        <span className="imageCropGrid imageCropGridHorizontal imageCropGridSecond" />
                    </div>
                )}
            </div>
            <div className="imageCropInstruction">{instruction}</div>
            <label className="imageCropZoom">
                <span>{zoomLabel}</span>
                <Slider min={1} max={3} step={0.01} value={zoom} onChange={handleZoom} />
            </label>
        </Modal>
    )
}
