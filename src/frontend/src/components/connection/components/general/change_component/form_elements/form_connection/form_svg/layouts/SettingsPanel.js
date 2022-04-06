/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';
import PropTypes from 'prop-types';
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import styles from "@themes/default/content/connections/connection_overview_2";
import {DETAILS_POSITION} from "../FormConnectionSvg";
import ConfigurationsIcon from "@change_component/form_elements/form_connection/form_svg/details/configurations_icon/ConfigurationsIcon";

class SettingsPanel extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {
            detailsPosition, isLayoutMinimized, minimizeLayout, maximizeLayout,
            replaceLayouts, isDetailsMinimized, title, openInNewWindow,
            isReplaceIconDisabled, isMinMaxIconDisabled, isNewWindowIconDisabled,
            hasConfigurationsIcon, isDisabled,
        } = this.props;
        let settingsPanelClassName = '';
        let minMaxTooltip = 'Minimize';
        let minMaxValue = 'minimize';
        let minMaxClick = minimizeLayout;
        let tooltipPosition = 'bottom';
        if(isLayoutMinimized){
            minMaxTooltip = 'Maximize';
            minMaxValue = 'maximize';
            minMaxClick = maximizeLayout;
        }
        let titleClassName = '';
        if(detailsPosition === DETAILS_POSITION.RIGHT){
            settingsPanelClassName = styles.layout_settings_panel_left;
            titleClassName = styles.technical_settings_panel_title_left;
            tooltipPosition = 'right_bottom';
        }
        if(detailsPosition === DETAILS_POSITION.LEFT){
            settingsPanelClassName = styles.layout_settings_panel_right;
            titleClassName = styles.technical_settings_panel_title_right;
            tooltipPosition = 'left_bottom';
        }
        if(isDetailsMinimized){
            titleClassName = styles.technical_settings_panel_title_center;
        }
        return(
            <div className={settingsPanelClassName} onDoubleClick={minMaxClick}>

                <TooltipFontIcon
                    className={styles.replace_icon}
                    size={20}
                    onClick={replaceLayouts}
                    tooltip={isReplaceIconDisabled ? '' : 'Replace'}
                    value={'import_export'}
                    tooltipPosition={tooltipPosition}
                    disabled={isDisabled || isReplaceIconDisabled}
                    isButton={true}
                />
                <div style={{cursor: 'pointer'}} className={titleClassName}>{title}</div>
                <TooltipFontIcon
                    className={styles.min_max_icon}
                    size={20}
                    onClick={minMaxClick}
                    tooltip={isMinMaxIconDisabled ? '' : minMaxTooltip}
                    value={minMaxValue}
                    tooltipPosition={tooltipPosition}
                    disabled={isDisabled || isMinMaxIconDisabled}
                    isButton={true}
                />
                <TooltipFontIcon
                    size={20}
                    className={styles.new_window_icon}
                    onClick={openInNewWindow}
                    tooltip={isNewWindowIconDisabled ? '' : 'Open in new Window'}
                    value={'open_in_new'}
                    tooltipPosition={tooltipPosition}
                    disabled={isDisabled || isNewWindowIconDisabled}
                    isButton={true}
                />
                {hasConfigurationsIcon && <ConfigurationsIcon disabled={isDisabled} tooltipPosition={tooltipPosition}/>}
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
    isReplaceIconDisabled: PropTypes.bool,
    isMinMaxIconDisabled: PropTypes.bool,
    isNewWindowIconDisabled: PropTypes.bool,
    hasConfigurationsIcon: PropTypes.bool,
    isDisabled: PropTypes.bool,
};

SettingsPanel.defaultProps = {
    isDetailsMinimized: false,
    isReplaceIconDisabled: false,
    isMinMaxIconDisabled: false,
    isNewWindowIconDisabled: false,
    hasConfigurationsIcon: false,
    isDisabled: false,
};

export default SettingsPanel;