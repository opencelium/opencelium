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
            <TooltipFontIcon size={30} tooltip={item.tooltipTranslationKey} value={item.icon} isButton={true}/>
        </div>
    );
}

class DashboardToolbox extends React.Component{
    constructor(props) {
        super(props);
    }

    render() {
        const {items, onTakeItem} = this.props;
        let toolboxTitle = <span>{'Available Widgets:'}</span>;
        if(items.length === 0){
            toolboxTitle = <span>{'Available Widgets:'} <span style={{fontWeight: 'bold'}}>{'all being used.'}</span></span>;
        }
        return (
            <div className={styles.dashboard_toolbox}>
                <div className={styles.dashboard_toolbox_title}>{toolboxTitle}</div>
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