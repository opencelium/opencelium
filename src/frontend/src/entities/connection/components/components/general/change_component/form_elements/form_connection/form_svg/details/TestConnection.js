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
import {setInitialTestConnectionState, setTestingConnection, clearCurrentLogs} from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import {setInitialTestScheduleState} from "@entity/schedule/redux_toolkit/slices/ScheduleSlice";
import Counter from "@app_component/base/counter/Counter";
import Text from "@app_component/base/text/Text";
import SyncLogs from "./SyncLogs";
import { ColorTheme } from '@style/Theme';


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
        isTestingConnection: connectionOverview.isTestingConnection,
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
    setInitialTestConnectionState, getScheduleById, setTestingConnection,
    clearCurrentLogs,
})
class TestConnectionButton extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            isFullScreen: false,
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
            this.props.setTestingConnection(false);
            clearInterval(this.scheduleInterval);
            this.scheduleInterval = null;
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {
            testConnection, testSchedule, addingConnection, setFullScreenFormSection,
            addingSchedule, startingSchedule, addTestSchedule,
            startTestSchedule, deleteTestConnectionById, deletingConnection,
            connectionError, scheduleError, deletingSchedule, deleteTestScheduleById,
            currentSchedule, gettingScheduleById, getScheduleById, setTestingConnection,
            isTestingConnection,
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
        if(!isFinishedTriggering && gettingScheduleById === API_REQUEST_STATE.FINISH && currentSchedule && testSchedule && currentSchedule.schedulerId === testSchedule.schedulerId){
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
                setTestingConnection(false);
            }, 3500)
        }
        if(isTestingConnection && (connectionError || scheduleError)){
            setTimeout(() => setTestingConnection(false), 3500);
        }
    }

    test(e){
        const {
            connection, setInitialTestConnectionState, setInitialTestScheduleState,
            setTestingConnection, isTestingConnection, setFullScreenFormSection,
            addTestConnection,
        } = this.props;
        const newState = {};
        if(!isTestingConnection) {
            setInitialTestConnectionState();
            setInitialTestScheduleState();
            setTimeout(() => addTestConnection(connection.getObjectForBackend()), 500);
            setTestingConnection(true);
            newState.startAddingConnection = true;
            newState.isFinishedTriggering = false;
            newState.isTriggerFailed = false;
        }
        setFullScreenFormSection(true);
        this.setState(newState);
    }

    render(){
        const {
            startAddingConnection, startAddingSchedule, startTriggeringSchedule,
            startDeletingConnection, startDeletingSchedule, isFinishedTriggering,
            isTriggerFailed, startGettingSchedule,
        } = this.state;
        const {
            isTestingConnection, connection, testSchedule,
        } = this.props;
        const isCreatingConnectionLoading = startAddingConnection;
        const isCreatingScheduleLoading = isCreatingConnectionLoading || startAddingSchedule;
        const isExecutionLoading = isCreatingScheduleLoading || !isFinishedTriggering;
        const isCleaningLoading = isExecutionLoading || startDeletingConnection || startDeletingSchedule;
        return(
            <React.Fragment>
                <SyncLogs connection={connection}/>
                <TooltipButton
                    className={styles.test_connection_icon}
                    target={`test_connection_button`}
                    position={'bottom'}
                    tooltip={'Test'}
                    hasBackground={true}
                    background={isTestingConnection ? ColorTheme.Blue : ColorTheme.White}
                    color={isTestingConnection ? ColorTheme.White : ColorTheme.Gray}
                    padding="2px 10px"
                    handleClick={(e) => this.test(e)}
                    icon={"play_arrow"}
                    loadingSize={TextSize.Size_14}
                    isDisabled={isTestingConnection}
                    isLoading={isTestingConnection}
                    label="Test run"
                    size={TextSize.Size_12}
                />
                {isTestingConnection && <CoverButtonStyled/>}
                <UncontrolledPopover
                    placement="bottom"
                    target="test_connection_button"
                    trigger="click"
                    isOpen={isTestingConnection}
                >
                    <PopoverHeader>
                        {"Test Connection"}
                    </PopoverHeader>
                    <PopoverBody>
                        <div style={{justifyContent: 'center', display: 'grid', gridTemplateColumns: '100% auto', padding: '5px'}}>
                            <div>
                                <Text value={`Creating a test connection `} size={TextSize.Size_14}/>
                            </div>
                            <FontIcon
                                isLoading={isCreatingConnectionLoading}
                                value={isCreatingConnectionLoading ? ' ' : 'done'} size={20}/>
                            <div>
                                <Text value={`Creating a test schedule `} size={TextSize.Size_14}/>
                            </div>
                            <FontIcon
                                isLoading={isCreatingScheduleLoading}
                                value={isCreatingScheduleLoading ? ' ' : 'done'} size={20}/>
                            <div>
                                <Text value={
                                        <div>
                                            {"Connection Execution ("}
                                            <Counter schedule={testSchedule} shouldStart={startTriggeringSchedule || startGettingSchedule} shouldStop={!isExecutionLoading} size={TextSize.Size_12}/>
                                            {")"}
                                        </div>
                                    } size={TextSize.Size_14}/>
                            </div>
                            <FontIcon
                                isLoading={isExecutionLoading}
                                value={isExecutionLoading ? ' ' : isTriggerFailed ? 'close' : 'done'} size={20}/>
                            <div>
                                <Text value={`Cleaning process `} size={TextSize.Size_14}/>
                            </div>
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
