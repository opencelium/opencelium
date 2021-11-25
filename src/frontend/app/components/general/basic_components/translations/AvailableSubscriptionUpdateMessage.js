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

import Translate from "@components/general/app/Translate";
import {Link, withRouter} from "react-router";
import React from "react";
import {history} from "@components/App";

class AvailableSubscriptionUpdateMessage extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        let update = 'update';
        return (
            <Translate i18nKey="notifications:SUCCESS.FETCH_SUBSCRIPTIONUPDATE"
                       values={{update}}
                       components={[
                           <a href={''} onClick={() => history.push('/update_subscription')} children={'update'}/>
                       ]}/>
        );
    }
}

export default withRouter(AvailableSubscriptionUpdateMessage);