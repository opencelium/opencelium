import React, {useEffect} from 'react';
import { ProgressBar } from 'react-bootstrap';
import {
    DivisionsStyled,
    DivisionStyled, InfoStyled,
    LabelStyled,
    NowValueStyled
} from "./style";
import {withTheme} from "styled-components";
import {ITheme} from "@style/Theme";
import {useAppDispatch} from "@application/utils/store";
import {convertTimeForSubscription, formatOperationUsage} from "@application/utils/utils";
import SubscriptionModel from "@entity/license_management/requests/models/SubscriptionModel";
import License from "@entity/license_management/classes/License";
import {getLicenseStatus} from "@entity/license_management/redux_toolkit/action_creators/LicenseCreators";
import Subscription from "@entity/license_management/classes/Subscription";

export const RoleNames: any = {
    admin: 'OC Admin',
    duo_customer: 'Duo',
    unlimited_customer: 'Unlimited',
    professional: 'Professional',
    enterprise: 'Enterprise',
    enterprise_plus: 'Enterprise Plus',
    professional_api: 'OpenCelium Professional (API)',
    enterprise_api: 'OpenCelium Enterprise (API)',
    enterprise_plus_api: 'OpenCelium Enterprise Plus (API)',
    free: 'Free',
}
const CurrentSubscription = ({subscription, theme}: {subscription: SubscriptionModel, theme: ITheme}) => {
    const max = subscription.totalOperationUsage;
    const divisionStep = max / 10;
    const divisions = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const progressbarHeight = 30;
    const now = subscription.currentOperationUsage;
    const percentage = (now / max) * 100;
    useEffect(() => {
    }, []);
    return (
        <div>
            <div>
                <div style={{fontSize: '24px', marginBottom: '10px'}}>{"License Information"}</div>
                <div style={{width: '100%'}}>
                    <InfoStyled>
                        <div><b>Status:</b></div>
                        <div>
                            {subscription.active ? "Valid" : "Invalid"}
                        </div>
                    </InfoStyled>
                    <InfoStyled>
                        <div><b>Type:</b></div>
                        <div>
                            {RoleNames[subscription.type]}
                        </div>
                    </InfoStyled>
                    <InfoStyled>
                        <div><b>Amount of API Operations:</b></div>
                        <div>
                            {formatOperationUsage(subscription.totalOperationUsage)}
                        </div>
                    </InfoStyled>
                    <InfoStyled>
                        <div><b>Expiration Date:</b></div>
                        <div>
                            {convertTimeForSubscription(subscription.endDate, {hasHours: false, hasMinutes: false, hasSeconds: false})}
                        </div>
                    </InfoStyled>
                    <InfoStyled>
                        <div><b>Monthly Period:</b></div>
                        <div>
                            {Subscription.getMonthlyPeriod(subscription.startDate)}
                        </div>
                    </InfoStyled>
                    {max === null && <React.Fragment>
                        <InfoStyled>
                            <div><b>Capacity:</b></div>
                            <div>
                                {"Unlimited"}
                            </div>
                        </InfoStyled>
                        <InfoStyled>
                            <div><b>Current Operation Usage:</b></div>
                            <div>
                                {now}
                            </div>
                        </InfoStyled>
                    </React.Fragment>
                    }
                </div>
            </div>
            {max !== null && <div style={{position: 'relative', height: progressbarHeight + 50, marginTop: 60}}>
                <ProgressBar
                    style={{
                        borderRadius: '0.25rem',
                        height: progressbarHeight,
                    }}
                    now={percentage}
                />
                <DivisionsStyled style={{top: -5}}>
                    {divisions.map((division, index) => {
                        let thousandStep: number = divisionStep * index / 1000;
                        let millionStep: number = 0;
                        if (thousandStep >= 1000) {
                            millionStep = thousandStep / 1000;
                            thousandStep = thousandStep - (millionStep * 1000);
                        }
                        return (
                            <DivisionStyled key={index} style={{
                                height: progressbarHeight + 10,
                                borderLeft: index !== 0 && index !== divisions.length - 1 ? '1px dotted #000' : 'unset'
                            }}>
                                <LabelStyled key={index} style={millionStep > 0 && thousandStep > 0 ? {lineHeight: '18px', bottom: '-40px'} : {bottom: '-25px'}}>
                                    {`${index === 0 ? '0' : `${millionStep > 0 ? `${millionStep}M` : ''}${thousandStep > 0 ? ' ' : ''}${thousandStep > 0 ? `${thousandStep}K` : ''}`}`}
                                </LabelStyled>
                            </DivisionStyled>
                        );
                    })}
                </DivisionsStyled>
                <NowValueStyled
                    style={{
                        left: `calc(${percentage}%)`,
                    }}
                >
                    {formatOperationUsage(now)}
                </NowValueStyled>
            </div>
            }
        </div>
    )
}

export default withTheme(CurrentSubscription);
