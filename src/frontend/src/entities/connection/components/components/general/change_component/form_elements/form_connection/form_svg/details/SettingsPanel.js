/*
 *  Copyright (C) <2022>  <becon GmbH>
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
import Confirmation from "@components/general/app/Confirmation";


function mapStateToProps(state){
    const connectionOverview = state.connectionReducer;
    const {connection} = mapItemsToClasses(state);
    return{
        connection,
        testingConnection: connectionOverview.testingConnection,
        updatingConnection: connectionOverview.updatingConnection,
        checkingConnectionTitle: connectionOverview.checkingConnectionTitle,
    };
}

@connect(mapStateToProps, {setFullScreenFormSection, testConnection})
class SettingsPanel extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            isFullScreen: false,
            showConfirmation: false,
        }
    }

    toggleConfirmation(){
        this.setState({
            showConfirmation: !this.state.showConfirmation,
        })
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

    test(){
        const {data, connection} = this.props;
        if(!connection.id){
            this.toggleConfirmation();
        } else{
            data.testConnection(connection);
        }
    }

    render(){
        const {isFullScreen, showConfirmation} = this.state;
        const {togglePanel, isHidden, testingConnection, updatingConnection, checkingConnectionTitle, data, connection} = this.props;
        return(
            <div className={styles.details_settings_panel}>
                <TooltipFontIcon size={20} tooltipPosition={'bottom'} isButton
                                 className={styles.position_icon_left}
                                 spinnerStyle={{width: '12px', height: '12px', verticalAlign: 'middle'}}
                                 wrapStyles={{fontSize: '14px'}}
                                 value={'terminal'}
                                 tooltip={'Test'}
                                 isLoading={testingConnection === API_REQUEST_STATE.START}
                                 onClick={() => this.test()}/>
                <TooltipFontIcon size={20} tooltipPosition={'bottom'} isButton
                                 className={styles.position_icon_left}
                                 spinnerStyle={{width: '12px', height: '12px', verticalAlign: 'middle'}}
                                 wrapStyles={{fontSize: '14px'}}
                                 value={'save'}
                                 tooltip={'Save'}
                                 isLoading={updatingConnection === API_REQUEST_STATE.START || checkingConnectionTitle === API_REQUEST_STATE.START}
                                 onClick={() => this.update()}/>
                <ConfigurationsIcon/>
                <TooltipFontIcon size={20} tooltipPosition={'bottom'} isButton
                                 className={styles.position_icon_left}
                                 value={isFullScreen ? 'close_fullscreen' : 'open_in_full'}
                                 tooltip={isFullScreen ? 'Minimize' : 'Maximize'}
                                 onClick={() => this.toggleFullScreen()}/>
                <TooltipFontIcon size={24} tooltipPosition={'bottom'} isButton
                                 className={styles.position_icon_left}
                                 value={isHidden ? 'chevron_left' : 'chevron_right'}
                                 tooltip={isHidden ? 'Show' : 'Hide'}
                                 onClick={() => togglePanel()}/>
                <Confirmation
                    okClick={() => {this.toggleConfirmation(); setTimeout(() => data.testConnection(connection), 200); }}
                    cancelClick={() => this.toggleConfirmation()}
                    active={showConfirmation}
                    title={'Confirmation'}
                    message={'Your connection will be saved before test. Are you agree with that?'}
                />
            </div>
        );
    }
}

export default SettingsPanel;