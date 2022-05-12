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

import styled from "styled-components";
import Text from "@app_component/base/text/Text";
import {TextProps} from "@app_component/base/text/interfaces";
import {Appearance} from "@style/animations";
import {ActionsStyledProps, FormSectionStyledProps, FormStyledProps, TitleStyledProps} from "./interfaces";

const TitleStyled = styled(Text)<TitleStyledProps | TextProps>`
    display: block;
    text-align: left;
    margin: 24px 0 20px;
`;

const ActionsStyled = styled.div<ActionsStyledProps>`
    &>:not(:last-child) {
        margin-right: 10px;
    }
    margin: 20px 0;
`;

const FormStyled = styled.div<FormStyledProps>`
    ${Appearance}
    margin: ${({margin}) => margin || '20px 0'};
    padding: ${({padding}) => padding || 0};
    padding-bottom: 30px;
`;

const SectionStyled = styled.div`
    display: grid;
    grid-template-columns: 50% 50%;
    column-gap: 20px;
    row-gap: 20px;
    width: calc(100% - 20px);
    @media screen and (max-width: 950px) {
        grid-template: none;
        width: 100%;
    }
`;

const FormSectionStyled = styled.div<FormSectionStyledProps>`
    display: grid;
    gap: 20px;
    ${({additionalStyles}) => additionalStyles || ''}
`

export {
    TitleStyled,
    ActionsStyled,
    FormStyled,
    SectionStyled,
    FormSectionStyled,
}