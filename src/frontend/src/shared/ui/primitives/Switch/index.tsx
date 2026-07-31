import type { SwitchProps } from './Switch.types';
import {useDynamicUI} from "@app/providers/ui/DynamicFacade.tsx";

export function Switch(props: SwitchProps) {
    const { Switch } = useDynamicUI();
    return <Switch {...props} />;
}
