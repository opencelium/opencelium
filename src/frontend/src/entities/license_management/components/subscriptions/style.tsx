import styled from "styled-components";


export const InfoStyled = styled.div`
    display: flex;
    justify-content: space-between;
`;
export const DivisionsStyled = styled.div`
    position: absolute;
    display: flex;
    justify-content: space-between;
    width: 100%;
`;

export const DivisionStyled = styled.div`
    width: 1px;
    position: relative;
`;

export const LabelStyled = styled.div`  
    position: absolute;
    bottom: -25px;
    width: 50px;
    text-align: center;
    left: -22.5px;
`;

export const NowValueStyled = styled.div`
    position: absolute;
    top: -38px;
    background: #3b82f6;
    color: #fff;
    padding: 5px;
    border-radius: 5px;
    transform: translateX(-50%);
`;
