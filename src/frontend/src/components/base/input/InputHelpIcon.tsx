import React from 'react';
import {Step} from 'react-joyride';
import HelpIcon from "@app_component/base/tour/HelpIcon";

const InputHelpIcon = ({steps, inputRef, paddingRight, top}: {steps: Step[], inputRef: any, paddingRight?: number | string, top?: string}) => {
    return (
        <div style={{
            position: 'absolute',
            right: paddingRight ? `calc(${paddingRight || '0px'} + 2px)` : '2px',
            top: `${top || 24}px`,
            opacity: '1 !important',
        }}>
            <HelpIcon steps={steps} inputRef={inputRef} />
        </div>
    )
}

export default InputHelpIcon;
