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
import {permission} from "../../../../../decorators/permission";
import {SchedulePermissions} from "../../../../../utils/constants/permissions";
import TooltipFontIcon from "../../../../general/basic_components/tooltips/TooltipFontIcon";
import {getThemeClass} from "../../../../../utils/app";
import styles from '../../../../../themes/default/content/schedules/schedules.scss';
import Dialog from "../../../../general/basic_components/Dialog";
import NotificationList from "./NotificationList";
import Button from "../../../../general/basic_components/buttons/Button";
import NotificationChange from "./NotificationChange";
import CNotification from "../../../../../classes/components/content/schedule/CNotification";
import {addScheduleNotification} from "../../../../../actions/schedules/add";


function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}

/**
 * Component to set notification for schedule
 */
@connect(mapStateToProps, {addScheduleNotification})
@permission(SchedulePermissions.UPDATE, false)
@withTranslation('schedules')
class ScheduleNotification extends Component{

    constructor(props){
        super(props);

        this.state = {
            newNotification: CNotification.createNotification(),
            showScheduleNotification: false,
            showAddDialog: false,
        };
    }

    changeNewNotification(newNotification){
        this.setState({newNotification});
    }

    /**
     * to show/hide schedule notification
     */
    toggleScheduleNotification(){
        this.setState({showScheduleNotification: !this.state.showScheduleNotification});
    }

    /**
     * to show/hide schedule add notification dialog
     */
    toggleAddDialog(){
        this.setState({
            newNotification: CNotification.createNotification(),
            showAddDialog: !this.state.showAddDialog},
        );
    }

    addNotification(){
        const {newNotification} = this.state;
        const {addScheduleNotification} = this.props;
        addScheduleNotification(newNotification);
    }

    renderDialogScheduleNotification(){
        const {showScheduleNotification, showAddDialog, newNotification} = this.state;
        const {authUser, schedule} = this.props;
        let classNames = ['notification_add_button', 'notification_dialog_body'];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <Dialog
                actions={[{label: 'Ok', onClick: ::this.toggleScheduleNotification, id: 'schedule_notification_ok'}]}
                active={showScheduleNotification}
                onEscKeyDown={::this.toggleScheduleNotification}
                onOverlayClick={::this.toggleScheduleNotification}
                title={'Notifications'}
                theme={{body: styles[classNames.notification_dialog_body]}}
            >
                <NotificationList schedule={schedule}/>
                <Button authUser={authUser} title={'Add notification'} icon={'add'} onClick={::this.toggleAddDialog} className={styles[classNames.notification_add_button]}/>
                <Dialog
                    actions={[{label: 'Add', onClick: ::this.addNotification, id: 'schedule_notification_add_ok'},{label: 'Cancel', onClick: ::this.toggleAddDialog, id: 'schedule_notification_add_cancel'}]}
                    active={showAddDialog}
                    onEscKeyDown={::this.toggleAddDialog}
                    onOverlayClick={::this.toggleAddDialog}
                    title={'Add Notification'}
                >
                    <NotificationChange notification={newNotification} changeNotification={::this.changeNewNotification}/>
                </Dialog>
            </Dialog>
        );
    }

    render(){
        const {t, authUser, index} = this.props;
        let classNames = ['schedule_list_action'];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <span className={styles[classNames.schedule_list_action]}>
                <TooltipFontIcon
                    id={`schedule_update_${index}`}
                    value={'mail'}
                    tooltip={t('LIST.TOOLTIP_NOTIFICATION_ICON')}
                    onClick={::this.toggleScheduleNotification}
                />
                {this.renderDialogScheduleNotification()}
            </span>
        );
    }
}

ScheduleNotification.propTypes = {
    schedule: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
};

export default ScheduleNotification;