import styled from "styled-components";

const LikePercentageStyled = styled.div`
    float: left;
    width: ${({isLikeOperator}) => isLikeOperator ? '5%' : 0};
    opacity: ${({isLikeOperator}) => isLikeOperator ? 1 : 0};
    text-align: center;
    height: 38px;
    border-bottom: 1px solid #2121211f !important;
    transition: width 0.3s ease 0s;
    &>div{
        opacity: ${({hasSign}) => hasSign ? 1 : 0.5};
        font-weight: ${({hasSign}) => hasSign ? 'bold' : 'normal'};
        display: flex;
        justify-content: center;
        height: 100%;
        align-items: center;
    }
    &>div:hover{
        cursor: pointer;
    }
    &>div:active{
        font-weight: 500;
    }
`;

export {
    LikePercentageStyled,
}