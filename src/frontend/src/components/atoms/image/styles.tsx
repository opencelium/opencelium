import styled from "styled-components";

const ImageStyled = styled.img`
    height: auto;
    width: ${({width}) => `${width} !important` || 'auto'};
`;

export {
    ImageStyled,
}