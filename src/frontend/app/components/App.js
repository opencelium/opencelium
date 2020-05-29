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

import React, {Suspense} from 'react';
import {Provider} from 'react-redux';

import {Router, browserHistory} from 'react-router';
import {syncHistoryWithStore } from 'react-router-redux';

import {setAuthSettings} from '@utils/auth';
import store from '@utils/store';
import i18n from '@utils/i18n';
import {createRoutes} from '@utils/routes';
import Loading from "@loading";


/**
 * set history for routes
 */
const createSelectLocationState = () => {
    let prevRoutingState, prevRoutingStateJS;
    return (state) => {
        const routingState = state.get('routing');
        if (typeof prevRoutingState === 'undefined' || prevRoutingState !== routingState) {
            prevRoutingState = routingState;
            prevRoutingStateJS = routingState.toJS();
        }
        return prevRoutingStateJS;
    };
};
export const history = syncHistoryWithStore(browserHistory, store, {
    selectLocationState: createSelectLocationState()
});

const routes = createRoutes(store);

setAuthSettings();


/**
 * main component of the OC application
 */
class App extends React.Component {

    componentDidMount(){

        //animated appearance of the app
        setTimeout(function(){
            const app = document.getElementById('app');
            app.style.opacity = '1.0';
        }, 500);
    }

    render() {
        return(
            <Provider store={store} ref='provider'>
                <Suspense fallback={(<Loading/>)}>
                    <Router history={history} children={routes}/>
                </Suspense>
            </Provider>
        );
    }
}

export default App;
