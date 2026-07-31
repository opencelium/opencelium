import React from 'react';
import { useUISystem } from '@/shared/theme/hooks/useUISystem';
import {Select} from "@shared/ui/primitives/Select";
import type {UISystem} from "@shared/theme/types.ts";

export const SystemSwitcher: React.FC = () => {
    const { system, setSystem } = useUISystem();

    const setNewSystem = (newSystem: UISystem) => {
        setSystem(newSystem);
    };

    return (
        <div style={{width: 200}}>
            <Select
                value={system}
                onChange={(val) => setNewSystem(val)}
                options={[
                    { label: 'UI: Ant Design', value: 'ant' },
                    { label: 'UI: Material', value: 'material' },
                    { label: 'UI: Custom', value: 'custom' },
                ]}
            />
        </div>
    );
};
