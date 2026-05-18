import React from 'react';
import type {StepsComponent} from "@shared/ui/primitives/Steps/Divider.types.tsx";
import { Step, StepLabel, Stepper} from "@mui/material";
import {Typography} from "@shared/ui/primitives/Typography";
import {StepContent} from "@shared/ui/step-form/StepContent.tsx";

const MaterialSteps: StepsComponent =
    ({
         current,
         status,
         items,
     }) => {
        return (
            <Stepper activeStep={current} orientation="vertical">
                {items.map((step, index) => (
                    <Step key={step.header}>
                        <StepLabel
                            optional={
                                index === items.length - 1 ? (
                                    <Typography variant="caption">Last step</Typography>
                                ) : null
                            }
                        >
                            {step.header}
                        </StepLabel>
                        <StepContent>
                            <Typography>{step.subheader}</Typography>
                            {step.content}
                        </StepContent>
                    </Step>
                ))}
            </Stepper>
        )
    };

export default MaterialSteps;
