import type { DialogComponent } from './Dialog.types';
import { MaterialDialog } from './Dialog.material';
import { AntDialog } from './Dialog.ant';
import type {UIFactory} from "@shared/ui/primitives/types.ts";

export const DialogFactory: UIFactory<DialogComponent> = {
    default: AntDialog,
    material: MaterialDialog,
    ant: AntDialog,
};
