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

import React, {Component} from 'react';
import PropTypes from 'prop-types';

import styles from '@themes/default/general/change_component.scss';
import {getThemeClass, isString} from "@utils/app";
import HelpIcon from "../app/HelpIcon";


/**
 * Component to display Hint
 */
class Hint extends Component{

    constructor(props){
        super(props);
    }
    
    render(){
        const {authUser} = this.props;
        let {hint} = this.props;
        let text = '';
        let openTour = null;
        if(!isString(hint)){
            if(!hint){
                return null;
            }
            if(hint.hasOwnProperty('text')){
                text = hint.text;
            }
            if(hint.hasOwnProperty('openTour')){
                openTour = hint.openTour;
            }
        } else{
            text = hint;
        }
        let classNames = ['hint', 'text'];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <div className={styles[classNames.hint]}>
                <div className={styles[classNames.text]}>
                    {text}
                    {
                        openTour
                        ?
                            <HelpIcon onClick={openTour} id={text}/>
                        :
                            null
                    }
                </div>
            </div>
        );
    }
}

Hint.propTypes = {
    authUser: PropTypes.object.isRequired,
};


export default Hint;