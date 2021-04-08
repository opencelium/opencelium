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
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import styles from "@themes/default/content/connections/connection_overview_2";
import {DETAILS_POSITION} from "@components/content/connection_overview_2/ConnectionLayout";
import {setLS} from "@utils/LocalStorage";


class SettingsPanel extends React.Component{
    constructor(props) {
        super(props);
    }

    openInNewWindow(){
        setLS('connection_overview', this.props.connectionOverviewState.toJS(), 'connection_overview');
        this.props.openInNewWindow();
    }

    render(){
        const {moveDetailsLeft, moveDetailsRight, position, isMinimized, minimize, maximize} = this.props;
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
            minMaxTooltipPosition = 'top';
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
            minMaxTooltipPosition = 'top';
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
                    tooltipPosition={'top'}
                />
            </div>
        );
    }
}

export default SettingsPanel;