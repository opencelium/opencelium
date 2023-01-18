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
import {connect} from "react-redux";
import {
    addTestConnection, deleteTestConnectionById,
} from "@entity/connection/redux_toolkit/action_creators/ConnectionCreators";
import {
    addTestSchedule, startTestSchedule, deleteTestScheduleById,
} from "@entity/schedule/redux_toolkit/action_creators/ScheduleCreators";
import {setFullScreen as setFullScreenFormSection} from "@application/redux_toolkit/slices/ApplicationSlice";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {mapItemsToClasses} from "@change_component/form_elements/form_connection/form_svg/utils";
import {PopoverBody, PopoverHeader, UncontrolledPopover} from "reactstrap";
import FontIcon from "@basic_components/FontIcon";
import {TextSize} from "@app_component/base/text/interfaces";
import {TooltipButton} from "@app_component/base/tooltip_button/TooltipButton";
import {setInitialTestConnectionState} from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import {setInitialTestScheduleState} from "@entity/schedule/redux_toolkit/slices/ScheduleSlice";


function mapStateToProps(state){
    const connectionOverview = state.connectionReducer;
    const scheduleOverview = state.scheduleReducer;
    const {connection} = mapItemsToClasses(state);
    return{
        connection,
        connectionError: connectionOverview.error,
        scheduleError: scheduleOverview.error,
        testConnection: connectionOverview.testConnection,
        addingConnection: connectionOverview.addingTestConnection,
        deletingConnection: connectionOverview.deletingTestConnectionById,
        testSchedule: scheduleOverview.testSchedule,
        startingSchedule: scheduleOverview.startingTestSchedule,
        addingSchedule: scheduleOverview.addingTestSchedule,
        deletingSchedule: scheduleOverview.deletingTestScheduleById,
        updatingConnection: connectionOverview.updatingConnection,
        checkingConnectionTitle: connectionOverview.checkingConnectionTitle,
    };
}

@connect(mapStateToProps, {
    setFullScreenFormSection, addTestConnection, addTestSchedule, startTestSchedule,
    deleteTestConnectionById, deleteTestScheduleById, setInitialTestScheduleState,
    setInitialTestConnectionState,
})
class TestConnectionButton extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            isFullScreen: false,
            testingConnection: false,
            showProcess: false,
        }
        this.startAddingConnection = false;
        this.startAddingSchedule = false;
        this.startTriggeringSchedule = false;
        this.startDeletingConnection = false;
        this.startDeletingSchedule = false;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {
            testConnection, testSchedule, addingConnection,
            addingSchedule, startingSchedule, addTestSchedule,
            startTestSchedule, deleteTestConnectionById, deletingConnection,
            connectionError, scheduleError, deletingSchedule, deleteTestScheduleById,
        } = this.props;
        if(addingConnection === API_REQUEST_STATE.FINISH && testConnection && this.startAddingConnection){
            this.startAddingConnection = false;
            this.startAddingSchedule = true;
            setTimeout(() => {addTestSchedule(testConnection)}, 500);
        }
        if(addingSchedule === API_REQUEST_STATE.FINISH && testSchedule && this.startAddingSchedule){
            this.startAddingSchedule = false;
            this.startTriggeringSchedule = true;
            setTimeout(() => {startTestSchedule(testSchedule)}, 500)
        }
        if(startingSchedule === API_REQUEST_STATE.FINISH && testConnection && this.startTriggeringSchedule){
            this.startTriggeringSchedule = false;
            this.startDeletingSchedule = true;
            setTimeout(() => {deleteTestScheduleById(testSchedule.schedulerId)}, 500)
        }
        if(deletingSchedule === API_REQUEST_STATE.FINISH && this.startDeletingSchedule){
            this.startDeletingSchedule = false;
            this.startDeletingConnection = true;
            setTimeout(() => {deleteTestConnectionById(testConnection.connectionId)}, 500)
        }
        if(deletingConnection === API_REQUEST_STATE.FINISH && this.startDeletingConnection){
            this.startDeletingConnection = false;
            setTimeout(() => {this.setState({testingConnection: false})}, 2000)
        }
        if(this.state.testingConnection && (connectionError || scheduleError)){
            setTimeout(() => this.setState({testingConnection: false}), 2000);
        }
    }

    test(e){
        const {connection, setInitialTestConnectionState, setInitialTestScheduleState} = this.props;
        const {showProcess, testingConnection} = this.state;
        const newState = {showProcess: !showProcess};
        if(!testingConnection && !showProcess) {
            this.startAddingConnection = true;
            setInitialTestConnectionState();
            setInitialTestScheduleState();
            setTimeout(() => this.props.addTestConnection(connection.getObjectForBackend()), 500);
            newState.testingConnection = true;
        }
        this.setState(newState);
    }

    render(){
        const {showProcess, testingConnection} = this.state;
        return(
            <React.Fragment>
                <TooltipButton
                    className={styles.test_connection_icon}
                    target={`test_connection_button`}
                    position={'bottom'}
                    tooltip={!showProcess ? testingConnection ? 'Test Result' : 'Test' : 'Close'}
                    hasBackground={false}
                    handleClick={(e) => this.test(e)}
                    icon={!showProcess ? testingConnection ? 'terminal' : 'play_arrow' : 'close'}
                    size={TextSize.Size_20}
                />
                <UncontrolledPopover
                    placement="bottom"
                    target="test_connection_button"
                    trigger="click"
                >
                    <PopoverHeader>
                        {"Test Connection"}
                    </PopoverHeader>
                    <PopoverBody>
                        <div style={{justifyContent: 'center', display: 'grid', gridTemplateColumns: '100% auto'}}>
                            <div>{`Creating a test connection `}</div>
                            <FontIcon
                                isLoading={this.startAddingConnection}
                                value={this.startAddingConnection ? ' ' : 'done'} size={20}/>
                            <div>{`Creating a test schedule `}</div>
                            <FontIcon
                                isLoading={this.startAddingConnection || this.startAddingSchedule}
                                value={this.startAddingConnection || this.startAddingSchedule ? ' ' : 'done'} size={20}/>
                            <div>{`Starting a test connection `}</div>
                            <FontIcon
                                isLoading={this.startAddingConnection || this.startAddingSchedule || this.startTriggeringSchedule}
                                value={this.startAddingConnection || this.startAddingSchedule || this.startTriggeringSchedule ? ' ' : 'done'} size={20}/>
                            <div>{`Cleaning process `}</div>
                            <FontIcon
                                isLoading={this.startAddingConnection || this.startAddingSchedule || this.startTriggeringSchedule || this.startDeletingConnection || this.startDeletingSchedule}
                                value={this.startAddingConnection || this.startAddingSchedule || this.startTriggeringSchedule || this.startDeletingConnection || this.startDeletingSchedule ? ' ' : 'done'} size={20}/>
                        </div>
                    </PopoverBody>
                </UncontrolledPopover>
            </React.Fragment>
        );
    }
}

export default TestConnectionButton;