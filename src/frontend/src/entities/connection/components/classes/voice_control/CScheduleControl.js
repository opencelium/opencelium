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

import {PREFIX_COMMAND_NAME} from "@entity/connection/components/classes/voice_control/CVoiceControl";

class CScheduleControl{

    static getCommands(data) {
        let navigationCommands = {};
        const focusSearchName = `${PREFIX_COMMAND_NAME} focus search`;
        let focusSearchField = document.getElementById('search_title');
        if(focusSearchField){
            navigationCommands[focusSearchName] = () => focusSearchField.focus();
        }
        if (data && data.component) {
            const props = data.hasOwnProperty('props') ? data.props : data.component.props;
            const state = data.hasOwnProperty('state') ? data.state : data.component.state;
            if(typeof data.component.openPage === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} next page`] = () => data.component.openPage(null, state.currentPage + 1);
                navigationCommands[`${PREFIX_COMMAND_NAME} previous page`] = () => data.component.openPage(null, state.currentPage - 1);
            }
            if(typeof props.checkAllSchedules === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} select jobs`] = () => {
                    const props = data.hasOwnProperty('props') ? data.props : data.component.props;
                    if(!props.allChecked) {
                        props.checkAllSchedules()
                    }
                };
                navigationCommands[`${PREFIX_COMMAND_NAME} deselect jobs`] = () => {
                    const props = data.hasOwnProperty('props') ? data.props : data.component.props;
                    if(props.allChecked){
                        props.checkAllSchedules()
                    }
                };
            }
            if(typeof data.component.startSelectedSchedules === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} start jobs`] = () => {data.component.startSelectedSchedules()};
            }
            if(typeof data.component.enableSelectedSchedules === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} enable jobs`] = () => {data.component.enableSelectedSchedules()};
            }
            if(typeof data.component.disableSelectedSchedules === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} disable jobs`] = () => {data.component.disableSelectedSchedules()};
            }
            if(typeof data.component.deleteSelectedSchedules === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} delete jobs`] = () => {data.component.deleteSelectedSchedules()};
            }
            if(typeof props.checkOneSchedule === 'function' && state.currentSchedules){
                for(let i = 0; i < state.currentSchedules.length; i++){
                    navigationCommands[`${PREFIX_COMMAND_NAME} select ${state.currentSchedules[i].title} job`] = () => {
                        const props = data.hasOwnProperty('props') ? data.props : data.component.props;
                        const state = data.hasOwnProperty('state') ? data.state : data.component.state;
                        if(props.checks.findIndex(c => c.id === state.currentSchedules[i].schedulerId && c.value) === -1) {
                            props.checkOneSchedule(null, {key: i, id: state.currentSchedules[i].schedulerId});
                        }
                    };
                    navigationCommands[`${PREFIX_COMMAND_NAME} deselect ${state.currentSchedules[i].title} job`] = () => {
                        const props = data.hasOwnProperty('props') ? data.props : data.component.props;
                        const state = data.hasOwnProperty('state') ? data.state : data.component.state;
                        if(props.checks.findIndex(c => c.id === state.currentSchedules[i].schedulerId && c.value) !== -1) {
                            props.checkOneSchedule(null, {key: i, id: state.currentSchedules[i].schedulerId});
                        }
                    };
                }
            }
            if(typeof data.component.manageScheduleStatus === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} enable ${props.schedule.title} job`] = () => {
                    const props = data.hasOwnProperty('props') ? data.props : data.component.props;
                    if(!props.schedule.status) {
                        data.component.manageScheduleStatus()
                    }
                };
                navigationCommands[`${PREFIX_COMMAND_NAME} disable ${props.schedule.title} job`] = () => {
                    const props = data.hasOwnProperty('props') ? data.props : data.component.props;
                    if(props.schedule.status) {
                        data.component.manageScheduleStatus()
                    }
                };
            }
            if(typeof data.component.addWebHook === 'function' && typeof data.component.deleteWebHook === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} create webhook for ${props.schedule.title} job`] = () => {
                    const props = data.hasOwnProperty('props') ? data.props : data.component.props;
                    if(props.schedule.getWebhookUrl() === '') {
                        data.component.addWebHook()
                    }
                };
                navigationCommands[`${PREFIX_COMMAND_NAME} delete webhook of ${props.schedule.title} job`] = () => {
                    const props = data.hasOwnProperty('props') ? data.props : data.component.props;
                    if(props.schedule.getWebhookUrl() !== '') {
                        data.component.deleteWebHook()
                    }
                };
            }
            if(typeof data.component.copyWebHookToClipboard === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} copy webhook of ${props.schedule.title} job`] = () => {data.component.copyWebHookToClipboard()};
            }
            if(typeof data.component.toggleConfirmDelete === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} delete ${props.schedule.title} job`] = () => {data.component.toggleConfirmDelete()};
            }
            if(typeof data.component.triggerSchedule === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} start ${props.schedule.title} job`] = () => {data.component.triggerSchedule()};
            }
            if(typeof data.component.toggleUpdateSchedule === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} update ${props.schedule.title} job`] = () => {
                    const state = data.hasOwnProperty('state') ? data.state : data.component.state;
                    if(!state.showUpdateSchedule) {
                        data.component.toggleUpdateSchedule();
                    }
                };
            }
            if(typeof data.component.fetchNotifications === 'function' && typeof data.component.closeNotificationList === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} notifications of ${props.schedule.title} job`] = () => {
                    const state = data.hasOwnProperty('state') ? data.state : data.component.state;
                    if(!state.showScheduleNotifications) {
                        data.component.fetchNotifications();
                    }
                };
                navigationCommands[`${PREFIX_COMMAND_NAME} close notifications`] = () => {
                    const state = data.hasOwnProperty('state') ? data.state : data.component.state;
                    if(state.showScheduleNotifications) {
                        data.component.closeNotificationList();
                    }
                };
            }
            if(typeof data.component.toggleAddNotificationDialog === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} add notification`] = () => {data.component.toggleAddNotificationDialog()};
            }
            if(typeof data.component.fetchNotification === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} update ${props.notification.name} notification`] = () => {
                    const state = data.hasOwnProperty('state') ? data.state : data.component.state;
                    if(!state.showUpdateNotificationDialog){
                        data.component.fetchNotification()
                    }
                };
            }
            if(typeof data.component.toggleDeleteNotificationConfirmation === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} delete ${props.notification.name} notification`] = () => {
                    const state = data.hasOwnProperty('state') ? data.state : data.component.state;
                    if(!state.showDeleteNotificationConfirmation) {
                        data.component.toggleDeleteNotificationConfirmation()
                    }
                };
            }
        }
        return {
            ...navigationCommands,
        };
    }

    static getCommandsNames(data){
        const commands = this.getCommands(data);
        return Object.keys(commands).map(key => key);
    }
}

export default CScheduleControl;