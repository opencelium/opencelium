import styled from "styled-components";

const CurrentSchedulesStyled = styled.div`
    padding: 1vw 1vw 0.5vw;
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
    transition: all 0.3s cubic-bezier(.25,.8,.25,1);
    &> div{
        margin: 20px 0;
    }
`;

const HeaderStyled = styled.div`
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 30px;
`;

const EmptyListStyled = styled.div`
`;

export {
    CurrentSchedulesStyled,
    HeaderStyled,
    EmptyListStyled,
}