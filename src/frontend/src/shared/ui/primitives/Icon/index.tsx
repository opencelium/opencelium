
import type { IconProps } from './Icon.types';
import {useDynamicUI} from "@app/providers/ui/DynamicFacade.tsx";

export function Icon(props: IconProps) {
    const { Icon } = useDynamicUI();
    return <Icon {...props} />;
}
