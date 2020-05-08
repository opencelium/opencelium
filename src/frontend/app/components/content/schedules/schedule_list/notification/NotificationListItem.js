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
import styles from "../../../../../themes/default/content/schedules/schedules.scss";
import TooltipFontIcon from "../../../../general/basic_components/tooltips/TooltipFontIcon";
import CNotification from "../../../../../classes/components/content/schedule/CNotification";
import {getThemeClass} from "../../../../../utils/app";
import {connect} from "react-redux";
import {updateScheduleNotification} from "../../../../../actions/schedules/update";
import {deleteScheduleNotification} from "../../../../../actions/schedules/delete";
import {withTranslation} from "react-i18next";
import Dialog from "../../../../general/basic_components/Dialog";
import NotificationChange from "./NotificationChange";
import Table from "../../../../general/basic_components/table/Table";
import Confirmation from "../../../../general/app/Confirmation";


function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}
@connect(mapStateToProps, {updateScheduleNotification, deleteScheduleNotification})
@withTranslation(['schedules', 'app'])
class NotificationListItem extends Component{

    constructor(props){
        super(props);
        this.state = {
            notification: CNotification.createNotification(),
            isMouseOverItem: false,
            showUpdateDialog: false,
            showDeleteConfirmation: false,
        };
    }

    changeNotification(notification){
        this.setState({notification});
    }

    mouseOver(){
        this.setState({isMouseOverItem: true});
    }

    mouseLeave(){
        this.setState({isMouseOverItem: false});
    }

    /**
     * to show/hide update notification dialog
     */
    toggleUpdateDialog(){
        this.setState({showUpdateDialog: !this.state.showUpdateDialog});
    }

    /**
     * to show/hide delete confirmation dialog
     */
    toggleDeleteConfirmation(){
        this.setState({showDeleteConfirmation: !this.state.showDeleteConfirmation});
    }

    openUpdate(e, notification){
        this.setState({
            notification: CNotification.duplicateNotification(notification),
            showUpdateDialog: true,
        });
    }

    updateNotification(){
        const {notification} = this.state;
        const {updateScheduleNotification} = this.props;
        updateScheduleNotification(notification);
    }

    deleteNotification(){
        const {notification} = this.state;
        const {deleteScheduleNotification} = this.props;
        deleteScheduleNotification(notification);
    }

    renderUpdateDialog(){
        const {showUpdateDialog, notification} = this.state;
        return(
            <Dialog
                actions={[{label: 'Update', onClick: ::this.updateNotification, id: 'schedule_notification_add_ok'},{label: 'Cancel', onClick: ::this.toggleUpdateDialog, id: 'schedule_notification_add_cancel'}]}
                active={showUpdateDialog}
                onEscKeyDown={::this.toggleUpdateDialog}
                onOverlayClick={::this.toggleUpdateDialog}
                title={'Update Notification'}
            >
                <NotificationChange mode={'update'} notification={notification} changeNotification={::this.changeNotification}/>
            </Dialog>
        );
    }

    renderDeleteConfirmationDialog(){
        const {showDeleteConfirmation} = this.state;
        const {t} = this.props;
        return(
            <Confirmation
                okClick={::this.deleteNotification}
                cancelClick={::this.toggleDeleteConfirmation}
                active={showDeleteConfirmation}
                title={t('app:LIST.CARD.CONFIRMATION_TITLE')}
                message={t('app:LIST.CARD.CONFIRMATION_MESSAGE')}
            />
        );
    }

    render(){
        const {isMouseOverItem} = this.state;
        const {authUser, t, notification, index} = this.props;
        let classNames = ['item', 'action'];
        classNames = getThemeClass({classNames, authUser, styles});
        let itemStyles = {};
        if(isMouseOverItem){
            itemStyles.width = '145px';
            itemStyles.background = '#DEEBFF';
        } else{
            itemStyles.width = '100%';
            itemStyles.background = 'none';
        }
        return (
            <div onMouseOver={::this.mouseOver} onMouseLeave={::this.mouseLeave}>
                <div key={notification.id} style={itemStyles} className={styles[classNames.item]} title={notification.name}>
                    {notification.name}
                </div>
                {
                    isMouseOverItem
                    ?
                        <React.Fragment>
                            <span className={styles[classNames.action]}>
                                <TooltipFontIcon
                                    id={`schedule_notification_update_${index}`}
                                    value={'edit'}
                                    tooltip={t('NOTIFICATION.UPDATE')}
                                    onClick={(e) => ::this.openUpdate(e, notification)}
                                />
                            </span>
                            <span className={styles[classNames.action]}>
                                <TooltipFontIcon
                                    id={`schedule_notification_delete_${index}`}
                                    value={'delete'}
                                    tooltip={t('NOTIFICATION.DELETE')}
                                    onClick={::this.toggleDeleteConfirmation}
                                />
                            </span>
                        </React.Fragment>
                    :
                        null
                }
                {::this.renderUpdateDialog()}
                {::this.renderDeleteConfirmationDialog()}
            </div>
        );
    }
}

NotificationListItem.propTypes = {
    notification: PropTypes.instanceOf(CNotification).isRequired,
};

export default NotificationListItem;