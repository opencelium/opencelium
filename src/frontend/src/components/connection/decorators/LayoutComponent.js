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

import React, {Suspense} from 'react';
import CVoiceControl from "@classes/voice_control/CVoiceControl";
import Loading from "@loading";
import ComponentError from "@components/general/app/ComponentError";
import {ERROR_TYPE} from "@utils/constants/app";
import CListVoiceControl from "@classes/voice_control/CListVoiceControl";


export function LayoutComponent(componentSingleName = '', componentPluralName = '', url = '', deleteActionName = '', exceptions = []){
    return function (Component) {
        return (
            class C extends React.Component {

                componentDidMount(){
                    CVoiceControl.initCommands({component: this, currentItems: this.props.currentPageItems, componentSingleName, componentPluralName, url, deleteActionName, exceptions}, CListVoiceControl);
                }

                componentDidUpdate(){
                    CVoiceControl.initCommands({component: this, currentItems: this.props.currentPageItems, componentSingleName, componentPluralName, url, deleteActionName, exceptions}, CListVoiceControl);
                }

                componentWillUnmount(){
                    CVoiceControl.removeCommands({component: this, currentItems: this.props.currentPageItems, componentSingleName, componentPluralName, url, deleteActionName, exceptions}, CListVoiceControl);
                    this.props.setCurrentPageItems([]);
                }

                render(){
                    const {children, isComponentExternalInChangeContent} = this.props;
                    let containerStyles = {};
                    if(isComponentExternalInChangeContent){
                        containerStyles.position = 'relative';
                    }
                    return (
                        <div style={containerStyles}>
                            <Suspense fallback={(<Loading/>)}>
                                <ComponentError entity={{type: ERROR_TYPE.FRONTEND, name: componentSingleName}}>
                                    {children}
                                </ComponentError>
                            </Suspense>
                        </div>
                    );
                }
            }
        );
    };
}

export default LayoutComponent;