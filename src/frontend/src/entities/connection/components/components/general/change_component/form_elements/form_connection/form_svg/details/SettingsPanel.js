/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';
import TooltipFontIcon from "@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon";
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import {findTopLeft} from "@application/utils/utils";
import {connect} from "react-redux";
import {
    testConnection,
} from "@entity/connection/redux_toolkit/action_creators/ConnectionCreators";
import {setFullScreen as setFullScreenFormSection} from "@application/redux_toolkit/slices/ApplicationSlice";
import ConfigurationsIcon
    from "@change_component/form_elements/form_connection/form_svg/details/configurations_icon/ConfigurationsIcon";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {mapItemsToClasses} from "@change_component/form_elements/form_connection/form_svg/utils";
import TestConnectionButton from "@change_component/form_elements/form_connection/form_svg/details/TestConnection";
import {TooltipButton} from "@app_component/base/tooltip_button/TooltipButton";
import {TextSize} from "@app_component/base/text/interfaces";


function mapStateToProps(state){
    const connectionOverview = state.connectionReducer;
    const {connection} = mapItemsToClasses(state);
    return{
        connection,
        updatingConnection: connectionOverview.updatingConnection,
        checkingConnectionTitle: connectionOverview.checkingConnectionTitle,
    };
}

@connect(mapStateToProps, {setFullScreenFormSection})
class SettingsPanel extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            isFullScreen: false,
        }
    }

    toggleFullScreen(){
        this.setState({
            isFullScreen: !this.state.isFullScreen,
        }, () => window.scrollTo({top: findTopLeft(`technical_layout_svg`).top - 4, behavior: "instant"}));
        this.props.setFullScreenFormSection(!this.state.isFullScreen)
    }

    update(){
        const {data, connection} = this.props;
        data.justUpdate(connection);
    }

    render(){
        const {isFullScreen} = this.state;
        const {togglePanel, isHidden, updatingConnection, checkingConnectionTitle} = this.props;
        return(
            <div className={styles.details_settings_panel}>
                <TestConnectionButton/>

                <TooltipButton
                    size={TextSize.Size_20}
                    position={'bottom'}
                    className={styles.position_icon_left}
                    icon={'save'}
                    tooltip={'Save'}
                    target={`save_connection_button`}
                    hasBackground={false}
                    handleClick={() => this.update()}
                />
                <ConfigurationsIcon/>
                <TooltipButton
                    size={TextSize.Size_20}
                    position={'bottom'}
                    className={styles.position_icon_left}
                    icon={isFullScreen ? 'close_fullscreen' : 'open_in_full'}
                    tooltip={isFullScreen ? 'Minimize' : 'Maximize'}
                    target={`fullscreen_connection_button`}
                    hasBackground={false}
                    handleClick={() => this.toggleFullScreen()}
                />
                <TooltipButton
                    size={TextSize.Size_20}
                    position={'bottom'}
                    className={styles.position_icon_left}
                    icon={isHidden ? 'chevron_left' : 'chevron_right'}
                    tooltip={isHidden ? 'Show' : 'Hide'}
                    target={`toggle_connection_button`}
                    hasBackground={false}
                    handleClick={() => togglePanel()}
                />
            </div>
        );
    }
}

export default SettingsPanel;