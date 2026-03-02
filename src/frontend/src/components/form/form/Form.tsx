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

import React, {FC, useEffect} from 'react';
import {withTheme} from 'styled-components';
import {BadRequest} from "@app_component/default_pages/bad_request/BadRequest";
import ContentLoading from "@app_component/base/loading/ContentLoading";
import ErrorBoundary from "@app_component/base/error_boundary/ErrorBoundary";
import {FormSectionProps} from "../form_section/interfaces";
import {FormProps} from './interfaces';
import {ActionsStyled, FormSectionStyled, FormStyled, SectionStyled} from './styles';
import {isArray, isString} from "@application/utils/utils";
import {useAppDispatch} from "@application/utils/store";
import LicenseAlertMessage from "@entity/dashboard/components/license_alert_message/LicenseAlertMessage";
import {setEntityHeader, setEntityIconKey} from "@application/redux_toolkit/slices/ApplicationSlice";
import {Application} from "@application/classes/Application";
import {MultipleTitleProps} from "@application/interfaces/IApplication";
const areEqualHeaders = (h1: string | MultipleTitleProps[], h2: string | MultipleTitleProps[]) => {
    if (isString(h1)) {
        return h1 === h2;
    }
    if (typeof h1 !== 'string' && typeof h2 !== 'string' && h1.length === h2.length) {
        for (let i = 0; i < h1.length; i++) {
            if (h1[i].name === h2[i].name) {
                continue;
            } else {
                return false;
            }
        }
        return true;
    }
    return false;
}
const Form: FC<FormProps> =
    ({
        title,
        actions,
        formSections,
        isLoading,
        error,
        gridTemplateColumns,
        hasNotAlert,
         entityKey,
    }) => {
    const dispatch = useAppDispatch();
    const {
        entityHeader,
         entityIconKey,
    } = Application.getReduxState();
    useEffect(() => {
        if (!entityHeader || !areEqualHeaders(entityHeader, title)) {
            dispatch(setEntityHeader(title));
        }
    }, [title]);
    useEffect(() => {
        if (entityIconKey !== entityKey) {
            dispatch(setEntityIconKey(entityKey));
        }
    }, [entityKey]);
    useEffect(() => {
        return () => {
            dispatch(setEntityHeader(''))
            dispatch(setEntityIconKey(''))
        }
    }, [])
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
            //@ts-ignore
            const childWithStyles = isArray(props.children) ? props.children.find((child: any) => !!child?.props?.styles) : props.children;
            let additionalStyles = childWithStyles ? childWithStyles?.props?.styles || '' : '';
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
                {!hasNotAlert ? <LicenseAlertMessage/> : null}
                {actions?.length > 0 && <ActionsStyled>{actions}</ActionsStyled> }
                <SectionStyled gridTemplateColumns={gridTemplateColumns}>
                    {sectionComponents}
                </SectionStyled>
            </FormStyled>
        </ErrorBoundary>
    )
}

Form.defaultProps = {
    entityKey: '',
    title: '',
    error: null,
    gridTemplateColumns: '',
    hasNotAlert: false,
}


export {
    Form,
};

export default withTheme(Form);
