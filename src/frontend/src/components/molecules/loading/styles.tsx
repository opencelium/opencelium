import styled from "styled-components";
import Icon from "@atom/icon/Icon";
import {Loading} from "@molecule/loading/Loading";

const LoadingStyled = styled(Icon)`
    margin: 0 auto;
`;

const GridImageLoadingStyled = styled(Loading)`
    transform: translate(-57%,32%);
`;

const LayoutLoadingStyled = styled(Loading)`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%,-50%);
`;

const ContentLoadingStyled = styled(Loading)`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%,-50%);
`;

export {
    LoadingStyled,
    LayoutLoadingStyled,
    ContentLoadingStyled,
    GridImageLoadingStyled,
}