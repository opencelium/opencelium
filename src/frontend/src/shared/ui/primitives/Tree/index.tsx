import type {TreeProps} from "@shared/ui/primitives/Tree/Tree.types.ts";
import {useDynamicUI} from "@app/providers/ui/DynamicFacade.tsx";

export function Tree(props: TreeProps) {
    const {Tree: Impl} = useDynamicUI();
    return <Impl {...props} />;
}

export type {TreeNode, TreeProps} from "@shared/ui/primitives/Tree/Tree.types.ts";
