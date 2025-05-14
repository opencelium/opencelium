import React from 'react';
import {OverlayProps} from "@app_component/form/form_section/overlay/interfaces";
import {ComponentContainer, OverlayContainer} from "@app_component/form/form_section/overlay/styles";

const OverlayFormSection = ({component}: OverlayProps) => {
    return (
        <React.Fragment>
            <OverlayContainer/>
            <ComponentContainer>
                {component}
            </ComponentContainer>
        </React.Fragment>
    )
}

export default OverlayFormSection;
