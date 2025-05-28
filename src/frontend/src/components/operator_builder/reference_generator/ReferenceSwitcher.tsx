import React from 'react';
import {
    ReferenceSwitcherContainer,
    ReferenceSwitchersContainer
} from "@app_component/operator_builder/reference_generator/styles";
import {ReferenceSwitcherProps} from "@app_component/operator_builder/reference_generator/props";

const ReferenceSwitcher = ({referenceType, changeReferenceType, hasNotConstant = false}: ReferenceSwitcherProps) => {
    return (
        <ReferenceSwitchersContainer hasNotConstant={hasNotConstant}>
            {!hasNotConstant && <ReferenceSwitcherContainer title={'method'} onClick={() => changeReferenceType('constant')}>
                <span style={{fontSize: '14px'}} className="mdi mdi-code-string"></span>
                <input style={{height: '10px'}} type={'radio'} checked={referenceType === 'constant'}
                       onChange={() => changeReferenceType('constant')}/>
            </ReferenceSwitcherContainer>}
            <ReferenceSwitcherContainer title={'method'} onClick={() => changeReferenceType('direct')}>
                <span style={{fontSize: '14px'}} className="mdi mdi-vector-radius"></span>
                <input style={{height: '10px'}} type={'radio'} checked={referenceType === 'direct'}
                       onChange={() => changeReferenceType('direct')}/>
            </ReferenceSwitcherContainer>
            <ReferenceSwitcherContainer title={'webhook'} onClick={() => changeReferenceType('webhook')}>
                <span style={{fontSize: '14px'}} className="mdi mdi-webhook"></span>
                <input style={{height: '10px'}} type={'radio'} checked={referenceType === 'webhook'}
                       onChange={() => changeReferenceType('webhook')}/>
            </ReferenceSwitcherContainer>
        </ReferenceSwitchersContainer>
    )
}

export default ReferenceSwitcher;
