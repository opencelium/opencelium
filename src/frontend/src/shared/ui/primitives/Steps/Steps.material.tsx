import type {StepsComponent} from "@shared/ui/primitives/Steps/Divider.types.tsx";
import { Step, StepContent, StepLabel, Stepper} from "@mui/material";
import {Typography} from "@shared/ui/primitives/Typography";

const MaterialSteps: StepsComponent =
    ({
         current,
         items,
         compact,
     }) => {
        return (
            <Stepper activeStep={current} orientation={compact ? 'horizontal' : 'vertical'}>
                {items.map((step, index) => (
                    <Step key={index}>
                        <StepLabel
                            optional={
                                !compact && index === items.length - 1 ? (
                                    <Typography variant="caption">Last step</Typography>
                                ) : null
                            }
                        >
                            {step.header}
                        </StepLabel>
                        {!compact && (
                            <StepContent>
                                <Typography>{step.subheader}</Typography>
                                {step.content}
                            </StepContent>
                        )}
                    </Step>
                ))}
            </Stepper>
        )
    };

export default MaterialSteps;
