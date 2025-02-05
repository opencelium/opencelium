import React from 'react';
import {ReferenceSwitcherContainer} from "@app_component/operator_builder/reference_generator/styles";
import {ReferenceSwitcherProps} from "@app_component/operator_builder/reference_generator/props";

const ReferenceSwitcher = ({referenceType, changeReferenceType}: ReferenceSwitcherProps) => {
    return (
        <ReferenceSwitcherContainer>
            <div style={{height: '14px'}} title={'method'} onClick={() => changeReferenceType('direct')}>
                <span style={{fontSize: '14px'}} className="mdi mdi-vector-radius"></span>
                <input style={{height: '10px'}} type={'radio'} checked={referenceType === 'direct'}
                       onChange={() => changeReferenceType('direct')}/>
            </div>
            <div style={{height: '14px'}} title={'webhook'} onClick={() => changeReferenceType('webhook')}>
                <span style={{fontSize: '14px'}} className="mdi mdi-webhook"></span>
                <input style={{height: '10px'}} type={'radio'} checked={referenceType === 'webhook'}
                       onChange={() => changeReferenceType('webhook')}/>
            </div>
        </ReferenceSwitcherContainer>
    )
}

export default ReferenceSwitcher;
