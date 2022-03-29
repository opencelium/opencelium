import React, {FC} from 'react';
import {withTheme} from 'styled-components';
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
import {Text} from "@atom/text/Text";
import {Application} from "@class/application/Application";
import {TextSize} from "@atom/text/interfaces";

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