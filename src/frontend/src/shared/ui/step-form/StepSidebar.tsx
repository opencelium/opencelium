import { StepCircle } from "./StepCircle"
import type { StepDefinition } from "./types"
import {EntityText} from "@shared/ui/primitives/Text";

interface Props {
    steps: StepDefinition[]
    currentStep: number
    setCurrentStep: (newStep: number) => void
    readOnly: boolean
    isSuccess: boolean
}

export function StepSidebar({
    steps,
    currentStep,
    setCurrentStep,
    readOnly,
    isSuccess,
}: Props) {
    return (
        <div
            style={{
                width: 260,
                paddingRight: 32,
                paddingTop: '40px',
            }}
        >
            {steps.map((step, index) => {
                const isActive = index === currentStep
                const isCompleted = index < currentStep || readOnly;
                const hasNavi = isCompleted || readOnly;
                return (
                    <div
                        key={index}
                        style={{
                            display: "flex",
                            gap: 16,
                            marginBottom: 32,
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            cursor: hasNavi ? 'pointer' : 'default',
                        }}
                        onClick={hasNavi ? () => setCurrentStep(index) : () => {}}
                    >

                        <div>
                            <div
                                style={{
                                    textDecoration: isActive ? 'underline' : 'unset',
                                    fontWeight: isCompleted || isActive ? 600 : 500,
                                    color: isCompleted || isActive
                                        ? "#1A1A1A"
                                        : "#6A6A6A",

                                }}
                            >
                                <EntityText i18nKey={step.header}/>
                            </div>

                            {step.subheader && (
                                <div
                                    style={{
                                        fontSize: 13,
                                        color: "#9A9A9A",
                                        marginTop: 4,
                                    }}
                                >
                                    <EntityText i18nKey={step.subheader}/>
                                </div>
                            )}
                        </div>
                        <div style={{position: "relative"}}>

                            {index === 0 && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: -30,
                                        right: 17,
                                        width: 2,
                                        height: 30,
                                        background: "#E0E0E0",
                                    }}
                                />
                            )}
                            <StepCircle
                                index={index}
                                isActive={isActive}
                                isCompleted={isCompleted}
                                isSuccess={isSuccess}
                            />

                            {index < steps.length && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: 36,
                                        right: 17,
                                        width: 2,
                                        height: 40,
                                        background: "#E0E0E0",
                                    }}
                                />
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
