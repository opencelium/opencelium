import styled from "styled-components";
import Gravatar from 'react-gravatar';

const ProfileImageStyled = styled(Gravatar)`
    position: absolute;
    top: 40px;
    right: 20px;
    & >img{
        border-radius: 50%;
    }
    @media screen and (max-width: 950px) {
        display: none;
    }
`;
const DefaultImageStyled = styled.img`
    position: absolute;
    top: 40px;
    right: 20px;
    & >img{
        border-radius: 50%;
    }
    @media screen and (max-width: 950px) {
        display: none;
    }
`;

export {
    ProfileImageStyled,
    DefaultImageStyled,
}