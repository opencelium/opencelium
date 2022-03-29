import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import {FormProps} from './interfaces';
import {ActionsStyled, FormSectionStyled, FormStyled, SectionStyled} from './styles';
import {FormSectionProps} from "../form_section/interfaces";
import ErrorBoundary from "../../helper/ErrorBoundary";
import Title from "@molecule/collection_title/Title";
import ContentLoading from "@molecule/loading/ContentLoading";

const Form: FC<FormProps> =
    ({
        title,
        actions,
        formSections,
        isLoading,
    }) => {
    if(isLoading){
        return(
            <ContentLoading/>
        )
    }
    let sectionComponents : React.ReactNode[] = [];
    let gridIndex = 1;
    React.Children.forEach(formSections, (formSection, index) => {
        if (React.isValidElement(formSection)) {
            const props: FormSectionProps = formSection.props
            const hasFullWidth = props.hasFullWidthInForm;
            let additionalStyles = '';
            if(hasFullWidth){
                additionalStyles = `
                    grid-column-start: 1;
                    grid-column-end: 3;
                    grid-row-start: ${gridIndex};
                    grid-row-end: ${gridIndex + 1};
                `;
            }
            if(hasFullWidth || !(index % 2)){
                gridIndex++;
            }
            sectionComponents.push(<FormSectionStyled key={index} additionalStyles={additionalStyles}>{formSection}</FormSectionStyled>);
        }
    });
    return (
        <ErrorBoundary>
            <FormStyled>
                <Title title={title}/>
                <ActionsStyled>{actions}</ActionsStyled>
                <SectionStyled>
                    {sectionComponents}
                </SectionStyled>
            </FormStyled>
        </ErrorBoundary>
    )
}

Form.defaultProps = {
    title: '',
}


export {
    Form,
};

export default withTheme(Form);