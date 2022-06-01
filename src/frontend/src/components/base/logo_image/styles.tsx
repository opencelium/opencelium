import styled from "styled-components";
import Loading from "@app_component/base/loading/Loading";

const LogoImageStyled = styled.img`
    width: 2.5rem;
    height: auto;
    border-radius: 5px;
`;
const LoadingStyled = styled(Loading)`
    width: 2.5rem;
    height: 2.5rem;
    background: none !important;
`;

export {
    LogoImageStyled,
    LoadingStyled,
}