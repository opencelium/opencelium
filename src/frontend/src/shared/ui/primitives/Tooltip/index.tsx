import type { TooltipProps } from './Tooltip.types';
import {useDynamicUI} from "@app/providers/ui/DynamicFacade.tsx";

export function Tooltip(props: TooltipProps) {
    const { Tooltip } = useDynamicUI();
    return <Tooltip {...props} />;
}
