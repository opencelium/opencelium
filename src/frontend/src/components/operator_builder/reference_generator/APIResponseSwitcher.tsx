import React from 'react';
import {
    RadioSwitcherContainer,
    RadioSwitchersContainer
} from "@app_component/operator_builder/reference_generator/styles";
import {
    APIResponseSwitcherProps,
    ReferenceSwitcherProps
} from "@app_component/operator_builder/reference_generator/props";

const APIResponseSwitcher = ({type, changeType}: APIResponseSwitcherProps) => {
    return (
        <RadioSwitchersContainer>
            <RadioSwitcherContainer title={'body'} onClick={() => changeType('body')}>
                <span style={{fontSize: '14px'}} className="mdi mdi-alpha-b-circle-outline"></span>
                <input style={{height: '10px'}} type={'radio'} checked={type === 'body'}
                       onChange={() => changeType('body')}/>
            </RadioSwitcherContainer>
            <RadioSwitcherContainer title={'header'} onClick={() => changeType('header')}>
                <span style={{fontSize: '14px'}} className="mdi mdi-alpha-h-circle-outline"></span>
                <input style={{height: '10px'}} type={'radio'} checked={type === 'header'}
                       onChange={() => changeType('header')}/>
            </RadioSwitcherContainer>
            <RadioSwitcherContainer title={'status'} onClick={() => changeType('status')}>
                <span style={{fontSize: '14px'}} className="mdi mdi-alpha-s-circle-outline"></span>
                <input style={{height: '10px'}} type={'radio'} checked={type === 'status'}
                       onChange={() => changeType('status')}/>
            </RadioSwitcherContainer>
        </RadioSwitchersContainer>
    )
}

export default APIResponseSwitcher;
