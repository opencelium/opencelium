import type {RadioComponent} from "@shared/ui/primitives/Radio/Radio.types.ts";
import type {UIFactory} from "@shared/ui/primitives/types.ts";
import {AntRadio} from "@shared/ui/primitives/Radio/ant/Radio.ant.tsx";
import {MaterialRadio} from "@shared/ui/primitives/Radio/material/Radio.material.tsx";

export const RadioFactory: UIFactory<RadioComponent> = {
    default: AntRadio,
    ant: AntRadio,
    material: MaterialRadio,
};
