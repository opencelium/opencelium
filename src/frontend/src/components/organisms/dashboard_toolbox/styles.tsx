import styled from "styled-components";

const ToolboxItemStyled = styled.div`
    display: inline-block;
    text-align: center;
    line-height: 50px;
    cursor: pointer;
    width: 55px;
    height: 55px;
    margin: 5px 10px;
    border: 1px solid #aaaaaa;
    background-color: #fff;
    border-radius: 3px;
    & >button{
        vertical-align: middle;
    }
`;

const DashboardToolboxStyled = styled.div`
    background-color: #f8f8f8;    
    width: calc(100% - 40px);
    margin-left: 20px;
    height: 75px;
    min-height: 75px;
    margin-bottom: 30px;
    padding: 5px;
`;

const TitleStyled = styled.div`
    display: inline-block;
    text-align: center;
    line-height: 65px;
    height: 65px;
    border-radius: 3px;
    float: left;
    font-size: 16px;
`;

const ToolboxItemsStyled = styled.div`
    white-space: nowrap;
    display: block;
    overflow-x: auto;
    overflow-y: hidden;
    
    &:-webkit-scrollbar {
        width: 5px;
        height: 5px;
    }
    &:-webkit-scrollbar-track {
        background: #888;
    }
    &:-webkit-scrollbar-thumb {
        background: #464646;
    }
    &:-webkit-scrollbar-thumb:hover {
        background: #111;
    }
`;
export {
    ToolboxItemStyled,
    DashboardToolboxStyled,
    TitleStyled,
    ToolboxItemsStyled,
}