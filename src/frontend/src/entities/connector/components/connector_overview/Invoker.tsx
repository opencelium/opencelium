/*
 *  Copyright (C) <2022>  <becon GmbH>
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

import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import {Application} from "@application/classes/Application";
import {Text} from "@app_component/base/text/Text";
import {TextSize} from "@app_component/base/text/interfaces";
import {InvokerProps} from './interfaces';
import {
    ContentStyled,
    HeaderStyled,
    InvokerDescriptionStyled,
    InvokerDetailsStyled,
    InvokerIconStyled,
    InvokerNameStyled,
    SectionStyled
} from './styles';

const Invoker: FC<InvokerProps> =
    ({
        connector,
    }) => {

        let invoker = connector && connector.invoker ? connector.invoker : null;
        if(!invoker){
            return null;
        }
        const icon = invoker?.icon || '';
        const hasIcon = Application.isValidImageUrl(icon);
        const name = invoker?.name || 'Name is absent for this invoker';
        const description = invoker?.description || 'Description is absent for this invoker';
        const hint = invoker?.hint || '';
        const operations = invoker?.operations || [];
        return(
            <SectionStyled>
                <HeaderStyled>
                    <Text value={'Invoker'} size={TextSize.Size_20}/>
                </HeaderStyled>
                <ContentStyled>
                    <div style={{overflow: 'auto'}}>
                        {hasIcon && <InvokerIconStyled src={icon} alt={name}/>}
                        <InvokerDetailsStyled hasIcon={hasIcon}>
                            <InvokerNameStyled><Text value={name} size={TextSize.Size_20}/></InvokerNameStyled>
                            <InvokerDescriptionStyled><Text value={description}/></InvokerDescriptionStyled>
                        </InvokerDetailsStyled>
                    </div>
                    {hint !== '' &&
                        <React.Fragment>
                            <HeaderStyled>
                                <Text value={'Hint'} size={TextSize.Size_16}/>
                            </HeaderStyled>
                            <div><Text value={hint}/></div>
                        </React.Fragment>
                    }
                    <HeaderStyled>
                        <Text value={'Operations'} size={TextSize.Size_16}/>
                    </HeaderStyled>
                    {operations.map(operation => <div key={operation.name}><Text value={operation.name} size={TextSize.Size_16}/></div>)}
                </ContentStyled>
            </SectionStyled>
        );
}

Invoker.defaultProps = {
}


export {
    Invoker,
};

export default withTheme(Invoker);