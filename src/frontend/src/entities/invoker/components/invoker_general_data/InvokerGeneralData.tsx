/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {ChangeEvent, FC, useState} from 'react';
import {withTheme} from 'styled-components';
import {API_REQUEST_STATE, TRIPLET_STATE} from "@application/interfaces/IApplication";
import InputText from "@app_component/base/input/text/InputText";
import InputTextarea from "@app_component/base/input/textarea/InputTextarea";
import { InvokerGeneralDataProps } from './interfaces';
import {Invoker} from "../../classes/Invoker";

const InvokerGeneralData: FC<InvokerGeneralDataProps> =
    ({
        invoker,
        isAdd,
        isView,
        isReadonly,
        nameValidationMessage,
        setNameValidationMessage,
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
                id={'invoker_name'}
                autoFocus={!isView}
                icon={'person'}
                label={'Name'}
                value={name}
                required={true}
                isLoading={checkingInvokerTitle === API_REQUEST_STATE.START}
                error={isCurrentInvokerHasUniqueTitle === TRIPLET_STATE.FALSE ? 'The title must be unique' : nameValidationMessage}
                onChange={(e:ChangeEvent<HTMLInputElement>) => {
                    setName(e.target.value);
                    setNameValidationMessage('');
                }}
                onBlur={() => {
                    invoker.name = name;
                }}
                readOnly={isReadonly}
            />
            <InputTextarea
                id={'invoker_description'}
                icon={'notes'}
                label={'Description'}
                value={description}
                onChange={(e) => {
                    setDescription(e.target.value);
                }}
                onBlur={() => {
                    invoker.description = description;
                }}
                readOnly={isReadonly}
            />
            <InputText
                id={'invoker_hint'}
                icon={'label'}
                label={'Hint'}
                value={hint}
                onChange={(e:ChangeEvent<HTMLInputElement>) => {
                    setHint(e.target.value);
                }}
                onBlur={() => {
                    invoker.hint = hint;
                }}
                readOnly={isReadonly}
            />
        </React.Fragment>
    )
}

InvokerGeneralData.defaultProps = {
    nameValidationMessage: '',
}


export {
    InvokerGeneralData,
};

export default withTheme(InvokerGeneralData);
