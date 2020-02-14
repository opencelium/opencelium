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
import styles from '../../themes/default/general/app.scss';
import {connect} from "react-redux";
import {toggleAppTour} from "../../actions/auth";
import Checkbox from "../../components/general/basic_components/inputs/Checkbox";


function mapStateToProps(state){
    const auth = state.get('auth');
    return{
        authUser: auth.get('authUser'),
    };
}

@connect(mapStateToProps, {toggleAppTour})
class SwitchOffTour extends Component{

    constructor(props){
        super(props);
        let {authUser} = props;
        let checked = true;
        if(authUser && authUser.userDetail && authUser.userDetail.hasOwnProperty('appTour')){
            checked = authUser.userDetail.appTour;
        }
        this.state = {
            checked,
        };
    }

    /**
     * to update theme of auth user
     */
    handleCheck(){
        const {toggleAppTour} = this.props;
        let {authUser} = this.props;
        let checked = true;
        if(authUser.userDetail.hasOwnProperty('appTour')){
            checked = authUser.userDetail.appTour;
        }
        authUser.userDetail.appTour = !checked;
        toggleAppTour(authUser);
        this.setState({checked: authUser.userDetail.appTour});
    }

    render(){
        return (
            <div>
                <div className={styles.switch_off_tour_text}>{this.props.children}</div>
                <div className={styles.switch_off_tour_check}>
                    <span className={styles.switch_off_tour_do_not_show}>Do not show again</span>
                    <Checkbox checked={!this.state.checked} onChange={::this.handleCheck} theme={{check: styles.switch_off_tour_checkbox, field: styles.switch_off_tour_field}}/>
                </div>
            </div>
        );
    }
}

SwitchOffTour.propTypes = {

};

export default SwitchOffTour;