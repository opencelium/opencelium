import type { TabsComponent } from './Tabs.types';
import {MaterialTabs} from "@shared/ui/primitives/Tabs/material/Tabs.material.tsx";
import {AntTabs} from "@shared/ui/primitives/Tabs/ant/Tabs.ant.tsx";
import type {UIFactory} from "@shared/ui/primitives/types.ts";

export const TabsFactory: UIFactory<TabsComponent> = {
    default: AntTabs,
    material: MaterialTabs,
    ant: AntTabs,
};
