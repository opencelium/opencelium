/*
 * Copyright (C) <2020>  <becon GmbH>
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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {withTranslation} from "react-i18next";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import {getThemeClass, setFocusById} from "@utils/app";
import Dialog from "@basic_components/Dialog";
import NotificationChange from "./NotificationChange";
import {addScheduleNotification} from "@actions/schedules/add";
import CNotification from "@classes/components/content/schedule/notification/CNotification";
import NotificationListItem from "./NotificationListItem";
import Input from "@basic_components/inputs/Input";
import {validateChangeNotification} from "@validations/schedules";
import ValidationMessage from "@change_component/ValidationMessage";

import styles from '@themes/default/content/schedules/schedules.scss';
import {API_REQUEST_STATE} from "@utils/constants/app";
import Loading from "@loading";


function mapStateToProps(state){
    const auth = state.get('auth');
    const schedules = state.get('schedules');
    return {
        authUser: auth.get('authUser'),
        addingScheduleNotification: schedules.get('addingScheduleNotification'),
    };
}

/**
 * List of Notifications of Schedule
 */
@connect(mapStateToProps, {addScheduleNotification})
@withTranslation(['schedules', 'app'])
class NotificationList extends Component{

    constructor(props){
        super(props);
        this.state = {
            newNotification: CNotification.createNotification(),
            showAddDialog: false,
            searchValue: '',
            validationMessage: '',
            startAddingNotification: false,
        };
    }

    componentDidMount(){
        setFocusById('notification_search_input', 300);
    }

    componentDidUpdate(){
        const {addingScheduleNotification} = this.props;
        const {startAddingNotification} = this.state;
        if(startAddingNotification && addingScheduleNotification !== API_REQUEST_STATE.START) {
            this.setState({
                startAddingNotification: false,
            });
        }
    }

    /**
     * to change new notification
     */
    changeNewNotification(newNotification){
        this.setState({
            newNotification,
            validationMessage: '',
        });
    }

    /**
     * to show/hide schedule add notification dialog
     */
    toggleAddDialog(){
        this.setState({
            newNotification: CNotification.createNotification(),
            showAddDialog: !this.state.showAddDialog,
        });
    }

    /**
     * to add new notification
     */
    addNotification(){
        const {newNotification, showAddDialog} = this.state;
        const {t, addScheduleNotification, schedule} = this.props;
        let notification = newNotification.getObject();
        const validateResult = validateChangeNotification(notification);
        if(validateResult.success) {
            this.setState({
                startAddingNotification: true,
                newNotification: CNotification.createNotification(),
                showAddDialog: !showAddDialog,
            });
            addScheduleNotification({...notification, schedulerId: schedule.id});
        } else{
            setFocusById(validateResult.id);
            this.setState({
                validationMessage: t(`schedules:NOTIFICATION.VALIDATION.${validateResult.message}`),
            });
        }
    }

    /**
     * to change value in search input
     */
    changeSearchValue(searchValue){
        this.setState({
            searchValue,
        });
    }

    /**
     * to press a key in search input
     */
    pressSearchValueKey(e) {
        const {closeNotificationList} = this.props;
        switch (e.keyCode) {
            case 27:
                e.preventDefault();
                closeNotificationList();
                break;
        }
    }

    /**
     * to get notifications applying search
     */
    getNotifications(){
        const searchValue = this.state.searchValue.toLowerCase();
        const {notifications} = this.props;
        if(searchValue !== ''){
            return notifications.filter(notification => notification.name.toLowerCase().includes(searchValue) || notification.eventType.includes(searchValue) || notification.notificationType.includes(searchValue));
        }
        return notifications;
    }

    renderSearchInput(){
        const {searchValue} = this.state;
        const {authUser, t, notifications} = this.props;
        if(notifications.length === 0){
            return null;
        }
        let classNames = [
            'search_input',
            'search_input_element',
            'search_input_label',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        return(
            <Input
                onChange={::this.changeSearchValue}
                onKeyDown={::this.pressSearchValueKey}
                name={'notification_search_input'}
                id={'notification_search_input'}
                placeholder={t('schedules:NOTIFICATION.SEARCH_PLACEHOLDER')}
                label={''}
                type={'text'}
                value={searchValue}
                theme={{
                    input: `${styles[classNames.search_input]}`,
                    inputElement: styles[classNames.search_input_element],
                    label: styles[classNames.search_input_label],
                }}
            />
        );
    }

    renderNotifications(){
        const {authUser, t, notifications, schedule} = this.props;
        let classNames = [
            'empty_list',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        if(notifications.length === 0){
            return <span className={styles[classNames.empty_list]}>{t('schedules:NOTIFICATION.EMPTY')}</span>;
        }
        const filteredNotifications = this.getNotifications();
        return filteredNotifications.map((notification, key) => {
            return (
                <NotificationListItem schedule={schedule} notification={notification} index={key}/>
            );
        });
    }

    render(){
        const {showAddDialog, newNotification, validationMessage, startAddingNotification} = this.state;
        const {authUser, t, closeNotificationList, listStyles} = this.props;
        let classNames = [
            'notification_list',
            'notification_add_button',
            'notification_dialog_body',
            'items',
            'add_icon',
            'close_icon',
            'loading_add',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        return(
            <div className={styles[classNames.notification_list]} style={{...listStyles}}>
                <div>
                    {this.renderSearchInput()}
                </div>
                <div className={styles[classNames.items]}>
                    {this.renderNotifications()}
                </div>
                <TooltipFontIcon
                    size={18}
                    blueTheme={true}
                    isButton={true}
                    tooltip={t('schedules:NOTIFICATION.ADD_ICON_TOOLTIP')}
                    value={startAddingNotification ? <Loading className={styles[classNames.loading_add]}/> : 'add'}
                    onClick={::this.toggleAddDialog}
                    className={styles[classNames.add_icon]}
                />
                <TooltipFontIcon
                    size={18}
                    blueTheme={true}
                    isButton={true}
                    tooltip={t('schedules:NOTIFICATION.CLOSE_ICON_TOOLTIP')}
                    value={'close'}
                    onClick={closeNotificationList}
                    className={styles[classNames.close_icon]}
                />
                <Dialog
                    actions={[{label: t('schedules:NOTIFICATION.ADD_DIALOG.ADD'), onClick: ::this.addNotification, id: 'schedule_notification_add_ok'},{label: t('schedules:NOTIFICATION.ADD_DIALOG.CANCEL'), onClick: ::this.toggleAddDialog, id: 'schedule_notification_add_cancel'}]}
                    active={showAddDialog}
                    toggle={::this.toggleAddDialog}
                    title={t('schedules:NOTIFICATION.ADD_DIALOG.TITLE')}
                    theme={{dialog: styles.notification_dialog}}
                >
                    <NotificationChange notification={newNotification} changeNotification={::this.changeNewNotification}/>
                    <ValidationMessage message={validationMessage}/>
                </Dialog>
            </div>
        );
    }
}

NotificationList.propTypes = {
    schedule: PropTypes.object.isRequired,
    notifications: PropTypes.array.isRequired,
    closeNotificationList: PropTypes.func.isRequired,
    listStyles: PropTypes.object,
};

NotificationList.defaultProps = {
    listStyles: {},
};

export default NotificationList;