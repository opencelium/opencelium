import styled from "styled-components";

const ColorRowStyled = styled.div`
    display: flex;
    justify-content: space-between;
    margin: 0 8px 20px;
`;

const PreviewStyled = styled.div`
    border: 1px solid #eee;
    padding: 0 10px 0 115px;
    border-radius: 10px;
    position: relative;
`;

const HeaderStyled = styled.div`
    margin: 10px;
`;
const NameStyled = styled.div`
    text-align: center;
    margin-bottom: 10px;
`;

const ActionsStyled = styled.div`
    display: flex;
    justify-content: flex-end;
`;

export {
    ColorRowStyled,
    PreviewStyled,
    HeaderStyled,
    NameStyled,
    ActionsStyled,
}