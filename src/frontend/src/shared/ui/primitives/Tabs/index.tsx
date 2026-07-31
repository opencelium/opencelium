import type { TabsProps } from './Tabs.types';
import {useDynamicUI} from "@app/providers/ui/DynamicFacade.tsx";

export function Tabs(props: TabsProps) {
    const { Tabs } = useDynamicUI();
    return <Tabs {...props} />;
}
