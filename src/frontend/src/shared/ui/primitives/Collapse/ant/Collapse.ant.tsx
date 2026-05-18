import { Collapse as AntCollapseBase } from 'antd';
import type { CollapseComponent } from '../Collapse.types';
import './collapse.ant.css';

export const AntCollapse: CollapseComponent = ({
    items,
    activeKeys,
    defaultActiveKeys,
    accordion = false,
    onChange,
    className,
    style,
}) => {
    return (
        <AntCollapseBase
            activeKey={activeKeys}
            defaultActiveKey={defaultActiveKeys}
            accordion={accordion}
            onChange={(keys) => onChange?.(Array.isArray(keys) ? keys : [keys])}
            className={className}
            style={style}
            items={items.map((item) => ({
                key: item.key,
                label: item.label,
                children: item.content,
                disabled: item.disabled,
            }))}
        />
    );
};
