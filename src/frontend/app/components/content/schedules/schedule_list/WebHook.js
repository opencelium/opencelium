/*
 * Copyright (C) <2019>  <becon GmbH>
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
import {getThemeClass, copyStringToClipboard} from "../../../../utils/app";

import styles from '../../../../themes/default/content/schedules/schedules.scss';
import TooltipText from "../../../general/basic_components/tooltips/TooltipText";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {copyToClipboardWebHookFulfilled} from "../../../../actions/webhooks/fetch";
import TooltipFontIcon from "../../../general/basic_components/tooltips/TooltipFontIcon";


function mapStateToProps(state){
    const auth = state.get('auth');
    return{
        authUser: auth.get('authUser'),
    };
}

/**
 * WebHook Component
 */
@connect(mapStateToProps, {copyToClipboardWebHookFulfilled})
@withTranslation('schedules')
class WebHook extends Component{

    constructor(props){
        super(props);
    }

    /**
     * to copy url to clipboard
     */
    copyToClipboard(){
        const {copyToClipboardWebHookFulfilled, schedule} = this.props;
        copyStringToClipboard(schedule.getWebhookUrl());
        copyToClipboardWebHookFulfilled();
    }
    
    render(){
        const {authUser, t, schedule} = this.props;
        let url = schedule.getWebhookUrl();
        if(url === ''){
            return null;
        }
        let classNames = ['webhook', 'webhook_url'];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <div className={styles[classNames.webhook]}>
                <TooltipFontIcon value={'file_copy'} tooltip={t('LIST.WEBHOOK_TOOLTIP')} onClick={::this.copyToClipboard} className={styles[classNames.webhook_url]}/>
            </div>
        );
    }
}

WebHook.propTypes = {
    schedule: PropTypes.object.isRequired,
};

export default WebHook;