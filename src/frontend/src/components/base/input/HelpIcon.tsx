import React, {useState} from 'react';
import {Step} from 'react-joyride';
import {ColorTheme} from "@style/Theme";
import {HelpIconStyled} from "@app_component/base/input/text/styles";
import Tour from "@app_component/base/tour/Tour";

const HelpIcon = ({steps, inputRef, paddingRight}: {steps: Step[], inputRef: any, paddingRight?: number | string}) => {
    const [startTour, toggleTour] = useState<boolean>(false);
    return (
        <React.Fragment>
            <Tour steps={steps.map(s => ({...s, target: inputRef?.current!}))} toggle={toggleTour} show={startTour}/>
            <HelpIconStyled
                hasBackground={false}
                icon={'info'}
                paddingRight={paddingRight || 0}
                color={ColorTheme.Blue}
                handleClick={() => toggleTour(true)}
            />
        </React.Fragment>
    )
}

export default HelpIcon;
