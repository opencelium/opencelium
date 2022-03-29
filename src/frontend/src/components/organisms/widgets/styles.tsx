import styled from "styled-components";

const CurrentSchedulesWidgetStyled = styled.div`
    position: relative;
    overflow-y: auto;
    overflow-x: hidden;
    height: 100%;
    padding: 1vw 1vw 0.5vw;
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
    transition: all 0.3s cubic-bezier(.25,.8,.25,1);
`;

const ConnectionOverviewWidgetStyled = styled.div`
    height: 100%;
    position: relative;
    &:first-child:first-child:focus{
        outline: none !important;
    }
    background: white;
    padding: 1vw 1vw 0.5vw;
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
    transition: all 0.3s cubic-bezier(.25,.8,.25,1);
`;

const MonitoringBoardsWidgetStyled = styled.div`
    padding: 1vw 1vw 0.5vw;
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
    transition: all 0.3s cubic-bezier(.25,.8,.25,1);
    height: calc(100% - 55px);
    max-width: 100%;
    &>iframe{
        border: none;
        width: 100%;
        height: calc(100% - 50px) !important;
    }
`;

export {
    CurrentSchedulesWidgetStyled,
    ConnectionOverviewWidgetStyled,
    MonitoringBoardsWidgetStyled,
}