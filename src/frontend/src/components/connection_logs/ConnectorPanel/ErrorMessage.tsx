import React from 'react';
import {KeyStyled, MetaBlockStyled, MetaItemStyled, ValueStyled} from "@app_component/base/input/styles";
import {ConnectionSocketLog, DetailedMethodSegment} from "@root/requests/models/ConnectionLog";
interface ErrorMessageProps {
    trace: ConnectionSocketLog<DetailedMethodSegment>;
}
const ErrorMessage = ({trace}: ErrorMessageProps) => {
    return (
        <MetaBlockStyled>
            <MetaItemStyled>
                <KeyStyled>Message:</KeyStyled>{' '}
                <ValueStyled>
                    {trace.error.message}
                </ValueStyled>
            </MetaItemStyled>
            {!!trace?.error?.stack_trace && <MetaItemStyled>
                <KeyStyled>Stack trace:</KeyStyled>{' '}
                <ValueStyled>
                    {trace.error.stack_trace.join('\n')}
                </ValueStyled>
            </MetaItemStyled>}
        </MetaBlockStyled>
    )
}

export default ErrorMessage;
