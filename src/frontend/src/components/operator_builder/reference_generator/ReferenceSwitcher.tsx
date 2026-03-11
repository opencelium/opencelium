import React from 'react';
import {
    RadioSwitcherContainer, RadioSwitchersContainer,
} from "@app_component/operator_builder/reference_generator/styles";
import {ReferenceSwitcherProps} from "@app_component/operator_builder/reference_generator/props";

const ReferenceSwitcher = ({referenceType, changeReferenceType, hasNotConstant = false}: ReferenceSwitcherProps) => {
    return (
        <RadioSwitchersContainer hasNotConstant={hasNotConstant}>
            {!hasNotConstant && <RadioSwitcherContainer title={'method'} onClick={() => changeReferenceType('constant')}>
                <span style={{fontSize: '14px'}} className="mdi mdi-alpha-c-circle-outline"></span>
                <input style={{height: '10px'}} type={'radio'} checked={referenceType === 'constant'}
                       onChange={() => changeReferenceType('constant')}/>
            </RadioSwitcherContainer>}
            <RadioSwitcherContainer title={'method'} onClick={() => changeReferenceType('direct')}>
                <span style={{fontSize: '14px'}} className="mdi mdi-vector-radius"></span>
                <input style={{height: '10px'}} type={'radio'} checked={referenceType === 'direct'}
                       onChange={() => changeReferenceType('direct')}/>
            </RadioSwitcherContainer>
            <RadioSwitcherContainer title={'webhook'} onClick={() => changeReferenceType('webhook')}>
                <span style={{fontSize: '14px'}} className="mdi mdi-webhook"></span>
                <input style={{height: '10px'}} type={'radio'} checked={referenceType === 'webhook'}
                       onChange={() => changeReferenceType('webhook')}/>
            </RadioSwitcherContainer>
        </RadioSwitchersContainer>
    )
}

export default ReferenceSwitcher;
