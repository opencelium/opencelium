import React from 'react';
import { ProgressBar } from 'react-bootstrap';
import {
    DivisionsStyled,
    DivisionStyled, InfoStyled,
    LabelStyled,
    NowValueStyled
} from "@entity/profile/components/subscriptions/style";
import SubscriptionModel from "@entity/application/requests/models/SubscriptionModel";
import {withTheme} from "styled-components";
import {ITheme} from "@style/Theme";

const CurrentSubscription = ({subscription, theme}: {subscription: SubscriptionModel, theme: ITheme}) => {
    const max = 1000000;
    const divisionStep = max / 10;
    const divisions = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const progressbarHeight = 30;
    const now = 531234;
    const percentage = (now / max) * 100;
    return (
        <div>
            <div>
                <div style={{fontSize: '24px', marginBottom: '10px'}}>{"License Information"}</div>
                <div style={{width: '100%'}}>
                    <InfoStyled>
                        <div><b>Status:</b></div>
                        <div>
                            {"Valid"}
                        </div>
                    </InfoStyled>
                    <InfoStyled>
                        <div><b>Type:</b></div>
                        <div>
                            {"Enterprise"}
                        </div>
                    </InfoStyled>
                    <InfoStyled>
                        <div><b>Start Date:</b></div>
                        <div>
                            {"05.08.2024"}
                        </div>
                    </InfoStyled>
                    <InfoStyled>
                        <div><b>End Date:</b></div>
                        <div>
                            {"05.08.2025"}
                        </div>
                    </InfoStyled>
                </div>
            </div>
            <div style={{position: 'relative', height: progressbarHeight + 50, marginTop: 50}}>
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
                    {now}
                </NowValueStyled>
            </div>
        </div>
    )
}

export default withTheme(CurrentSubscription);
