import React, {useState} from 'react';
import {Step} from 'react-joyride';
import {ColorTheme} from "@style/Theme";
import Tour from "@app_component/base/tour/Tour";
import Button from "@app_component/base/button/Button";

const HelpIcon = ({steps, inputRef}: {steps: Step[], inputRef: any}) => {
    const [startTour, toggleTour] = useState<boolean>(false);
    return (
        <React.Fragment>
            <Tour steps={steps.map(s => ({...s, target: inputRef?.current!}))} toggle={toggleTour} show={startTour}/>
            <Button
                hasBackground={false}
                icon={'info'}
                color={ColorTheme.Blue}
                handleClick={() => toggleTour(true)}
            />
        </React.Fragment>
    )
}

export default HelpIcon;
