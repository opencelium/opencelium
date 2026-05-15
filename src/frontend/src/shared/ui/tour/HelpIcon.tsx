import React, {useState} from 'react';
import {IconButton} from "@shared/ui/primitives/IconButton";
import Tour, {PartialStepProps} from "./Tour.tsx";

const HelpIcon = ({steps, inputRef}: {steps: PartialStepProps[], inputRef: any}) => {
    const [startTour, toggleTour] = useState<boolean>(false);
    return (
        <React.Fragment>
            <Tour steps={steps.map(s => ({...s, target: inputRef?.current!}))} toggle={toggleTour} show={startTour}/>
            <IconButton iconProps={{name: 'info'}} type={'text'} size={'xs'} onClick={() => toggleTour(true)}/>
        </React.Fragment>
    )
}

export default HelpIcon;
