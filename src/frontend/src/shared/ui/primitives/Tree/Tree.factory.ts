import type {TreeComponent} from "@shared/ui/primitives/Tree/Tree.types.ts";
import type {UIFactory} from "@shared/ui/primitives/types.ts";
import {AntTree} from "@shared/ui/primitives/Tree/ant/Tree.ant.tsx";
import {MaterialTree} from "@shared/ui/primitives/Tree/material/Tree.material.tsx";

export const TreeFactory: UIFactory<TreeComponent> = {
    default: AntTree,
    ant: AntTree,
    material: MaterialTree,
};
