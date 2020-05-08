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
import Input from "../../../../../general/basic_components/inputs/Input";
import CNotification from "../../../../../../classes/components/content/schedule/CNotification";
import theme from "react-toolbox/lib/input/theme.css";
import styles from "../../../../../../themes/default/content/schedules/schedules.scss";
import FontIcon from "../../../../../general/basic_components/FontIcon";
import {getThemeClass} from "../../../../../../utils/app";
import Recipient from "./Recipient";
import TooltipFontIcon from "../../../../../general/basic_components/tooltips/TooltipFontIcon";

let ALL_USERS = [
    {userId: 1, name: 'JohnJohnJohnJohnJohnJohnJohnJohnJohn', surname: 'Doe'},
    {userId: 2, name: 'Kate', surname: 'Winslet'},
    {userId: 3, name: 'Patric', surname: 'Sway'},
    {userId: 4, name: 'Jack', surname: 'Doe'},
    {userId: 5, name: 'Peter', surname: 'Winslet'},
    {userId: 6, name: 'Sabrina', surname: 'Sway'},
    {userId: 7, name: 'Susi', surname: 'Adler'},
];

const RECIPIENTS_LIMIT = 3;

function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}

/**
 * Recipients Input for Notification Change Component
 */
@connect(mapStateToProps, {})
@withTranslation('schedules')
class RecipientsInput extends Component{

    constructor(props){
        super(props);

        this.state = {
            selectedRecipientsIterator: 1,
            searchValueForSelectedRecipients: '',
            restRecipientsIterator: 1,
            searchValueForRestRecipients: '',
        };
    }

    increaseIterator(selectedRecipientsIterator){
        this.setState({[selectedRecipientsIterator]: this.state[selectedRecipientsIterator] + 1});
    }

    decreaseIterator(selectedRecipientsIterator){
        this.setState({[selectedRecipientsIterator]: this.state[selectedRecipientsIterator] - 1});
    }

    onChangeSearchValueForSelectedRecipients(searchValueForSelectedRecipients){
        this.setState({searchValueForSelectedRecipients, selectedRecipientsIterator: 1});
    }

    onChangeSearchValueForRestRecipients(searchValueForRestRecipients){
        this.setState({searchValueForRestRecipients, restRecipientsIterator: 1});
    }

    onAddRecipient(recipient){
        let {notification} = this.props;
        const {changeNotification} = this.props;
        notification.addRecipient(recipient);
        changeNotification(notification);
    }

    onRemoveRecipient(recipient){
        let {notification} = this.props;
        const {changeNotification} = this.props;
        notification.deleteRecipient(recipient);
        changeNotification(notification);
    }

    getSelectedRecipients(){
        const searchValue = this.state.searchValueForSelectedRecipients.toLowerCase();
        const recipients = this.props.notification.recipients;
        let result = [];
        if(searchValue === ''){
            result = recipients;
        } else {
            //using search
            for (let i = 0; i < recipients.length; i++) {
                const name = recipients[i].name.toLowerCase();
                const surname = recipients[i].surname.toLowerCase();
                if (name.includes(searchValue) || surname.includes(searchValue)) {
                    result.push(recipients[i]);
                }
            }
        }
        return result;
    }

    getCurrentSelectedRecipients(recipients){
        const {selectedRecipientsIterator} = this.state;
        recipients = recipients.length === 0 ? this.getSelectedRecipients() : recipients;
        //filter by navigation
        recipients = recipients.slice((selectedRecipientsIterator - 1) * RECIPIENTS_LIMIT, (selectedRecipientsIterator - 1) * RECIPIENTS_LIMIT + RECIPIENTS_LIMIT);
        return recipients;
    }

    getRestRecipients(){
        const {restRecipientsIterator} = this.state;
        const {notification} = this.props;
        const searchValue = this.state.searchValueForRestRecipients.toLowerCase();
        const recipients = notification.recipients.length !== 0 ? ALL_USERS.filter(user => notification.recipients.findIndex(recipient => recipient.userId === user.userId) === -1) : ALL_USERS;
        let result = [];
        if(searchValue === ''){
            result = recipients;
        } else {
            //using search
            for (let i = 0; i < recipients.length; i++) {
                const name = recipients[i].name.toLowerCase();
                const surname = recipients[i].surname.toLowerCase();
                if (name.includes(searchValue) || surname.includes(searchValue)) {
                    result.push(recipients[i]);
                }
            }
        }
        return result;
    }

    getCurrentRestRecipients(recipients = []){
        const {restRecipientsIterator} = this.state;
        recipients = recipients.length === 0 ? this.getRestRecipients() : recipients;
        //filter by navigation
        recipients = recipients.slice((restRecipientsIterator - 1) * RECIPIENTS_LIMIT, (restRecipientsIterator - 1) * RECIPIENTS_LIMIT + RECIPIENTS_LIMIT);
        return recipients;
    }

