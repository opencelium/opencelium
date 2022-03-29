import styled from "styled-components";
import Text from "../../atoms/text/Text";
import {ActionsStyledProps, FormSectionStyledProps, FormStyledProps, TitleStyledProps} from "./interfaces";
import {TextProps} from "@atom/text/interfaces";
import {Appearance} from "../../../styles/animations";

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