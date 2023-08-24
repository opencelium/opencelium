import styled from "styled-components";

export const AggregatorFormContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: 15px;
`;

export const FormContainer = styled.div`
    width: 50%;
`;

export const ArgumentFormContainer = styled.div`
    margin-left: 60px;
    padding-top: 35px;
    max-height: 220px;
    overflow-y: auto;
    &>div:not(:last-child){
        margin-bottom: 20px;
    }
`;

export const ActionButtonContainer = styled.div`
    position: absolute;
    bottom: 0px;
    right: 10px;
`;

export const DialogTitleContainerStyled = styled.span`
    display: flex;
    justify-content: center;
    align-items: center;
`;

export const DialogTitleLinkStyled = styled.span`
    ${({isLink}: {isLink: boolean}) => isLink ? `
    &:hover{
        text-decoration: underline;
        cursor: pointer;
    }
    ` : ''}
`;

