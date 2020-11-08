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

/**
 * check not authentication of the user
 *
 * @param ComposedComponent
 * @param store - from redux
 * returns the same component if the user is not authorized and redirect otherwise
 */
export default function(ComposedComponent, store){

    class NotAuthenticate extends Component{
        componentDidMount (){
            const auth = store.getState('auth').get('auth');
            if(auth.get('isAuth')){
                setTimeout(() => this.context.router.push('/'), 1000);
            }
        }

        componentDidUpdate (){
            const auth = store.getState('auth').get('auth');
            if(auth.get('isAuth')){
                setTimeout(() => this.context.router.push('/'), 1000);
            }
        }

        render(){
            return(
                <ComposedComponent {...this.props} store={store} router={this.context.router}/>
            );
        }
    }
    NotAuthenticate.contextTypes = {
        router: PropTypes.object.isRequired,
    };

    return NotAuthenticate;
}