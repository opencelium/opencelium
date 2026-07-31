import type {UIFactory} from "@shared/ui/primitives/types.ts";
import AntSteps from "@shared/ui/primitives/Steps/Steps.ant.tsx";
import MaterialSteps from "@shared/ui/primitives/Steps/Steps.material.tsx";
import type {StepsComponent} from "@shared/ui/primitives/Steps/Divider.types.tsx";

export const StepsFactory: UIFactory<StepsComponent> = {
    default: AntSteps,
    material: MaterialSteps,
    ant: AntSteps,
};
