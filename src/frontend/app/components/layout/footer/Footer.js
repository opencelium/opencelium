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

import React, { Component }  from 'react';
import {connect} from 'react-redux';

import styles from '../../../themes/default/layout/footer.scss';
import {getThemeClass} from "../../../utils/app";

function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}


/**
 * Footer Component of app
 */
@connect(mapStateToProps, {})
class Footer extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {authUser} = this.props;
        let classNames = ['footer', 'open_celium', 'logo_icon_bottom_right'];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <footer className={styles[classNames.footer]}>
                <div className={styles[classNames.logo_icon_bottom_right]}/>
                <div className={styles[classNames.open_celium]}>OpenCelium</div>
            </footer>
        );
    }
};

export default Footer;