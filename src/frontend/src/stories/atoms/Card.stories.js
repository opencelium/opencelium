import React from 'react';
import {Card as CardComponent} from "@atom/card/Card";
import styled, {withTheme} from "styled-components";
import InputText from "@atom/input/text/InputText";
import Label from "@molecule/form_section/label/Label";
import InputTextarea from "@atom/input/textarea/InputTextarea";

const TemplateWithTheme = withTheme(CardComponent);

const Template = args => <TemplateWithTheme {...args}/>

const InputsStyled = styled.div`
    &>:not(:last-child){
        margin-bottom: 5px;
    }
`

export const Card = Template.bind({})
Card.args = {
    margin: '20px',
    padding: '20px 10px',
    children: <div style={{position: 'relative', paddingTop: '20px'}}>
        <Label value={"user details"} top={'-45px'} left={'10px'} position={'absolute'}/>
        <InputsStyled>
            <InputText isLoading label={'Test'} value={'test'}/>
            <InputText icon={'person'} value={'test'}/>
            <InputText isLoading icon={'person'} label={'Test'} value={'test'}/>
            <InputText icon={'person'} label={'Test'} value={'value'} maxLength={20}/>
            <InputTextarea icon={'person'} label={'Test'} value={'name'} maxLength={20}/>
            <InputTextarea icon={'person'} label={'Test'} value={'Description'} maxLength={20}/>
            <InputText icon={'person'} label={'Test'} value={'name'} maxLength={20}/>
        </InputsStyled>
    </div>
}

export default {
    title: 'Atoms/Card',
    component: TemplateWithTheme,
}