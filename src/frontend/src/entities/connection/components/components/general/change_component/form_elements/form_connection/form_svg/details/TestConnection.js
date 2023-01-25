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
import styled from 'styled-components';
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import {connect} from "react-redux";
import {
    addTestConnection, deleteTestConnectionById,
} from "@entity/connection/redux_toolkit/action_creators/ConnectionCreators";
import {
    addTestSchedule, startTestSchedule, deleteTestScheduleById, getScheduleById,
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
        testConnection: connectionOverview.testConnection,
        addingConnection: connectionOverview.addingTestConnection,
        deletingConnection: connectionOverview.deletingTestConnectionById,
        updatingConnection: connectionOverview.updatingConnection,
        checkingConnectionTitle: connectionOverview.checkingConnectionTitle,
        testSchedule: scheduleOverview.testSchedule,
        currentSchedule: scheduleOverview.currentSchedule,
        gettingScheduleById: scheduleOverview.gettingScheduleById,
        startingSchedule: scheduleOverview.startingTestSchedule,
        addingSchedule: scheduleOverview.addingTestSchedule,
        deletingSchedule: scheduleOverview.deletingTestScheduleById,
        scheduleError: scheduleOverview.error,
    };
}

@connect(mapStateToProps, {
    setFullScreenFormSection, addTestConnection, addTestSchedule, startTestSchedule,
    deleteTestConnectionById, deleteTestScheduleById, setInitialTestScheduleState,
    setInitialTestConnectionState, getScheduleById,
})
class TestConnectionButton extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            isFullScreen: false,
            testingConnection: false,
            startAddingConnection: false,
            startAddingSchedule: false,
            startTriggeringSchedule: false,
            startGettingSchedule: false,
            isFinishedTriggering: false,
            isTriggerFailed: false,
            startDeletingConnection: false,
            startDeletingSchedule: false,
        }
        this.scheduleInterval = null;
    }

    componentWillUnmount() {
        if(this.scheduleInterval){
            clearInterval(this.scheduleInterval);
            this.scheduleInterval = null;
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {
            testConnection, testSchedule, addingConnection,
            addingSchedule, startingSchedule, addTestSchedule,
            startTestSchedule, deleteTestConnectionById, deletingConnection,
            connectionError, scheduleError, deletingSchedule, deleteTestScheduleById,
            currentSchedule, gettingScheduleById, getScheduleById,
        } = this.props;
        const {
            startAddingConnection, startAddingSchedule, startTriggeringSchedule,
            startDeletingConnection, startDeletingSchedule, isFinishedTriggering,
            startGettingSchedule,
        } = this.state;
        if(addingConnection === API_REQUEST_STATE.FINISH && testConnection && startAddingConnection){
            this.setState({
                startAddingConnection: false,
                startAddingSchedule: true,
            })
            setTimeout(() => {addTestSchedule(testConnection)}, 300);
        }
        if(addingSchedule === API_REQUEST_STATE.FINISH && testSchedule && startAddingSchedule){
            this.setState({
                startAddingSchedule: false,
                startTriggeringSchedule: true,
            })
            setTimeout(() => {startTestSchedule(testSchedule)}, 300)
        }
        if(startingSchedule === API_REQUEST_STATE.FINISH && testConnection && startTriggeringSchedule && !isFinishedTriggering){
            this.setState({
                startTriggeringSchedule: false,
                startGettingSchedule: true,
            }, () => {
                this.scheduleInterval = setInterval(() => getScheduleById(testSchedule.schedulerId), 2000)
            })
        }
        if(!isFinishedTriggering && gettingScheduleById === API_REQUEST_STATE.FINISH && currentSchedule && currentSchedule.schedulerId === testSchedule.schedulerId){
            if(currentSchedule.lastExecution){
                if(currentSchedule.lastExecution.success){
                    clearInterval(this.scheduleInterval);
                    this.scheduleInterval = null;
                    this.setState({
                        isFinishedTriggering: true,
                    })
                }
                if(currentSchedule.lastExecution.fail){
                    clearInterval(this.scheduleInterval);
                    this.scheduleInterval = null;
                    this.setState({
                        isTriggerFailed: true,
                        isFinishedTriggering: true,
                    })
                }
            }
        }
        if(gettingScheduleById === API_REQUEST_STATE.FINISH && testConnection && isFinishedTriggering && startGettingSchedule){
            this.setState({
                startGettingSchedule: false,
                startDeletingSchedule: true,
            })
            setTimeout(() => {deleteTestScheduleById(testSchedule.schedulerId)}, 300)
        }
        if(deletingSchedule === API_REQUEST_STATE.FINISH && startDeletingSchedule){
            this.setState({
                startDeletingSchedule: false,
                startDeletingConnection: true,
            })
            setTimeout(() => {deleteTestConnectionById(testConnection.connectionId)}, 300)
        }
        if(deletingConnection === API_REQUEST_STATE.FINISH && startDeletingConnection){
            this.setState({
                startDeletingConnection: false,
            });
            setTimeout(() => {
                this.setState({
                    testingConnection: false,
                });
            }, 3500)
        }
        if(this.state.testingConnection && (connectionError || scheduleError)){
            setTimeout(() => this.setState({testingConnection: false}), 3500);
        }
    }

    test(e){
        const {connection, setInitialTestConnectionState, setInitialTestScheduleState} = this.props;
        const {testingConnection} = this.state;
        const newState = {};
        if(!testingConnection) {
            setInitialTestConnectionState();
            setInitialTestScheduleState();
            setTimeout(() => this.props.addTestConnection(connection.getObjectForBackend()), 500);
            newState.testingConnection = true;
            newState.startAddingConnection = true;
        }
        this.setState(newState);
    }

    render(){
        const {
            testingConnection, startAddingConnection,
            startAddingSchedule, startTriggeringSchedule,
            startDeletingConnection, startDeletingSchedule,
            isFinishedTriggering, isTriggerFailed,
        } = this.state;
        const isCreatingConnectionLoading = startAddingConnection;
        const isCreatingScheduleLoading = isCreatingConnectionLoading || startAddingSchedule;
        const isExecutionLoading = isCreatingScheduleLoading || !isFinishedTriggering;
        const isCleaningLoading = isExecutionLoading || startDeletingConnection || startDeletingSchedule;
        return(
            <React.Fragment>
                <TooltipButton
                    className={styles.test_connection_icon}
                    target={`test_connection_button`}
                    position={'bottom'}
                    tooltip={'Test'}
                    hasBackground={false}
                    handleClick={(e) => this.test(e)}
                    icon={'terminal'}
                    size={TextSize.Size_20}
                    loadingSize={TextSize.Size_14}
                    isDisabled={testingConnection}
                    isLoading={testingConnection}
                />
                {testingConnection && <CoverButtonStyled/>}
                <UncontrolledPopover
                    placement="bottom"
                    target="test_connection_button"
                    trigger="click"
                    isOpen={testingConnection}
                >
                    <PopoverHeader>
                        {"Test Connection"}
                    </PopoverHeader>
                    <PopoverBody>
                        <div style={{justifyContent: 'center', display: 'grid', gridTemplateColumns: '100% auto'}}>
                            <div>{`Creating a test connection `}</div>
                            <FontIcon
                                isLoading={isCreatingConnectionLoading}
                                value={isCreatingConnectionLoading ? ' ' : 'done'} size={20}/>
                            <div>{`Creating a test schedule `}</div>
                            <FontIcon
                                isLoading={isCreatingScheduleLoading}
                                value={isCreatingScheduleLoading ? ' ' : 'done'} size={20}/>
                            <div>{`Execute the connection `}</div>
                            <FontIcon
                                isLoading={isExecutionLoading}
                                value={isExecutionLoading ? ' ' : isTriggerFailed ? 'close' : 'done'} size={20}/>
                            <div>{`Cleaning process `}</div>
                            <FontIcon
                                isLoading={isCleaningLoading}
                                value={isCleaningLoading ? ' ' : 'done'} size={20}/>
                        </div>
                    </PopoverBody>
                </UncontrolledPopover>
            </React.Fragment>
        );
    }
}

const CoverButtonStyled = styled.div`
    width: 25px;
    height: 20px;
    position: absolute;
    right: 95px;
    top: 3px;
`;

export default TestConnectionButton;