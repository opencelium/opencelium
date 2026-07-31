import type {TypographyComponent} from "@shared/ui/primitives/Typography/Typography.types.ts";
import {MaterialTypography} from "@shared/ui/primitives/Typography/Typography.material.tsx";
import {AntTypography} from "@shared/ui/primitives/Typography/Typography.ant.tsx";
import type {UIFactory} from "@shared/ui/primitives/types.ts";

export const TypographyFactory: UIFactory<TypographyComponent> = {
    default: AntTypography,
    material: MaterialTypography,
    ant: AntTypography,
};
