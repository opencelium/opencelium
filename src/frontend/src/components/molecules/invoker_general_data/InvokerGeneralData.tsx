import React, {ChangeEvent, FC, useState} from 'react';
import {withTheme} from 'styled-components';
import { InvokerGeneralDataProps } from './interfaces';
import InputText from "@atom/input/text/InputText";
import InputTextarea from "@atom/input/textarea/InputTextarea";
import {Invoker} from "@class/invoker/Invoker";
import {API_REQUEST_STATE, TRIPLET_STATE} from "@interface/application/IApplication";

const InvokerGeneralData: FC<InvokerGeneralDataProps> =
    ({
        invoker,
        isAdd,
    }) => {
    const {
        isCurrentInvokerHasUniqueTitle, checkingInvokerTitle, currentInvoker,
    } = Invoker.getReduxState();
    const [name, setName] = useState(isAdd ? '' : currentInvoker?.name || '');
    const [description, setDescription] = useState(isAdd ? '' : currentInvoker?.description || '');
    const [hint, setHint] = useState(isAdd ? '' : currentInvoker?.hint || '');
    return (
        <React.Fragment>
            <InputText
                icon={'person'}
                label={'Name'}
                value={name}
                required={true}
                isLoading={checkingInvokerTitle === API_REQUEST_STATE.START}
                error={isCurrentInvokerHasUniqueTitle === TRIPLET_STATE.FALSE ? 'The title must be unique' : ''}
                onChange={(e:ChangeEvent<HTMLInputElement>) => {
                    setName(e.target.value);
                }}
                onBlur={() => {
                    invoker.name = name;
                }}
            />
            <InputTextarea
                icon={'notes'}
                label={'Description'}
                value={description}
                onChange={(e) => {
                    setDescription(e.target.value);
                }}
                onBlur={() => {
                    invoker.description = description;
                }}
            />
            <InputText
                icon={'label'}
                label={'Hint'}
                value={hint}
                onChange={(e:ChangeEvent<HTMLInputElement>) => {
                    setHint(e.target.value);
                }}
                onBlur={() => {
                    invoker.hint = hint;
                }}
            />
        </React.Fragment>
    )
}

InvokerGeneralData.defaultProps = {
}


export {
    InvokerGeneralData,
};

export default withTheme(InvokerGeneralData);