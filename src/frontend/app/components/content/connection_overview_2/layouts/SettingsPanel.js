import React from 'react';
import PropTypes from 'prop-types';
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import styles from "@themes/default/content/connections/connection_overview_2";
import {DETAILS_POSITION} from "@components/content/connection_overview_2/ConnectionLayout";
import {NewWindowFeature} from "@decorators/NewWindowFeature";
import {connectionOverviewLayoutUrl} from "@utils/constants/url";
import {PANEL_LOCATION, SEPARATE_WINDOW} from "@utils/constants/app";

function isLocationSameWindow(props){
    return props.location === PANEL_LOCATION.SAME_WINDOW;
}

function setLocation(props, data){
    props.setLocation(data);
}

@NewWindowFeature({url: connectionOverviewLayoutUrl, windowName: SEPARATE_WINDOW.CONNECTION_OVERVIEW.LAYOUT, setLocation, isLocationSameWindow})
class SettingsPanel extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {detailsPosition, isLayoutMinimized, minimizeLayout, maximizeLayout, replaceLayouts, isDetailsMinimized, title, openInNewWindow, isVisible} = this.props;
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
            <div className={settingsPanelClassName} style={{display: isVisible ? 'block' : 'none'}}>
                <TooltipFontIcon className={styles.replace_icon} size={20} onClick={replaceLayouts} tooltip={'Replace'} value={'import_export'} tooltipPosition={minMaxTooltipPosition}  />
                <div className={titleClassName}>{title}</div>
                <TooltipFontIcon className={styles.min_max_icon} size={20} onClick={minMaxClick} tooltip={minMaxTooltip} value={minMaxValue} tooltipPosition={minMaxTooltipPosition}/>
                <TooltipFontIcon
                    size={20}
                    className={styles.new_window_icon}
                    onClick={openInNewWindow}
                    tooltip={'Open in new Window'}
                    value={'open_in_new'}
                    tooltipPosition={'top'}
                />
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
    location: PropTypes.oneOf(['same_window', 'new_window']).isRequired,
    setLocation: PropTypes.func.isRequired,
    isDetailsMinimized: PropTypes.bool,
    isVisible: PropTypes.bool,
};

SettingsPanel.defaultProps = {
    isDetailsMinimized: false,
    isVisible: true,
};

export default SettingsPanel;