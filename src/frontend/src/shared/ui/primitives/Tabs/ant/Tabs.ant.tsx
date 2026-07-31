import { Tabs as AntTabsBase } from 'antd';

export const AntTabs: TabsComponent = ({
    items,
    value,
    defaultValue,
    onChange,
}) => {
    return (
        <AntTabsBase
            activeKey={value}
            defaultActiveKey={defaultValue ?? items[0]?.key}
            onChange={onChange}
            items={items.map(item => ({
                key: item.key,
                label: item.label,
                children: item.content,
                disabled: item.disabled,
            }))}
        />
    );
};