    renderSelectedRecipients(recipients){
        const {t, authUser} = this.props;
        let classNames = [
            'notification_recipients_alert_message',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        const {searchValueForSelectedRecipients} = this.state;
        if(recipients.length === 0){
            let alertMessage = 'There is no selected recipients';
            if(searchValueForSelectedRecipients !== ''){
                alertMessage = 'None recipients found';
            }
            return <div className={styles[classNames.notification_recipients_alert_message]}>{alertMessage}</div>;
        }
        return this.renderRecipients(recipients, 'left');
    }

    renderRestRecipients(recipients){
        const {t, authUser} = this.props;
        let classNames = [
            'notification_recipients_alert_message',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        const {searchValueForRestRecipients} = this.state;
        if(recipients.length === 0){
            let alertMessage = 'There is no rest recipients';
            if(searchValueForRestRecipients !== ''){
                alertMessage = 'None recipients found';
            }
            return <div className={styles[classNames.notification_recipients_alert_message]}>{alertMessage}</div>;
        }
        return this.renderRecipients(recipients, 'right');
    }

    renderRecipients(recipients, side){
        const {t, authUser} = this.props;
        let classNames = [
            'notification_recipients',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        let icon = '';
        let tooltip = '';
        let onClick = null;
        switch(side){
            case 'left':
                icon = 'remove';
                tooltip = 'Remove';
                onClick = ::this.onRemoveRecipient;
                break;
            case 'right':
                icon = 'add';
                tooltip = 'Add';
                onClick = ::this.onAddRecipient;
                break;
        }
        return(
            <ul className={styles[classNames.notification_recipients]}>
                {
                    recipients.map(recipient => {
                        return (
                            <Recipient key={recipient.userId} recipient={recipient} icon={icon} tooltip={tooltip} onClick={onClick}/>
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
        const {t, authUser} = this.props;
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
                {isPrevDisable ? null : <div className={styles[classNames.recipients_before]} title={'More recipients'}>...</div>}
                <div className={styles[classNames.notifications_arrows]}>
                    <TooltipFontIcon tooltip={'Previous'} value={'keyboard_arrow_up'} onClick={isPrevDisable ? null : () => ::this.decreaseIterator(iteratorName)}
                                     className={`${styles[classNames.notifications_arrow_prev]} ${isPrevDisable ? styles[classNames.notifications_arrow_disable] : ''}`}/>
                    <TooltipFontIcon tooltip={'Next'} value={'keyboard_arrow_down'} onClick={isNextDisable ? null : () => ::this.increaseIterator(iteratorName)}
                                     className={`${styles[classNames.notifications_arrow_next]} ${isNextDisable ? styles[classNames.notifications_arrow_disable] : ''}`}/>
                </div>
                {isNextDisable ? null : <div className={styles[classNames.recipients_after]} title={'More recipients'}>...</div>}
            </React.Fragment>
        );
    }

    render(){
        const {searchValueForSelectedRecipients, searchValueForRestRecipients} = this.state;
        const {t, authUser} = this.props;
        let classNames = [
            'notification_change_event_type',
            'label',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        const selectedRecipients = this.getSelectedRecipients();
        const currentSelectedRecipients = this.getCurrentSelectedRecipients(selectedRecipients);
        const restRecipients = this.getRestRecipients();
        const currentRestRecipients = this.getCurrentRestRecipients(restRecipients);
        return (
            <div className={`${theme.withIcon} ${theme.input} ${styles[classNames.notification_change_event_type]}`}>
                <div className={`${theme.inputElement} ${theme.filled} ${styles[classNames.label]}`}/>
                <Row>
                    <Col md={6}>
                        {this.renderNavigation('selected', selectedRecipients)}
                        <div>
                            <Input
                                name={'input_recipients_selected_search'}
                                id={'input_recipients_selected_search'}
                                label={'Search in selected recipients...'}
                                maxLength={256}
                                value={searchValueForSelectedRecipients}
                                onChange={::this.onChangeSearchValueForSelectedRecipients}
                            />
                            {this.renderSelectedRecipients(currentSelectedRecipients)}
                        </div>
                    </Col>
                    <Col md={6}>
                        {this.renderNavigation('rest', restRecipients)}
                        <div>
                            <Input
                                name={'input_recipients_rest_search'}
                                id={'input_recipients_rest_search'}
                                label={'Search in rest recipients...'}
                                maxLength={256}
                                value={searchValueForRestRecipients}
                                onChange={::this.onChangeSearchValueForRestRecipients}
                            />
                            {this.renderRestRecipients(currentRestRecipients)}
                        </div>
                    </Col>
                </Row>
                <FontIcon value={'group'} className={theme.icon}/>
                <span className={theme.bar}/>
                <label className={theme.label}>{'Recipients'}</label>
            </div>
        );
    }
}

RecipientsInput.propTypes = {
    notification: PropTypes.instanceOf(CNotification).isRequired,
    changeNotification: PropTypes.func.isRequired,
};

export default RecipientsInput;