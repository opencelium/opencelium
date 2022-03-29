import styled from "styled-components";
import {ReactGridLayoutStyledProps, WidgetItemStyledProps} from "@page/dasboard/interfaces";

import RGL, {WidthProvider} from "react-grid-layout";
import Button from "@atom/button/Button";
import Title from "@molecule/collection_title/Title";

const ReactGridLayout = WidthProvider(RGL);
const DashboardFormStyled = styled.div`
    width: calc(100% + 40px);
    margin-left: -20px;
}
`;

const TitleStyled = styled(Title)`
    margin-left: 20px;
    margin-bottom: 20px;
`;

const RemoveButtonStyled = styled(Button)`
    position: absolute;
    right: 15px;
    top: 15px;
    z-index: 1;
`;

const WidgetItemStyled = styled.div<WidgetItemStyledProps>`
    background-clip: border-box;
    border: 1px solid #eee;
    border-radius: 4px;
    padding: 10px;
    min-height: 430px;
    ${({isWidgetEditOn}) => isWidgetEditOn ? `
    cursor: move !important;
    &:hover{
        background-color: #f3f3f3;
    }
    ` : ''}
`;

const DashboardViewStyled = styled.div`
    margin-top: -10px;
`;

const ReactGridLayoutStyled = styled(ReactGridLayout)<ReactGridLayoutStyledProps>`
    ${({isWidgetEditOn}) => isWidgetEditOn ? `
        padding: 0;
        border: 1px solid #eee;
  ` : ''}
    ${({isLayoutEmpty}) => isLayoutEmpty ? `
        font-family: "Arial", sans-serif;
        width: 100%;
        text-align: center;
        font-size: 34px;
        letter-spacing: 5px;
        opacity: 0.3;
        height: 100px;
        min-height: 100px;
        &:before{
            content: 'Widgets Area';
            line-height: 100px;
        }
    ` : ''}
  
`

export {
    DashboardFormStyled,
    TitleStyled,
    WidgetItemStyled,
    DashboardViewStyled,
    ReactGridLayoutStyled,
    RemoveButtonStyled,
}