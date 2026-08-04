import type { TextareaComponent } from './Textarea.types';
import { MaterialTextarea } from './Textarea.material';
import { AntTextarea } from './Textarea.ant';
import type {UIFactory} from "@shared/ui/primitives/types.ts";

export const TextareaFactory: UIFactory<TextareaComponent> = {
    default: AntTextarea,
    material: MaterialTextarea,
    ant: AntTextarea,
};
