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

import styles from '@themes/default/general/change_component.scss';
import {getThemeClass} from "@utils/app";
import Button from "@basic_components/buttons/Button";
import Loading from "@loading";
import {API_REQUEST_STATE} from "@utils/constants/app";
import FontIcon from "@basic_components/FontIcon";
import CheckConnection from "@change_component/extra_actions/check_connection/CheckConnection";


/**
 * Navigation Component
 */
class Navigation extends Component{

    constructor(props){
        super(props);
    }

    renderPrevButton(){
        const {authUser, navigationPage} = this.props;
        let classNames = ['navigation_prev_icon'];
        classNames = getThemeClass({classNames, authUser, styles});
        const {page, prevPage} = navigationPage;
        if(page === 0 || prevPage === null){
            return null;
        }
        return <FontIcon className={styles[classNames.navigation_prev_icon]} value={'arrow_back'} onClick={prevPage} id={'navigation_back'}/>;
    }

    renderNextButton(){
        const {action, translations, isTested, authUser, makingRequest, isActionInProcess, extraAction, entity} = this.props;
        let classNames = [
            'navigation_action_icon',
            'navigation_icon_text',
            'navigation_action_icon',
            'navigation_icon_text',
            'navigation_next_icon',
            'navigation_loading',
        ];
        classNames = getThemeClass({classNames, authUser, styles});

        if(makingRequest || isActionInProcess === API_REQUEST_STATE.START){
            return <Loading authUser={authUser} className={styles[classNames.navigation_loading]}/>;
        }
        let {type} = this.props;
        const {page, lastPage, nextPage} = this.props.navigationPage;
        let extraButton = null;
        let isLastPage = false;
        let icon = 'arrow_forward';
        if(page === lastPage){
            isLastPage = true;
        }
        if(isLastPage){
            switch(type){
                case 'add':
                    icon = 'add';
                    break;
                case 'update':
                    icon = 'autorenew';
                    break;
                case 'view':
                    icon = '';
            }
            if(isTested === -1 || isTested === 0){
                icon = 'donut_large';
                type = 'test';
            }
            if(icon === ''){
                return null;
            }
            if(extraAction){
                switch (extraAction) {
                    case 'CHECK_CONNECTION':
                        extraButton = <CheckConnection currentConnection={entity}/>;
                        break;
                }
            }
            return (
                <React.Fragment>
                    <Button
                        authUser={authUser}
                        title={translations[type + 'Button']}
                        icon={icon}
                        onClick={action}
                        className={styles[classNames.navigation_action_icon]}
                    />
                    {extraButton}
                </React.Fragment>
            );
        }
        return <FontIcon className={styles[classNames.navigation_next_icon]} value={icon} onClick={nextPage} id={'navigation_next'}/>;
    }
    
    render(){
        const {authUser} = this.props;
        let classNames = ['navigation'];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <div className={styles[classNames.navigation]}>
                {this.renderPrevButton()}
                {this.renderNextButton()}
            </div>
        );
    }
}

Navigation.propTypes = {
    authUser: PropTypes.object.isRequired,
    page: PropTypes.number,
    nextPage: PropTypes.func,
    prevPage: PropTypes.func,
    action: PropTypes.func.isRequired,
    translations: PropTypes.object.isRequired,
    add: PropTypes.string,
    isTested: PropTypes.number,
    entity: PropTypes.object.isRequired,
};

Navigation.defaultProps = {
    page: 0,
    nextPage: null,
    prevPage: null,
    type: 'add',
    isTested: 1,
    extraAction: '',
};


export default Navigation;