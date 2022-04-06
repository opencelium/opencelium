/*
 * Copyright (C) <2022>  <becon GmbH>
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

import React, { Component } from 'react';
import {PANEL_LOCATION} from "@utils/constants/app";


/**
 * add new window feature into Component
 */
export function NewWindowFeature(params = {url: '', windowName: '', setLocation: () => {}, isLocationSameWindow: () => {}, moveTo: null}){
    return function (Component) {
        return class extends Component{
            constructor(props) {
                super(props);
                this.isOpenedNewWindow = false;
                this.newWindow = null;
                this.checkIfWindowClosed = () => {};
            }

            openInNewWindow(){
                const that = this;
                window.updateConnection = this.props.updateConnection;
                this.newWindow = window.open(params.url, params.windowName, 'menubar:0,status:0,toolbar:0');
                this.newWindow.onload = () => {setTimeout(() => {that.isOpenedNewWindow = true;}, 200); params.setLocation(that.props, {location: PANEL_LOCATION.NEW_WINDOW})};
                if(typeof params.moveTo !== 'function'){
                    this.newWindow.moveTo(0, 0);
                } else{
                    params.moveTo(this.props, this.newWindow);
                }
                this.checkIfWindowClosed = setInterval(() => {
                    if(that.newWindow){
                        if(that.newWindow.closed) {
                            clearInterval(that.checkIfWindowClosed);
                            params.setLocation(that.props, {location: PANEL_LOCATION.SAME_WINDOW});
                            that.newWindow = null;
                            that.isOpenedNewWindow = false;
                        }
                        if(that.isOpenedNewWindow && that.newWindow && params.isLocationSameWindow(that.props)){
                            clearInterval(that.checkIfWindowClosed);
                            that.newWindow.close();
                            that.newWindow = null;
                            that.isOpenedNewWindow = false;
                        }
                    }
                }, 100);
            }

            render(){
                return <Component {...this.props} openInNewWindow={() => this.openInNewWindow()}/>;
            }
        };
    };
}
