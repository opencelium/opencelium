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
import {getThemeClass} from "@utils/app";

import styles from '@themes/default/content/schedules/schedules.scss';


function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}

/**
 * Recipient Item for Notification Change Component
 */
@connect(mapStateToProps, {})
@withTranslation('schedules')
class Recipient extends Component{

    constructor(props){
        super(props);
        const {authUser} = props;
        let classNames = [
            'recipient_appear',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        this.state = {
            recipientClassName: styles[classNames.recipient_appear],
        };
    }

    /**
     * to click on recipient
     */
    onClick(recipient){
        const {authUser, onClick} = this.props;
        let classNames = [
            'recipient_disappear',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        this.setState({
            recipientClassName: styles[classNames.recipient_disappear]
        });
        setTimeout(() => onClick(recipient), 200);
    }

    render(){
        const {recipientClassName} = this.state;
        const {authUser, recipient, icon, tooltip} = this.props;
        let classNames = [
            'notification_recipient',
            'icon',
            'title',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        const title = `${recipient}`;
        return (
            <li className={`${styles[classNames.notification_recipient]} ${recipientClassName}`}>
                <TooltipFontIcon className={styles[classNames.icon]} value={icon} tooltip={tooltip} onClick={() => ::this.onClick(recipient)}/>
                <span className={styles[classNames.title]} title={title}>
                    {title}
                </span>
            </li>
        );
    }
}

Recipient.propTypes = {
    recipient: PropTypes.object.isRequired,
    icon: PropTypes.string.isRequired,
    tooltip: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
};

export default Recipient;