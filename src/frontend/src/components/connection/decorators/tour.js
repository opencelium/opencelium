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

import React, { Component } from 'react';

import OCTour from "@components/general/basic_components/OCTour";
import {disableBodyScroll, enableBodyScroll} from "body-scroll-lock";
import {automaticallyShowTour} from "@utils/constants/tours";
import {toggleAppTour} from '@actions/auth';
import {store} from '@utils/store';


/**
 * common component for adding tour in component
 *
 * @param tourSteps - steps that should be shown
 * @param filter - to filter steps before render
 * @param once - show tour only once
 * returns the same component with openTour function
 * @constructor
 */
export function tour(tourSteps, filter = null, once = false){
    return (Component) => {
        class TourClass extends Component{

            constructor(props){
                super(props);

                this.state = {
                    isOpenTour: automaticallyShowTour(props.authUser),
                };
            }

            /**
             * to disable scroll of the page
             */
            disableBody(target){
                disableBodyScroll(target);
            }

            /**
             * to enable scroll of the page
             */
            enableBody(target){
                enableBodyScroll(target);
            }

            /**
             * to close tour
             */
            openTour(){
                const {isOpenTour} = this.state;
                let {authUser} = this.props;
                let appTour = true;
                if(authUser.userDetail.hasOwnProperty('appTour')){
                    appTour = authUser.userDetail.appTour;
                }
                if(appTour !== isOpenTour) {
                    //authUser.userDetail.appTour = !appTour;
                    store.dispatch(toggleAppTour(authUser));
                }
                this.setState({isOpenTour: true});
            }

            /**
             * to close tour
             */
            closeTour(){
                this.setState({isOpenTour: false});
            }

            render(){
                const {isOpenTour} = this.state;
                let steps = tourSteps;
                if (filter !== null) {
                    steps = filter.bind(this)(tourSteps);
                }
                if(steps.length === 0){
                    return (
                        <Component
                            {...this.props}
                            openTour={null}
                        />
                    );
                } else {
                    return [
                        <Component
                            {...this.props}
                            openTour={() => this.openTour()}
                            key={0}/>,
                        <OCTour
                            key={1}
                            steps={steps}
                            isOpen={isOpenTour}
                            onRequestClose={() => this.closeTour()}
                            onAfterOpen={(a) => this.disableBody(a)}
                            onBeforeClose={(a) => this.enableBody(a)}
                        />
                    ];
                }
            }
        }
        return TourClass;
    };
}
