import styled from "styled-components";
import {Card as CardComponent} from "../../atoms/card/Card";

const FormSectionStyled = styled(CardComponent)`
    @media screen and (max-width: 950px) {
        overflow: auto;
        position: static;
    }
    &>:not(:last-child){
        margin-bottom: 10px;
    }
`;

export {
    FormSectionStyled,
}