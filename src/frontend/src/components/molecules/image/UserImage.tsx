import styled from "styled-components";
import {Image} from "@molecule/image/Image";


const UserImageStyled = styled(Image)`
    position: absolute;
    top: 40px;
    right: 20px;
    & >img{
        border-radius: 50%;
    }
`;

export {
    UserImageStyled,
}