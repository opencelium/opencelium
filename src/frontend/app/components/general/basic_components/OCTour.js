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
import PropTypes from 'prop-types';
import {disableBodyScroll, enableBodyScroll} from "body-scroll-lock";
import {connect} from 'react-redux';
import Tour from 'reactour';

import styles from '../../../themes/default/general/basic_components.scss';
import {getThemeClass} from "../../../utils/app";

function mapStateToProps(state){
    const auth = state.get('auth');
    return{
        authUser: auth.get('authUser')
    };
}


/**
 * Tour Component for App
 */
@connect(mapStateToProps, {})
class OCTour extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {authUser, startAt, rounded, disableInteraction, disableKeyboardNavigation, className, ...props} = this.props;
        let classNames = [
            'tour',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        let fullClassName = `${className} ${styles[classNames.tour]}`;
        return (
            <Tour
                startAt={startAt}
                disableInteraction={disableInteraction}
                disableKeyboardNavigation={disableKeyboardNavigation}
                rounded={rounded}
                className={fullClassName}
                onAfterOpen={disableBodyScroll}
                onBeforeClose={enableBodyScroll}
                {...props}
            />
        );
    }
}

OCTour.defaultProps = {
    startAt: 0,
    disableInteraction: true,
    disableKeyboardNavigation: true,
    rounded: 5,
    className: '',
};

export default OCTour;