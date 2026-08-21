import {useMemo, useRef, useState, type PointerEvent as ReactPointerEvent} from 'react'
import {Button, Modal, Slider} from 'antd'
import type {ConnectorIconCropModalProps} from './ConnectorIconCropModal.types'
import './ConnectorIconCropModal.css'

const CROP_SIZE = 320
const OUTPUT_SIZE = 512

type Size = {width: number; height: number}
type Position = {x: number; y: number}

const getLayout = (image: Size, zoom: number) => {
    const displayScale = Math.min(CROP_SIZE / image.width, CROP_SIZE / image.height)
    const width = image.width * displayScale
    const height = image.height * displayScale
    const left = (CROP_SIZE - width) / 2
    const top = (CROP_SIZE - height) / 2
    const cropSize = Math.min(width, height) / zoom
    return {displayScale, width, height, left, top, cropSize}
}

const constrainPosition = (position: Position, image: Size, zoom: number): Position => {
    const layout = getLayout(image, zoom)
    return {
        x: Math.max(layout.left, Math.min(layout.left + layout.width - layout.cropSize, position.x)),
        y: Math.max(layout.top, Math.min(layout.top + layout.height - layout.cropSize, position.y)),
    }
}

export const ConnectorIconCropModal = ({
    file, onCancel, onConfirm, title, zoomLabel, cancelLabel, confirmLabel, instruction,
}: ConnectorIconCropModalProps) => {
    const imageRef = useRef<HTMLImageElement>(null)
    const dragRef = useRef<{pointerX: number; pointerY: number; position: Position} | null>(null)
    const [imageSize, setImageSize] = useState<Size | null>(null)
    const [zoom, setZoom] = useState(1)
    const [cropPosition, setCropPosition] = useState<Position>({x: 0, y: 0})
    const [saving, setSaving] = useState(false)
    const objectUrl = useMemo(() => file ? URL.createObjectURL(file) : null, [file])
    const layout = imageSize ? getLayout(imageSize, zoom) : null

    const handleZoom = (value: number) => {
        if (imageSize) {
            const oldLayout = getLayout(imageSize, zoom)
            const newLayout = getLayout(imageSize, value)
            const center = {
                x: cropPosition.x + oldLayout.cropSize / 2,
                y: cropPosition.y + oldLayout.cropSize / 2,
            }
            setCropPosition(constrainPosition({
                x: center.x - newLayout.cropSize / 2,
                y: center.y - newLayout.cropSize / 2,
            }, imageSize, value))
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
        }, imageSize, zoom))
    }

    const handleConfirm = async () => {
        const image = imageRef.current
        if (!file || !image || !imageSize) return
        setSaving(true)
        try {
            const canvas = document.createElement('canvas')
            canvas.width = OUTPUT_SIZE
            canvas.height = OUTPUT_SIZE
            const context = canvas.getContext('2d')
            if (!context) return

            const currentLayout = getLayout(imageSize, zoom)
            const sourceSize = currentLayout.cropSize / currentLayout.displayScale
            const sourceX = (cropPosition.x - currentLayout.left) / currentLayout.displayScale
            const sourceY = (cropPosition.y - currentLayout.top) / currentLayout.displayScale
            context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

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
            <div className="connectorIconCropViewport">
                {objectUrl && (
                    <img ref={imageRef} src={objectUrl} alt="" draggable={false}
                        onLoad={event => {
                            const size = {
                                width: event.currentTarget.naturalWidth,
                                height: event.currentTarget.naturalHeight,
                            }
                            const initialLayout = getLayout(size, 1)
                            setImageSize(size)
                            setCropPosition({
                                x: initialLayout.left + (initialLayout.width - initialLayout.cropSize) / 2,
                                y: initialLayout.top + (initialLayout.height - initialLayout.cropSize) / 2,
                            })
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
                            width: layout.cropSize, height: layout.cropSize,
                        }}
                        className="connectorIconCropSelection"
                    >
                        <span className="connectorIconCropGrid connectorIconCropGridVertical connectorIconCropGridFirst" />
                        <span className="connectorIconCropGrid connectorIconCropGridVertical connectorIconCropGridSecond" />
                        <span className="connectorIconCropGrid connectorIconCropGridHorizontal connectorIconCropGridFirst" />
                        <span className="connectorIconCropGrid connectorIconCropGridHorizontal connectorIconCropGridSecond" />
                    </div>
                )}
            </div>
            <div className="connectorIconCropInstruction">{instruction}</div>
            <label className="connectorIconCropZoom">
                <span>{zoomLabel}</span>
                <Slider min={1} max={3} step={0.01} value={zoom} onChange={handleZoom} />
            </label>
        </Modal>
    )
}
