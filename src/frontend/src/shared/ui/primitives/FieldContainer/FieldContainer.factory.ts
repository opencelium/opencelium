import type {UIFactory} from "@shared/ui/primitives/types.ts";
import AntFieldContainerAnt from "@shared/ui/primitives/FieldContainer/FieldContainer.ant.tsx";
import MaterialFieldContainer from "@shared/ui/primitives/FieldContainer/FieldContainer.material.tsx";
import type {FieldContainerComponent} from "@shared/ui/primitives/FieldContainer/FieldContainer.types.ts";

export const FieldContainerFactory: UIFactory<FieldContainerComponent> = {
    default: AntFieldContainerAnt,
    material: MaterialFieldContainer,
    ant: AntFieldContainerAnt,
};
