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
import PropTypes from "prop-types";
import {connect} from 'react-redux';
import {withTranslation} from "react-i18next";
import {getThemeClass} from "@utils/app";
import FontIcon from "@basic_components/FontIcon";
import CNotification from "@classes/components/content/schedule/notification/CNotification";
import OCSelect from "@basic_components/inputs/Select";
import {API_REQUEST_STATE} from "@utils/constants/app";
import {fetchSlackChannels} from "@actions/schedules/fetch";
import Loading from "@loading";

import theme from "react-toolbox/lib/input/theme.css";
import styles from '@themes/default/content/schedules/schedules.scss';


function mapStateToProps(state){
    const auth = state.get('auth');
    const schedules = state.get('schedules');
    return {
        authUser: auth.get('authUser'),
        fetchingNotificationTargetGroup: schedules.get('fetchingNotificationTargetGroup'),
        allChannels: schedules.get('targetGroup'),
    };
}

/**
 * SlackChannel for TargetGroup component
 */
@connect(mapStateToProps, {fetchSlackChannels})
@withTranslation('schedules')
class SlackChannelInput extends Component{

    constructor(props){
        super(props);
        this.state = {
            focused: false,
            startFetchingChannels: true,
        };
    }

    componentDidMount(){
        this.props.fetchSlackChannels();
    }

    componentDidUpdate(){
        if(this.state.startFetchingChannels && this.props.fetchingNotificationTargetGroup !== API_REQUEST_STATE.START){
            this.setState({
                startFetchingChannels: false,
            });
        }
    }

    /**
     * to focus on select
     */
    focusChannel(){
        this.setState({focused: true});
    }

    /**
     * to blur from select
     */
    blurChannel(){
        this.setState({focused: false});
    }

    /**
     * to change select
     */
    onChangeChannel(channel){
        let {notification} = this.props;
        const {changeNotification} = this.props;
        notification.targetGroup.setChannelFromSelect(channel);
        changeNotification(notification);
    }

    render(){
        const {focused, startFetchingChannels} = this.state;
        const {authUser, t, notification, allChannels} = this.props;
        const value = notification.targetGroup.getChannelForSelect();
        let classNames = ['notification_input_appear', 'notification_select', 'notification_select_label', 'notification_select_focused', 'notification_input_loading'];
        classNames = getThemeClass({classNames, authUser, styles});
        return(
            <div className={`${styles[classNames.notification_input_appear]} ${theme.withIcon} ${theme.input}`}>
                <div className={`${theme.inputElement} ${theme.filled} ${styles[classNames.notification_select_label]}`}/>
                <OCSelect
                    id={'input_slack_channel'}
                    name={'input_slack_channel'}
                    value={value}
                    onChange={::this.onChangeChannel}
                    onFocus={::this.focusChannel}
                    onBlur={::this.blurChannel}
                    options={allChannels}
                    placeholder={t('NOTIFICATION.NOTIFICATION_CHANGE.SLACK_CHANNEL_PLACEHOLDER')}
                    className={`${styles[classNames.notification_select]}`}
                />
                {
                    startFetchingChannels
                    ?
                        <Loading className={styles[classNames.notification_input_loading]}/>
                    :
                        <FontIcon value={'add_alert'} className={`${theme.icon} ${focused ? styles[classNames.notification_select_focused] : ''}`}/>
                }
                <span className={theme.bar}/>
                <label className={`${theme.label} ${focused ? styles[classNames.notification_select_focused] : ''}`}>
                    {t('NOTIFICATION.NOTIFICATION_CHANGE.SLACK_CHANNEL_LABEL')}
                    <span className={theme.required}> *</span>
                </label>
            </div>
        );
    }
}

SlackChannelInput.propTypes = {
    notification: PropTypes.instanceOf(CNotification).isRequired,
    changeNotification: PropTypes.func.isRequired,
};

export default SlackChannelInput;