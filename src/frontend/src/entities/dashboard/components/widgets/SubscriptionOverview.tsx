/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {FC, useEffect} from 'react';
import {useAppDispatch} from "@application/utils/store";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {SubscriptionOverviewWidgetStyled} from './styles';
import {ContentLoading} from "@app_component/base/loading/ContentLoading";
import {WidgetTitle} from "../widget_title/WidgetTitle";
import CurrentSubscription from "@entity/profile/components/subscriptions/CurrentSubscription";
import {getCurrentSubscription} from "@entity/application/redux_toolkit/action_creators/SubscriptionCreators";
import Subscription from "@entity/application/classes/Subscription";

const SubscriptionOverviewWidget: FC =
    ({

     }) => {
        const dispatch = useAppDispatch();
        const {
            currentSubscription, gettingCurrentSubscription
        } = Subscription.getReduxState();
        useEffect(() => {
            dispatch(getCurrentSubscription());
        }, [])
        if(gettingCurrentSubscription !== API_REQUEST_STATE.FINISH && gettingCurrentSubscription !== API_REQUEST_STATE.ERROR){
            return <ContentLoading/>;
        }
        return (
            <SubscriptionOverviewWidgetStyled >
                <WidgetTitle title={'Subscription Overview'}/>
                <CurrentSubscription subscription={currentSubscription}/>
            </SubscriptionOverviewWidgetStyled>
        )
    }

SubscriptionOverviewWidget.defaultProps = {
}


export {
    SubscriptionOverviewWidget,
};
