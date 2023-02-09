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
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import {findTopLeft} from "@application/utils/utils";
import {connect} from "react-redux";
import {setFullScreen as setFullScreenFormSection} from "@application/redux_toolkit/slices/ApplicationSlice";
import ConfigurationsIcon
    from "@change_component/form_elements/form_connection/form_svg/details/configurations_icon/ConfigurationsIcon";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {mapItemsToClasses} from "@change_component/form_elements/form_connection/form_svg/utils";
import TestConnectionButton from "@change_component/form_elements/form_connection/form_svg/details/TestConnection";
import {TooltipButton} from "@app_component/base/tooltip_button/TooltipButton";
import {TextSize} from "@app_component/base/text/interfaces";
import {toggleDetails} from "@root/redux_toolkit/slices/ConnectionSlice";


function mapStateToProps(state){
    const connectionOverview = state.connectionReducer;
    const applicationOverview = state.applicationReducer;
    const {connection} = mapItemsToClasses(state);
    return{
        connection,
        isFullScreen: applicationOverview.isFullScreen,
        addingConnection: connectionOverview.addingConnection,
        updatingConnection: connectionOverview.updatingConnection,
        checkingConnectionTitle: connectionOverview.checkingConnectionTitle,
        isDetailsOpened: connectionOverview.isDetailsOpened,
        isTestingConnection: connectionOverview.isTestingConnection,
    };
}

@connect(mapStateToProps, {setFullScreenFormSection, toggleDetails})
class SettingsPanel extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            isFullScreen: props.isFullScreen,
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(this.props.isFullScreen !== this.state.isFullScreen){
            this.setState({
                isFullScreen: this.props.isFullScreen,
            }, () => window.scrollTo({top: findTopLeft(`technical_layout_svg`).top - 4, behavior: "instant"}));
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
        const {
            addingConnection, updatingConnection, readOnly,
            isDetailsOpened, toggleDetails, isTestingConnection,
        } = this.props;
        return(
            <div className={styles.details_settings_panel}>
                <TestConnectionButton/>
                {!readOnly &&
                    <TooltipButton
                        loadingSize={TextSize.Size_14}
                        size={TextSize.Size_20}
                        position={'bottom'}
                        className={styles.position_icon_left}
                        icon={'save'}
                        tooltip={'Save'}
                        target={`save_connection_button`}
                        hasBackground={false}
                        isLoading={addingConnection === API_REQUEST_STATE.START || updatingConnection === API_REQUEST_STATE.START}
                        isDisabled={isTestingConnection || addingConnection === API_REQUEST_STATE.START || updatingConnection === API_REQUEST_STATE.START}
                        handleClick={() => this.update()}
                    />
                }
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
                    isDisabled={isTestingConnection}
                    size={TextSize.Size_20}
                    position={'bottom'}
                    className={styles.position_icon_left}
                    icon={!isDetailsOpened ? 'chevron_left' : 'chevron_right'}
                    tooltip={!isDetailsOpened ? 'Show Details' : 'Hide'}
                    target={`toggle_connection_button`}
                    hasBackground={false}
                    handleClick={toggleDetails}
                />
            </div>
        );
    }
}

export default SettingsPanel;