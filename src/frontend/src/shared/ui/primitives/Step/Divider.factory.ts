import type {UIFactory} from "@shared/ui/primitives/types.ts";
import AntDividerAnt from "@shared/ui/primitives/Divider/Divider.ant.tsx";
import MaterialDivider from "@shared/ui/primitives/Divider/Divider.material.tsx";
import type {DividerComponent} from "@shared/ui/primitives/Divider/Divider.types.tsx";

export const DividerFactory: UIFactory<DividerComponent> = {
    default: AntDividerAnt,
    material: MaterialDivider,
    ant: AntDividerAnt,
};
