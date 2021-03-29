import React from 'react';
import {connect} from 'react-redux';
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import styles from "@themes/default/content/connections/connection_overview_2";
import {DETAILS_POSITION} from "@components/content/connection_overview_2/ConnectionLayout";
import {setDetailsLocation} from "@actions/connection_overview_2/set";
import {connectionOverviewDetailsUrl} from "@utils/constants/url";
import {DETAILS_LOCATION} from "@utils/constants/app";


@connect(null, {setDetailsLocation})
class SettingsPanel extends React.Component{
    constructor(props) {
        super(props);
    }

    openInNewWindow(){
        this.props.setDetailsLocation(DETAILS_LOCATION.NEW_WINDOW);
        window.open(connectionOverviewDetailsUrl, '_blank', '');
    }

    render(){
        const {moveDetailsLeft, moveDetailsRight, position, isMinimized, minimize, maximize, setDetailsLocation} = this.props;
        let positionIconClassName = '';
        let minMaxIconClassName = '';
        let newWindowIconClassName = '';
        let positionTooltip = '';
        let positionValue = '';
        let positionClick = null;
        let minMaxTooltipPosition;
        let settingsPanelStyles = {};
        let detailsTitleClassName = '';
        if(position === DETAILS_POSITION.LEFT){
            positionIconClassName = styles.position_icon_left;
            minMaxIconClassName = styles.min_max_icon_left;
            newWindowIconClassName = styles.new_window_icon_left;
            positionTooltip = 'Move to the Right';
            positionValue = 'keyboard_arrow_right';
            positionClick = moveDetailsRight;
            minMaxTooltipPosition = 'right';
            settingsPanelStyles.borderRight = 'none';
            detailsTitleClassName = styles.details_title_left;
        }
        if(position === DETAILS_POSITION.RIGHT){
            positionIconClassName = styles.position_icon_right;
            minMaxIconClassName = styles.min_max_icon_right;
            newWindowIconClassName = styles.new_window_icon_right;
            positionTooltip = 'Move to the Left';
            positionValue = 'keyboard_arrow_left';
            positionClick = moveDetailsLeft;
            minMaxTooltipPosition = 'left';
            settingsPanelStyles.borderLeft = 'none';
            detailsTitleClassName = styles.details_title_right;
        }
        let minMaxTooltip = '';
        let minMaxValue = '';
        let minMaxClick;
        if(isMinimized){
            minMaxTooltip = 'Maximize';
            minMaxValue = 'maximize';
            minMaxClick = maximize;
        } else{
            minMaxTooltip = 'Minimize';
            minMaxValue = 'minimize';
            minMaxClick = minimize;
        }
        return(
            <div className={styles.details_settings_panel} style={settingsPanelStyles}>
                <TooltipFontIcon
                    size={20}
                    className={positionIconClassName}
                    onClick={positionClick}
                    tooltip={positionTooltip}
                    value={positionValue}
                />
                {isMinimized && <div className={detailsTitleClassName}>Details</div>}
                <TooltipFontIcon
                    size={20}
                    className={minMaxIconClassName}
                    onClick={minMaxClick}
                    tooltip={minMaxTooltip}
                    value={minMaxValue}
                    tooltipPosition={minMaxTooltipPosition}
                />
                <TooltipFontIcon
                    size={20}
                    className={newWindowIconClassName}
                    onClick={::this.openInNewWindow}
                    tooltip={'Open in new Window'}
                    value={'open_in_new'}
                    tooltipPosition={'left'}
                />
            </div>
        );
    }
}

export default SettingsPanel;