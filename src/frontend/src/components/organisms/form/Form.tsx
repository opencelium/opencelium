/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import {FormProps} from './interfaces';
import {ActionsStyled, FormSectionStyled, FormStyled, SectionStyled} from './styles';
import {FormSectionProps} from "../form_section/interfaces";
import ErrorBoundary from "../../helper/ErrorBoundary";
import Title from "@molecule/collection_title/Title";
import ContentLoading from "@molecule/loading/ContentLoading";
import BadRequest from "@page/bad_request/BadRequest";

const Form: FC<FormProps> =
    ({
        title,
        actions,
        formSections,
        isLoading,
        error,
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
    if(error){
        return <BadRequest/>
    }
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
    error: null,
}


export {
    Form,
};

export default withTheme(Form);