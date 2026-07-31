import type { DropzoneProps } from './DropZone.types'
import { useDynamicUI } from '@app/providers/ui/DynamicFacade'

export function Dropzone(props: DropzoneProps) {
    const { Dropzone } = useDynamicUI()
    return <Dropzone {...props} />
}
