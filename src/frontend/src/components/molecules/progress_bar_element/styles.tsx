import styled from "styled-components";
import ProgressBar from 'react-toolbox/lib/progress_bar';

const ProgressBarElementStyled = styled.div`
    height: 15px;
    margin-bottom: 10px;
`;


const ProgressBarIteratorStyled = styled.div`
    font-size: 16px;
    float: left;
    width: 3%;
`;

const ProgressBarSectionStyled = styled.div`
  position: relative;
  float: left;
  width: 97%;
`;

const ProgressBarFromStyled = styled.div`
    line-height: 17px;
    position: absolute;
    z-index: 1;
    color: #000000;
    padding-left: 10px;
    font-size: 16px;
    & span{
        padding: 5px 5px 5px 5px;
        background: #fea532;
        border-radius: 5px 5px 5px 5px;
    }
`;

const ProgressBarTitleStyled = styled.div`
    line-height: 17px;
    position: absolute;
    z-index: 1;
    color: #ffffff;
    text-align: center;
    width: 100%;
    font-size: 16px;
`;

const ProgressBarToStyled = styled.div`
    line-height: 17px;
    position: absolute;
    z-index: 1;
    color: #000000;
    padding-right: 10px;
    right: 0;
    text-align: right;
    font-size: 16px;
    span{
        padding: 5px 5px 5px 5px;
        background: #fea532;
        border-radius: 5px 5px 5px 5px;
    }
`;

const ProgressBarStyled = styled(ProgressBar)`
    top: -8px;
    height: 33px !important;
    margin-bottom: 10px;
    border-radius: 0.25rem;
    float: left;
    &> div{
        & span:first-child{
            background-color: #9dacba;
            background-image: none;
        }
        & span:last-child{
            background-color: #012e55;
        }
    }
`;

export {
    ProgressBarElementStyled,
    ProgressBarIteratorStyled,
    ProgressBarSectionStyled,
    ProgressBarFromStyled,
    ProgressBarTitleStyled,
    ProgressBarToStyled,
    ProgressBarStyled,
}