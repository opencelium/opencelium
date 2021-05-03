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

import React, { Component }  from 'react';

import styles from '@themes/default/general/app.scss';
import CancelLoadingButton from "@basic_components/CancelLoadingButton";
import {consoleError, getThemeClass} from "@utils/app";
import {LoadingComponentError} from "@utils/constants/errors";
import ComponentError from "./ComponentError";
import {ERROR_TYPE} from "@utils/constants/app";
import {Spinner} from "reactstrap";



/**
 * Loading Component
 */
class Loading extends Component{

    constructor(props){
        super(props);
        this.cancelLoading = this.cancelLoading.bind(this);
    }

    /**
     * to cancel loading
     */
    cancelLoading(){
        const {cancelCallback} = this.props;
        cancelCallback();
    }

    renderCancelButton(){
        return null;
       /* if(cancelCallback){
            return <CancelLoadingButton cancel={this.cancelLoading}/>;
        } else{
            return null;
        }*/
    }

    render(){
        const {className, style, spinnerStyle, authUser, error} = this.props;
        if (error) {
            consoleError(error);
            return (
                <ComponentError entity={{type: ERROR_TYPE.FRONTEND, message: LoadingComponentError}} manualVisible={true}/>
            );
        }
        let classNames = ['loading'];
        let loadingClassName = styles.loading;
        if(authUser) {
            classNames = getThemeClass({classNames, authUser, styles});
            loadingClassName = styles[classNames.loading];
        }
        return (
            <div className={`${loadingClassName} ${className}`} style={style}>
                <Spinner type="grow" color="primary" style={spinnerStyle}/>
                {this.renderCancelButton()}
            </div>
        );
    }
}

Loading.defaultProps = {
    className: '',
    error: null,
    cancelCallback: null,
    style: {},
    spinnerStyle: {},
};

export default Loading;