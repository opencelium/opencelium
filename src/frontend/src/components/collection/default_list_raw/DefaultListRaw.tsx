/*
 *  Copyright (C) <2023> <becon GmbH>
 *
 *  Licensed under the Apache License, Version 2.0 (the „License");
 *  you may not #use this file except in compliance with the License.
 *  You may obtain a copy #of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an „AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import React, {FC} from 'react';
import {useNavigate} from "react-router";
import {DefaultListRawStyled} from './styles';
import {DefaultListRawProps} from './interfaces';

let timer: any;

const DefaultListRaw: FC<DefaultListRawProps> =
    ({
         children,
         url,
         id,
     }) => {
        let navigate = useNavigate();
        return (
            <DefaultListRawStyled id={id} style={{cursor: "pointer"}} onClick={(e: any) => {
                if (timer) clearTimeout(timer);
                timer = setTimeout(function() {
                    let element = e.target;
                    if(element && e.detail === 1) {
                        while (true) {
                            if(element.id === id){
                                navigate(url, {replace: false})
                                break;
                            }
                            if(element.onclick || element.tagName.toLowerCase() === 'input'){
                                break;
                            } else{
                                if(element.parentElement){
                                    element = element.parentElement;
                                } else{
                                    break;
                                }
                            }
                        }
                    }
                }, 250);
            }}>
                {children}
            </DefaultListRawStyled>
        )
    }

DefaultListRaw.defaultProps = {
}


export {
    DefaultListRaw,
};

export default DefaultListRaw;