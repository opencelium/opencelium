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
import { Row, Col } from "react-grid-system";
import Input from "@basic_components/inputs/Input";
import CNotification from "@classes/components/content/schedule/notification/CNotification";
import {getThemeClass} from "@utils/app";
import Recipient from "./Recipient";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import {fetchNotificationRecipients} from "@actions/schedules/fetch";
import Loading from "@loading";
import {API_REQUEST_STATE} from "@utils/constants/app";

import styles from "@themes/default/content/schedules/schedules.scss";
import ToolboxThemeInput from "../../../../../../hocs/ToolboxThemeInput";


const RECIPIENTS_LIMIT = 3;

function mapStateToProps(state){
    const auth = state.get('auth');
    const schedules = state.get('schedules');
    return {
        authUser: auth.get('authUser'),
        allUsers: schedules.get('targetGroup').toJS(),
        fetchingNotificationTargetGroup: schedules.get('fetchingNotificationTargetGroup'),
    };
}

/**
 * Recipients Input for TargetGroup Component
 */
@connect(mapStateToProps, {fetchNotificationRecipients})
@withTranslation('schedules')
class RecipientsInput extends Component{

    constructor(props){
        super(props);

        this.state = {
            selectedRecipientsIterator: 1,
            searchValueForSelectedRecipients: '',
            restRecipientsIterator: 1,
            searchValueForRestRecipients: '',
            focused: false,
            startFetchingRecipients: true,
        };
    }

    componentDidMount(){
        this.props.fetchNotificationRecipients();
    }

    componentDidUpdate(){
        if(this.state.startFetchingRecipients && this.props.fetchingNotificationTargetGroup !== API_REQUEST_STATE.START){
            this.setState({
                startFetchingRecipients: false,
            });
        }
    }

    /**
     * to focus on search inputs
     */
    focusSearchInputs(){
        this.setState({focused: true});
    }

    /**
     * to blur from search inputs
     */
    blurSearchInputs(){
        this.setState({focused: false});
    }

    /**
     * to open next recipients
     */
    increaseIterator(selectedRecipientsIterator){
        this.setState({[selectedRecipientsIterator]: this.state[selectedRecipientsIterator] + 1});
    }

    /**
     * to open previous recipients
     */
    decreaseIterator(selectedRecipientsIterator){
        this.setState({[selectedRecipientsIterator]: this.state[selectedRecipientsIterator] - 1});
    }

    /**
     * to change search value for selected recipients
     */
    onChangeSearchValueForSelectedRecipients(searchValueForSelectedRecipients){
        this.setState({searchValueForSelectedRecipients, selectedRecipientsIterator: 1});
    }

    /**
     * to change search value for rest recipients
     */
    onChangeSearchValueForRestRecipients(searchValueForRestRecipients){
        this.setState({searchValueForRestRecipients, restRecipientsIterator: 1});
    }

    /**
     * to add recipient
     */
    onAddRecipient(recipient){
        let {restRecipientsIterator} = this.state;
        let {notification} = this.props;
        const {changeNotification} = this.props;
        notification.targetGroup.addRecipient(recipient);
        changeNotification(notification);

        const restRecipients = this.getRestRecipients();
        const currentRestRecipients = this.getCurrentRestRecipients(restRecipients);
        if(currentRestRecipients.length === 0 && restRecipientsIterator > 1){
            restRecipientsIterator--;
        }
        this.setState({
            restRecipientsIterator,
        })
    }

    /**
     * to remove recipient
     */
    onRemoveRecipient(recipient){
        let {selectedRecipientsIterator} = this.state;
        let {notification} = this.props;
        const {changeNotification} = this.props;
        notification.targetGroup.deleteRecipient(recipient);
        changeNotification(notification);

        const selectedRecipients = this.getSelectedRecipients();
        const currentSelectedRecipients = this.getCurrentSelectedRecipients(selectedRecipients);
        if(currentSelectedRecipients.length === 0 && selectedRecipientsIterator > 1){
            selectedRecipientsIterator--;
        }
        this.setState({
            selectedRecipientsIterator,
        })
    }

    /**
     * to get selected recipients
     */
    getSelectedRecipients(){
        const {searchValueForSelectedRecipients} = this.state;
        const {notification} = this.props;
        const searchValue = searchValueForSelectedRecipients.toLowerCase();
        const recipients = notification.targetGroup.recipients;
        let result = [];
        if(searchValue === ''){
            result = recipients;
        } else {
            //using search
            for (let i = 0; i < recipients.length; i++) {
                if (recipients[i].toLowerCase().includes(searchValue)) {
                    result.push(recipients[i]);
                }
            }
        }
        return result;
    }

