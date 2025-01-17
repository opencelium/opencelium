import styled from "styled-components";

export const LogsButtonStyled = styled.div`
    height: 100%;
    margin-bottom: 20px;
    display: grid;
`;
export const MaskedText = styled.span<{masked: boolean}>`
    opacity: ${({masked}) => masked ? 0.4 : 1};
`;
export const Label = styled.div`
    font-size: 18px;
    color: #000;
    margin-bottom: 10px;
    display: flex;
    gap: 5px;
    justify-content: space-between;
`;
export const UrlStyled = styled.button`
    user-select: none;
    cursor: pointer;
    background-color: #fff;
    display: flex;
    padding-left: 10px;
    justify-content: start;
    align-items: center;
    height: 40px;
    border: 1px solid #aaa;
    border-radius: 5px;
    margin-bottom: 10px;
`;
export const HeaderStyled = styled.div`
    user-select: none;
    cursor: pointer;
    width: 100%;
    height: 100px;
    border: 1px solid #aaa;
    border-radius: 5px;
    margin-bottom: 10px;
    padding: 10px 0 0;
    &>table{
        padding: 10px 10px 5px;
        width: 100%;
        &>tr {
            &>td {
                width: 50%;
                padding-left: 10px;
            }
        }
    }
    &>div{
        text-align: center;
    }
`;
export const HeaderItemStyled = styled.div`
    margin-left: 10px;
    margin-top: 5px;
`;
export const PayloadStyled = styled.div`
    display: flex;
    gap: 20px;
    margin-bottom: 10px;
`;
export const RequestStyled = styled.div`
    position: relative;
    width: 100%;
    height: 200px;
`;
export const RequestContent = styled.div`
    width: 100%;
    height: 200px;
    border: 1px solid #aaa;
    border-radius: 5px;
    padding-left: 10px;
    padding-top: 10px;
    cursor: pointer;
    user-select: none;
`;
export const ResponseStyled = styled.div`
    width: 100%;
    height: 200px;
    position: relative;
`;
export const ResponseContent = styled.div`
    width: 100%;
    height: 200px;
    border: 1px solid #aaa;
    border-radius: 5px;
    padding-left: 10px;
    padding-top: 10px;
    cursor: pointer;
    user-select: none;
`;

export const Clicker = styled.div`
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 1;
    cursor: pointer;
`;
