import React from 'react';
import PropTypes from 'prop-types';
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import styles from "@themes/default/content/connections/connection_overview_2";
import {DETAILS_POSITION} from "@components/content/connection_overview_2/ConnectionLayout";

class SettingsPanel extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {detailsPosition, isLayoutMinimized, minimizeLayout, maximizeLayout, replaceLayouts, isDetailsMinimized, title} = this.props;
        let settingsPanelClassName = '';
        let minMaxTooltip = 'Minimize';
        let minMaxValue = 'minimize';
        let minMaxClick = minimizeLayout;
        let minMaxTooltipPosition = 'top';
        if(isLayoutMinimized){
            minMaxTooltip = 'Maximize';
            minMaxValue = 'maximize';
            minMaxClick = maximizeLayout;
        }
        let titleClassName = '';
        if(detailsPosition === DETAILS_POSITION.RIGHT){
            settingsPanelClassName = styles.layout_settings_panel_left;
            minMaxTooltipPosition = 'right';
            titleClassName = styles.technical_settings_panel_title_left;
        }
        if(detailsPosition === DETAILS_POSITION.LEFT){
            settingsPanelClassName = styles.layout_settings_panel_right;
            minMaxTooltipPosition = 'left';
            titleClassName = styles.technical_settings_panel_title_right;
        }
        if(isDetailsMinimized){
            titleClassName = styles.technical_settings_panel_title_center;
        }
        return(
            <div className={settingsPanelClassName}>
                <TooltipFontIcon className={styles.replace_icon} size={20} onClick={replaceLayouts} tooltip={'Replace'} value={'import_export'} tooltipPosition={minMaxTooltipPosition}  />
                <div className={titleClassName}>{title}</div>
                <TooltipFontIcon className={styles.min_max_icon} size={20} onClick={minMaxClick} tooltip={minMaxTooltip} value={minMaxValue} tooltipPosition={minMaxTooltipPosition}/>
            </div>
        );
    }
}

SettingsPanel.propTypes = {
    detailsPosition: PropTypes.oneOf(['right', 'left']).isRequired,
    isLayoutMinimized: PropTypes.bool.isRequired,
    minimizeLayout: PropTypes.func.isRequired,
    maximizeLayout: PropTypes.func.isRequired,
    replaceLayouts: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    isDetailsMinimized: PropTypes.bool,
};

SettingsPanel.defaultProps = {
    isDetailsMinimized: false,
};

export default SettingsPanel;