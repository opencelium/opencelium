/*
 * Copyright (C) <2021>  <becon GmbH>
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
import {connect} from 'react-redux';
import {withTranslation} from 'react-i18next';
import {SchedulePermissions} from "@utils/constants/permissions";
import {permission} from "@decorators/permission";
import {SingleComponent} from "@decorators/SingleComponent";
import Form from "@change_component/Form";
import {INPUTS} from "@utils/constants/inputs";
import {fetchSchedule} from "@actions/schedules/fetch";

const schedulePrefixUrl = '/schedules';

function mapStateToProps(state){
    const auth = state.get('auth');
    const schedules = state.get('schedules');
    return{
        authUser: auth.get('authUser'),
        fetchingSchedule: schedules.get('fetchingSchedule'),
        schedule: schedules.get('schedule'),
        error: schedules.get('error'),
    };
}

/**
 * Component to View Notification Template
 */
@connect(mapStateToProps, {fetchSchedule})
@permission(SchedulePermissions.READ, true)
@withTranslation(['schedules', 'app'])
@SingleComponent('schedule')
class NotificationTemplateView extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {t, openTour} = this.props;
        const schedule = {...this.props.schedule, connection: this.props.schedule.connection.title};
        let contentTranslations = {};
        contentTranslations.header = {title: t(`VIEW.HEADER`), onHelpClick: openTour};
        contentTranslations.list_button = {title: t(`VIEW.LIST_BUTTON`), link: schedulePrefixUrl};
        const contents = [
            {
                inputs:[
                    {...INPUTS.SCHEDULE_TITLE,
                        label: t(`VIEW.FORM.TITLE`),
                        defaultValue: '',
                        readonly: true,
                    },
                    {...INPUTS.SCHEDULE_CONNECTION_TEXT,
                        label: t(`VIEW.FORM.CONNECTION`),
                        readonly: true,
                        required: true,
                    },
                    {...INPUTS.SCHEDULE_CRON_EXPRESSION,
                        label: t(`VIEW.FORM.CRON_EXP`),
                        defaultValue: '',
                        readonly: true,
                        required: true,
                    },
                ],
                hint: {text: t(`VIEW.FORM.HINT_1`), openTour},
                header: t(`VIEW.FORM.PAGE_1`),
            }
        ];
        return (
            <Form
                contents={contents}
                translations={contentTranslations}
                permissions={SchedulePermissions}
                entity={schedule}
                type={'view'}
            />
        );
    }
}

export default NotificationTemplateView;