/*
 * Copyright (C) <2021>  <becon GmbH>
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

class SettingsPanel extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {
            detailsPosition, isLayoutMinimized, minimizeLayout, maximizeLayout,
            replaceLayouts, isDetailsMinimized, title, openInNewWindow,
            isReplaceIconDisabled, isMinMaxIconDisabled, isNewWindowIconDisabled,
        } = this.props;
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
                <TooltipFontIcon
                    className={styles.replace_icon}
                    size={20}
                    onClick={replaceLayouts}
                    tooltip={'Replace'}
                    value={'import_export'}
                    tooltipPosition={minMaxTooltipPosition}
                    disabled={isReplaceIconDisabled}
                    isButton={true}
                />
                <div className={titleClassName}>{title}</div>
                <TooltipFontIcon
                    className={styles.min_max_icon}
                    size={20}
                    onClick={minMaxClick}
                    tooltip={minMaxTooltip}
                    value={minMaxValue}
                    tooltipPosition={minMaxTooltipPosition}
                    disabled={isMinMaxIconDisabled}
                    isButton={true}
                />
                <TooltipFontIcon
                    size={20}
                    className={styles.new_window_icon}
                    onClick={openInNewWindow}
                    tooltip={'Open in new Window'}
                    value={'open_in_new'}
                    tooltipPosition={'top'}
                    disabled={isNewWindowIconDisabled}
                    isButton={true}
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
    isReplaceIconDisabled: PropTypes.bool,
    isMinMaxIconDisabled: PropTypes.bool,
    isNewWindowIconDisabled: PropTypes.bool,
};

SettingsPanel.defaultProps = {
    isDetailsMinimized: false,
    isReplaceIconDisabled: false,
    isMinMaxIconDisabled: false,
    isNewWindowIconDisabled: false,
};

export default SettingsPanel;