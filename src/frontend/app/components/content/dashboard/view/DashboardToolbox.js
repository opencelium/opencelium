import React from 'react';
import styles from '@themes/default/content/dashboard/dashboard.scss';
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";

const ToolboxItem = (props) => {
    const {onTakeItem, item} = props;
    return (
        <div
            className={styles.dashboard_toolbox_item}
            onClick={(e) => onTakeItem(e, item)}
        >
            <TooltipFontIcon size={30} tooltip={item.tooltip} value={item.icon} isButton={true}/>
        </div>
    );
}

class DashboardToolbox extends React.Component{
    constructor(props) {
        super(props);
    }

    render() {
        const {items, onTakeItem} = this.props;
        return (
            <div className={styles.dashboard_toolbox}>
                {items.length === 0 && <div className={styles.dashboard_toolbox_title}>Toolbox</div>}
                <div className={styles.dashboard_toolbox_items}>
                    {items.map(item => (
                        <ToolboxItem
                            key={item.i}
                            item={item}
                            onTakeItem={(e) => onTakeItem(e, item)}
                        />
                    ))}
                </div>
            </div>
        );
    }
}

export default DashboardToolbox;