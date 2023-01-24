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
            startAddingConnection: false,
            startAddingSchedule: false,
            startTriggeringSchedule: false,
            startDeletingConnection: false,
            startDeletingSchedule: false,
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {
            testConnection, testSchedule, addingConnection,
            addingSchedule, startingSchedule, addTestSchedule,
            startTestSchedule, deleteTestConnectionById, deletingConnection,
            connectionError, scheduleError, deletingSchedule, deleteTestScheduleById,
        } = this.props;
        const {
            startAddingConnection,
            startAddingSchedule,
            startTriggeringSchedule,
            startDeletingConnection,
            startDeletingSchedule,
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
        if(startingSchedule === API_REQUEST_STATE.FINISH && testConnection && startTriggeringSchedule){
            this.setState({
                startTriggeringSchedule: false,
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
        } = this.state;
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
                    isDisabled={testingConnection}
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
                                isLoading={startAddingConnection}
                                value={startAddingConnection ? ' ' : 'done'} size={20}/>
                            <div>{`Creating a test schedule `}</div>
                            <FontIcon
                                isLoading={startAddingConnection || startAddingSchedule}
                                value={startAddingConnection || startAddingSchedule ? ' ' : 'done'} size={20}/>
                            <div>{`Execute the connection `}</div>
                            <FontIcon
                                isLoading={startAddingConnection || startAddingSchedule || startTriggeringSchedule}
                                value={startAddingConnection || startAddingSchedule || startTriggeringSchedule ? ' ' : 'done'} size={20}/>
                            <div>{`Cleaning process `}</div>
                            <FontIcon
                                isLoading={startAddingConnection || startAddingSchedule || startTriggeringSchedule || startDeletingConnection || startDeletingSchedule}
                                value={startAddingConnection || startAddingSchedule || startTriggeringSchedule || startDeletingConnection || startDeletingSchedule ? ' ' : 'done'} size={20}/>
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