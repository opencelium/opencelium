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
    const divisions = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const progressbarHeight = 30;
    const now = 531234;
    const max = 1000000;
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
                    {divisions.map((division, index) => (
                        <DivisionStyled key={division} style={{
                            height: progressbarHeight + 10,
                            borderLeft: index !== 0 && index !== divisions.length - 1 ? '1px dotted #000' : 'unset'
                        }}>
                            <LabelStyled key={division}>
                                {`${index < 10 ? `${division === 0 ? '0' : `${division * 10}K`}` : '1M'}`}
                            </LabelStyled>
                        </DivisionStyled>
                    ))}
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