    /**
     * to get current selected limited recipients
     */
    getCurrentSelectedRecipients(recipients){
        const {selectedRecipientsIterator} = this.state;
        recipients = recipients.length === 0 ? this.getSelectedRecipients() : recipients;
        //filter by navigation
        recipients = recipients.slice((selectedRecipientsIterator - 1) * RECIPIENTS_LIMIT, (selectedRecipientsIterator - 1) * RECIPIENTS_LIMIT + RECIPIENTS_LIMIT);
        return recipients;
    }

    /**
     * to get rest recipients
     */
    getRestRecipients(){
        const {searchValueForRestRecipients} = this.state;
        const {authUser, notification, allUsers} = this.props;
        const searchValue = searchValueForRestRecipients.toLowerCase();
        const allRecipients = notification.targetGroup.recipients;
        //except selected users
        let recipients = allRecipients.length !== 0 ? allUsers.filter(user => allRecipients.findIndex(recipientEmail => recipientEmail === user.email) === -1) : allUsers;
        //except current user
        //recipients = recipients.filter(user => user.userId !== authUser.userId);
        let result = [];
        if(searchValue === ''){
            result = recipients.map(r => r.email);
        } else {
            //using search
            for (let i = 0; i < recipients.length; i++) {
                if (recipients[i].email.toLowerCase().includes(searchValue)) {
                    result.push(recipients[i].email);
                }
            }
        }
        return result;
    }

    /**
     * to get current rest limited recipients
     */
    getCurrentRestRecipients(recipients = []){
        const {restRecipientsIterator} = this.state;
        recipients = recipients.length === 0 ? this.getRestRecipients() : recipients;
        //filter by navigation
        recipients = recipients.slice((restRecipientsIterator - 1) * RECIPIENTS_LIMIT, (restRecipientsIterator - 1) * RECIPIENTS_LIMIT + RECIPIENTS_LIMIT);
        return recipients;
    }

    renderSelectedRecipients(recipients){
        return this.renderRecipients(recipients, 'left');
    }

    renderRestRecipients(recipients){
        return this.renderRecipients(recipients, 'right');
    }

