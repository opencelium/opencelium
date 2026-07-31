import type { DropzoneComponent } from './DropZone.types'
import { AntDropzone } from './ant/DropZone.ant'
import { MaterialDropzone } from './material/DropZone.material'
import type { UIFactory } from '@shared/ui/primitives/types'

export const DropzoneFactory: UIFactory<DropzoneComponent> = {
    default: AntDropzone,
    ant: AntDropzone,
    material: MaterialDropzone,
}
