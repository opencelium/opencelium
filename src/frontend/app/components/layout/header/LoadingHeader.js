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

import styles from '../../../themes/default/layout/header.scss';
import Navigation from "../../general/basic_components/Navigation";


/**
 * Loading Component in the Header
 */
class LoadingHeader extends Component{

    constructor(props){
        super(props);
    }

    render(){
        return (
            <Navigation type='horizontal' className={styles.loading_header} theme={{horizontal: styles.user_header}}>
                <div className={styles.loading_icon}/>
                <div className={styles.loading_title}/>
                <div className={styles.loading_icon}/>
                <div className={styles.loading_title}/>
                <div className={styles.loading_icon}/>
                <div className={styles.loading_title}/>
            </Navigation>
        );
    }
}

export default LoadingHeader;