import styled from "styled-components";

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

