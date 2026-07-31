import type { FieldContainerProps } from './FieldContainer.types';
import {useDynamicUI} from "@app/providers/ui/DynamicFacade.tsx";

export function FieldContainer(props: FieldContainerProps) {
    const { FieldContainer } = useDynamicUI();
    return <FieldContainer {...props} />;
}
