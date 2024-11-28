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
         entity,
         onClick,
     }) => {
        let navigate = useNavigate();
        const hasDisabledStyle = entity.isDisabled || entity.isLoading;
        const hasOnClickEvent = !!onClick;
        return (
            <DefaultListRawStyled id={id} title={entity.title || ''} style={{cursor: hasDisabledStyle ? "default" : "pointer", color: hasDisabledStyle ? '#777' : '#000', background: hasDisabledStyle ? '#eee' : 'unset'}} onClick={entity.isDisabled ? () => {} : hasOnClickEvent ? (e) => onClick(entity) : (e: any) => {
                if (timer) clearTimeout(timer);
                timer = setTimeout(function() {
                    let element = e.target;
                    if(element && e.detail === 1) {
                        while (true) {
                            if(element.onclick || element.tagName.toLowerCase() === 'input' || element.tagName.toLowerCase() === 'textarea'){
                                break;
                            } else{
                                if(element.id === id){
                                    if(entity.isExternalHref) {
                                        window.open(url, '_blank').focus()
                                    } else {
                                        if (!entity.isDisabled && !entity.isLoading) {
                                            navigate(url, {replace: false})
                                        }
                                    }
                                    break;
                                }
                                if(element.parentElement){
                                    element = element.parentElement;
                                } else{
                                    break;
                                }
                            }
                            if(element.id === id){
                                if(entity.isExternalHref) {
                                    window.open(url, '_blank').focus()
                                } else {
                                    if (!entity.isDisabled && !entity.isLoading) {
                                        navigate(url, {replace: false})
                                    }
                                }
                                break;
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
    onClick: null,
}


export {
    DefaultListRaw,
};

export default DefaultListRaw;
