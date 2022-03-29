import styled from "styled-components";
import {InvokerDetailsStyledProps} from "@organism/connector_overview/interfaces";

const InvokerIconStyled = styled.img`
    width: 150px;
    float: left;
    margin-right: 20px;
`;

const InvokerDetailsStyled = styled.div<InvokerDetailsStyledProps>`
    float: right;
    width: ${({hasIcon}) => hasIcon ? `calc(100% - 170px)` : '100%'};
`;

const InvokerNameStyled = styled.div`
    margin-bottom: 15px;
`;

const InvokerDescriptionStyled = styled.div`
`;


const SectionStyled = styled.div`
    padding: 0 15px;
    margin-bottom: 20px !important;
`;

const HeaderStyled = styled.div`
    font-weight: bold;
    margin-top: 15px;
    margin-bottom: 5px;
`;

const ContentStyled = styled.div`
    margin-bottom: 5px;
    margin-left: 15px;
    margin-top: 15px;
`;

const DescriptionStyled = styled.div`
`;
const TitleStyled = styled.div`
`;

export {
    InvokerDetailsStyled,
    InvokerDescriptionStyled,
    InvokerIconStyled,
    InvokerNameStyled,
    SectionStyled,
    HeaderStyled,
    ContentStyled,
    DescriptionStyled,
    TitleStyled,
}