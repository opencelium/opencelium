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
import styles from '@themes/default/content/schedules/schedules.scss';
import {getThemeClass} from "@utils/app";
import FontIcon from "@basic_components/FontIcon";
import CNotification from "@classes/components/content/schedule/notification/CNotification";
import Select from "@basic_components/inputs/Select";
import {fetchScheduleNotificationTemplates} from "@actions/schedules/fetch";
import {API_REQUEST_STATE} from "@utils/constants/app";
import Loading from "@loading";
import CNotificationTemplate
    from "@classes/components/content/schedule/notification/CNotificationTemplate";


function mapStateToProps(state){
    const auth = state.get('auth');
    const schedules = state.get('schedules');
    return {
        authUser: auth.get('authUser'),
        templates: schedules.get('templates').toJS().map(template => CNotificationTemplate.createNotificationTemplate(template)),
        fetchingScheduleNotificationTemplates: schedules.get('fetchingScheduleNotificationTemplates'),
    };
}

/**
 * Template Input for Notification Change Component
 */
@connect(mapStateToProps, {fetchScheduleNotificationTemplates})
@withTranslation('schedules')
class TemplateInput extends Component{

    constructor(props){
        super(props);
        this.state = {
            focused: false,
            startFetchingTemplates: false,
            notificationType: props.notification.notificationType,
        };
    }

    componentDidMount(){
        if(this.props.notification.notificationType !== ''){
            this.fetchTemplates();
        }
    }

    componentDidUpdate(prevProps, prevState){
        const {startFetchingTemplates} = this.state;
        const {notification, fetchingScheduleNotificationTemplates} = this.props;
        if(!startFetchingTemplates && prevState.notificationType !== notification.notificationType){
            this.onChangeTemplate(null);
            this.fetchTemplates();
            this.setState({
                notificationType: notification.notificationType,
            });
        }
        if(startFetchingTemplates && fetchingScheduleNotificationTemplates !== API_REQUEST_STATE.START){
            this.setState({
                startFetchingTemplates: false,
            });
        }
    }

    /**
     * to focus on select
     */
    focusNotificationType(){
        this.setState({focused: true});
    }

    /**
     * to blur from select
     */
    blurNotificationType(){
        this.setState({focused: false});
    }

    /**
     * to change template
     */
    onChangeTemplate(template){
        let {notification} = this.props;
        const {changeNotification} = this.props;
        notification.setTemplateFromSelect(template);
        changeNotification(notification);
    }

    /**
     * to fetch all templates
     */
    fetchTemplates(){
        const {fetchScheduleNotificationTemplates, notification} = this.props;
        this.setState({
            startFetchingTemplates: true,
        });
        fetchScheduleNotificationTemplates(notification);
    }

    renderIcon(){
        const {startFetchingTemplates} = this.state;
        let icon = 'library_books';
        if(startFetchingTemplates){
            icon = 'loading';
        }
        return(
            <FontIcon value={icon}/>
        );
    }

    render(){
        const {focused} = this.state;
        const {t, authUser, notification, templates} = this.props;
        if(notification.notificationType === ''){
            return null;
        }
        const options = CNotificationTemplate.getTemplatesForSelect(templates);
        let classNames = ['notification_input_appear'];
        classNames = getThemeClass({classNames, authUser, styles});
        const value = CNotification.getTemplateForSelect(options, notification.template.id);
        return(
            <Select
                id={'input_template_type'}
                className={styles[classNames.notification_input_appear]}
                name={'input_template_type'}
                value={value}
                onChange={::this.onChangeTemplate}
                onFocus={::this.focusNotificationType}
                onBlur={::this.blurNotificationType}
                options={options}
                placeholder={t('NOTIFICATION.NOTIFICATION_CHANGE.TEMPLATE_PLACEHOLDER')}
                label={t('NOTIFICATION.NOTIFICATION_CHANGE.TEMPLATE_LABEL')}
                icon={::this.renderIcon()}
                isFocused={focused}
                required={true}
            />
        );
    }
}

TemplateInput.propTypes = {
    notification: PropTypes.instanceOf(CNotification).isRequired,
    changeNotification: PropTypes.func.isRequired,
};

export default TemplateInput;