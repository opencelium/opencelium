import type {AlertComponent} from "@shared/ui/primitives/Alert/Alert.types.ts";
import type {UIFactory} from "@shared/ui/primitives/types.ts";
import {AntAlert} from "@shared/ui/primitives/Alert/ant/Alert.ant.tsx";
import {MaterialAlert} from "@shared/ui/primitives/Alert/material/Alert.material.tsx";

export const AlertFactory: UIFactory<AlertComponent> = {
    default: AntAlert,
    ant: AntAlert,
    material: MaterialAlert,
};
