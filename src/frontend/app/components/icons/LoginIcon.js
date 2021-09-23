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

import React from 'react';
import styles from '../../themes/default/general/icons.scss';
import LogoOcWhiteImagePath from "assets/logo_oc_white.png";
import Loading from "@components/general/app/Loading";

export class LoginOpenCelium extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            doRotate: false,
        }
    }

    onClick(){
        this.setState({
            doRotate: true,
        }, () => setTimeout(() => {this.setState({doRotate: false}); this.props.onClick()}, 300))
    }

    render(){
        const {doRotate} = this.state;
        const {isAuth, isLoading} = this.props;
        let className = isAuth ? `${styles.login_open_celium_in_menu}` : styles.login_open_celium;
        if(doRotate){
            className += ` ${styles.rotate}`;
        }
        return(
            <div className={className}>
                {isLoading ?
                    <Loading/>
                    :
                    <img src={LogoOcWhiteImagePath} alt={'OpenCelium'} onClick={::this.onClick}/>
                }
            </div>
        );
    }
}

export const LoginIcon = ({isUnlocked, ...props}) => {
    return(
        <button {...props} className={styles.wrapper}>
            <div className={styles.base}>
                <div className={styles.base_bottom}>
                </div>
                <div className={styles.lock_inside_top}>
                </div>
                <div className={styles.lock_inside_bottom}>
                </div>
            </div>
            <div className={`${styles.lock_cirlce} ${isUnlocked ? styles.unlock_circle : ''}`}>
                <div className={styles.lock_circle_inside}>
                </div>
            </div>
            <div className={`${styles.lock_box} ${isUnlocked ? styles.unlock_box : ''}`}>
            </div>
        </button>
    )
};