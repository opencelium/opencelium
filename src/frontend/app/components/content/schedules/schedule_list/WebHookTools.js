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
import TooltipFontIcon from "../../../general/basic_components/tooltips/TooltipFontIcon";
import {addWebHook} from "../../../../actions/webhooks/add";
import {deleteWebHook} from "../../../../actions/webhooks/delete";
import styles from '../../../../themes/default/content/schedules/schedules.scss';
import {formatHtmlId, getThemeClass} from "../../../../utils/app";
import {connect} from "react-redux";
import Loading from "../../../general/app/Loading";


function mapStateToProps(state){
    const auth = state.get('auth');
    const schedules = state.get('schedules');
    return {
        authUser: auth.get('authUser'),
        stateSchedule: schedules.get('schedule'),
        addingWebHook: schedules.get('addingWebHook'),
        deletingWebHook: schedules.get('deletingWebHook'),
    };
}


/**
 * WebHookTools Component
 */
@connect(mapStateToProps, {addWebHook, deleteWebHook})
class WebHookTools extends Component{

    constructor(props){
        super(props);
    }

    /**
     * to delete webhook if it is exist
     * to add webhook if it is not exist
     */
    onClick(){
        const {schedule} = this.props;
        if(schedule.getWebhookUrl() !== ''){
            this.deleteWebHook();
        } else{
            this.addWebHook();
        }
    }

    /**
     * to add webhook to schedule
     */
    addWebHook(){
        const {authUser, addWebHook, schedule} = this.props;
        addWebHook({userId: authUser.userId, schedule: schedule.getObject()});
    }

    /**
     * to delete webhook from schedule
     */
    deleteWebHook(){
        const {deleteWebHook, schedule} = this.props;
        deleteWebHook({
            id: schedule.getWebhookId(),
            schedulerId: schedule.id,
        });
    }
    
    render(){
        const {authUser, addingWebHook, deletingWebHook, t, stateSchedule, schedule, index} = this.props;
        let classNames = ['webhook_tools', 'webhook_loading'];
        classNames = getThemeClass({classNames, authUser, styles});
        let icon = 'link';
        let tooltip = t('LIST.WEBHOOK_TOOLS_TOOLTIP_CREATE');
        if(schedule.getWebhookUrl() !== ''){
            icon = 'link_off';
            tooltip = t('LIST.WEBHOOK_TOOLS_TOOLTIP_DELETE');
        }
        return (
            <span className={styles[classNames.webhook_tools]}>
                {
                    stateSchedule && stateSchedule.schedulerId === schedule.id && (addingWebHook || deletingWebHook)
                        ?
                            <Loading authUser={authUser} className={styles[classNames.webhook_loading]}/>
                        :
                            <TooltipFontIcon
                                id={`webhook_tools_${index}`}
                                value={icon}
                                tooltip={tooltip}
                                onClick={::this.onClick}
                            />
                }
            </span>
        );
    }
}

WebHookTools.propTypes = {
    schedule: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
};

export default WebHookTools;