import React from 'react';
import {KeyStyled, MetaBlockStyled, MetaItemStyled, ValueStyled} from "@app_component/base/input/styles";
import {ConnectionSocketLog, DetailedMethodSegment, DetailedOperatorSegment} from "@root/requests/models/ConnectionLog";
import DefaultText from "@app_component/base/text/DefaultText";
interface ErrorMessageProps {
    trace: ConnectionSocketLog<DetailedMethodSegment | DetailedOperatorSegment>;
}
const ErrorMessage = ({trace}: ErrorMessageProps) => {
    return (
        <MetaBlockStyled>
            <MetaItemStyled>
                <KeyStyled><DefaultText value={'Message:'}/></KeyStyled>{' '}
                <ValueStyled>
                    <DefaultText value={trace.error.message}/>
                </ValueStyled>
            </MetaItemStyled>
            {!!trace?.error?.stack_trace && <MetaItemStyled>
                <KeyStyled><DefaultText value={'Stack trace:'}/></KeyStyled>{' '}
                <ValueStyled>
                    <DefaultText value={trace.error.stack_trace.join('\n')}/>
                </ValueStyled>
            </MetaItemStyled>}
        </MetaBlockStyled>
    )
}

export default ErrorMessage;