    renderRecipients(recipients, side){
        const {searchValueForSelectedRecipients, searchValueForRestRecipients} = this.state;
        const {t, authUser} = this.props;
        let classNames = [
            'notification_recipients',
            'notification_recipients_alert_message',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        if(recipients.length === 0){
            let alertMessage = side === 'left' ? t('NOTIFICATION.NOTIFICATION_CHANGE.RECIPIENTS.NO_SELECTED_RECIPIENTS') : t('NOTIFICATION.NOTIFICATION_CHANGE.RECIPIENTS.NO_REST_RECIPIENTS');
            if(side === 'left' && searchValueForSelectedRecipients !== '' || side === 'right' && searchValueForRestRecipients !== ''){
                alertMessage = t('NOTIFICATION.NOTIFICATION_CHANGE.RECIPIENTS.NONE_FOUND');
            }
            return <div className={styles[classNames.notification_recipients_alert_message]}>{alertMessage}</div>;
        }
        let icon = '';
        let tooltip = '';
        let onClick = null;
        switch(side){
            case 'left':
                icon = 'remove';
                tooltip = t('NOTIFICATION.NOTIFICATION_CHANGE.RECIPIENTS.REMOVE_ICON_TOOLTIP');
                onClick = ::this.onRemoveRecipient;
                break;
            case 'right':
                icon = 'add';
                tooltip = t('NOTIFICATION.NOTIFICATION_CHANGE.RECIPIENTS.ADD_ICON_TOOLTIP');
                onClick = ::this.onAddRecipient;
                break;
        }
        return(
            <ul className={styles[classNames.notification_recipients]}>
                {
                    recipients.map(recipient => {
                        return (
                            <Recipient
                                key={recipient}
                                recipient={recipient}
                                icon={icon}
                                tooltip={tooltip}
                                onClick={onClick}
                            />
                        );
                    })
                }
            </ul>
        );
    }

    renderNavigation(type, recipients){
        if(recipients.length <= RECIPIENTS_LIMIT){
            return null;
        }
        const {selectedRecipientsIterator, restRecipientsIterator} = this.state;
        const {t, authUser} = this.props;
        let iterator = '';
        let iteratorName = '';
        switch (type) {
            case 'selected':
                iterator = selectedRecipientsIterator;
                iteratorName = 'selectedRecipientsIterator';
                break;
            case 'rest':
                iterator = restRecipientsIterator;
                iteratorName = 'restRecipientsIterator';
                break;
        }
        let classNames = [
            'notifications_arrows',
            'notifications_arrow_disable',
            'notifications_arrow_prev',
            'notifications_arrow_next',
            'recipients_before',
            'recipients_after',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        const isPrevDisable = (iterator - 1) * RECIPIENTS_LIMIT <= 0;
        const isNextDisable = iterator * RECIPIENTS_LIMIT >= recipients.length;
        return(
            <React.Fragment>
                {!isPrevDisable && <div className={styles[classNames.recipients_before]} title={t('NOTIFICATION.NOTIFICATION_CHANGE.RECIPIENTS.MORE_ICON_TOOLTIP')}>...</div>}
                <div className={styles[classNames.notifications_arrows]}>
                    <TooltipFontIcon tooltip={t('NOTIFICATION.NOTIFICATION_CHANGE.RECIPIENTS.PREVIOUS_ICON_TOOLTIP')} value={'keyboard_arrow_up'} onClick={isPrevDisable ? null : () => ::this.decreaseIterator(iteratorName)}
                                     className={`${styles[classNames.notifications_arrow_prev]} ${isPrevDisable ? styles[classNames.notifications_arrow_disable] : ''}`}/>
                    <TooltipFontIcon tooltip={t('NOTIFICATION.NOTIFICATION_CHANGE.RECIPIENTS.NEXT_ICON_TOOLTIP')} value={'keyboard_arrow_down'} onClick={isNextDisable ? null : () => ::this.increaseIterator(iteratorName)}
                                     className={`${styles[classNames.notifications_arrow_next]} ${isNextDisable ? styles[classNames.notifications_arrow_disable] : ''}`}/>
                </div>
                {!isNextDisable && <div className={styles[classNames.recipients_after]} title={t('NOTIFICATION.NOTIFICATION_CHANGE.RECIPIENTS.MORE_ICON_TOOLTIP')}>...</div>}
            </React.Fragment>
        );
    }

    renderLabel(){
        const {focused} = this.state;
        const {t, authUser} = this.props;
        let classNames = [
            'notification_select_focused',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        return(
            <span className={`${focused ? styles[classNames.notification_select_focused] : ''}`}>{t('NOTIFICATION.NOTIFICATION_CHANGE.RECIPIENTS.LABEL')}</span>
        );
    }

    render(){
        const {focused, searchValueForSelectedRecipients, searchValueForRestRecipients, startFetchingRecipients} = this.state;
        const {t, authUser} = this.props;
        let classNames = [
            'notification_input_appear',
            'notification_change_event_type',
            'label',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        const selectedRecipients = this.getSelectedRecipients();
        const currentSelectedRecipients = this.getCurrentSelectedRecipients(selectedRecipients);
        const restRecipients = this.getRestRecipients();
        const currentRestRecipients = this.getCurrentRestRecipients(restRecipients);
        return (
            <ToolboxThemeInput
                className={`${styles[classNames.notification_change_event_type]} ${styles[classNames.notification_input_appear]}`}
                label={::this.renderLabel()}
                icon={'group'}
                iconClassName={focused ? styles[classNames.notification_select_focused] : ''}
            >
                <Row>
                    <Col md={6}>
                        {this.renderNavigation('rest', restRecipients)}
                        {
                            startFetchingRecipients
                            ?
                                <Loading/>
                            :
                                <div>
                                    <Input
                                        name={'input_recipients_rest_search'}
                                        id={'input_recipients_rest_search'}
                                        label={t('NOTIFICATION.NOTIFICATION_CHANGE.RECIPIENTS.REST_RECIPIENTS_SEARCH_LABEL')}
                                        maxLength={256}
                                        value={searchValueForRestRecipients}
                                        onChange={::this.onChangeSearchValueForRestRecipients}
                                        onFocus={::this.focusSearchInputs}
                                        onBlur={::this.blurSearchInputs}
                                    />
                                    {this.renderRestRecipients(currentRestRecipients)}
                                </div>
                        }
                    </Col>
                    <Col md={6}>
                        {this.renderNavigation('selected', selectedRecipients)}
                        <div>
                            <Input
                                name={'input_recipients_selected_search'}
                                id={'input_recipients_selected_search'}
                                label={t('NOTIFICATION.NOTIFICATION_CHANGE.RECIPIENTS.SELECTED_RECIPIENTS_SEARCH_LABEL')}
                                maxLength={256}
                                value={searchValueForSelectedRecipients}
                                onChange={::this.onChangeSearchValueForSelectedRecipients}
                                onFocus={::this.focusSearchInputs}
                                onBlur={::this.blurSearchInputs}
                            />
                            {this.renderSelectedRecipients(currentSelectedRecipients)}
                        </div>
                    </Col>
                </Row>
            </ToolboxThemeInput>
        );
    }
}

RecipientsInput.propTypes = {
    notification: PropTypes.instanceOf(CNotification).isRequired,
    changeNotification: PropTypes.func.isRequired,
};

export default RecipientsInput;