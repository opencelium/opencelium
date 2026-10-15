import { Tabs as AntTabsBase } from 'antd';
import type { TabsComponent } from '@shared/ui/primitives/Tabs/Tabs.types';
import './tabs.ant.css';

export const AntTabs: TabsComponent = ({
    items,
    value,
    defaultValue,
    onChange,
    isFullHeight,
}) => {
    return (
        <AntTabsBase
            activeKey={value}
            defaultActiveKey={defaultValue ?? items[0]?.key}
            onChange={onChange}
            className={isFullHeight ? 'oc-tabs-full-height' : undefined}
            items={items.map(item => ({
                key: item.key,
                label: item.label,
                children: item.content,
                disabled: item.disabled,
            }))}
        />
    );
};
