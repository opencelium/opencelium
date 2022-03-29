import React from 'react';
import chroma from "chroma-js";
import {createGlobalStyle} from "styled-components";
import {ColorTheme} from "../components/general/Theme";
import {ReactCropStyles} from "./react_crop";
import {ReactGridLayoutStyled} from "./react_grid_layout";
import {ReactResizableStyles} from "./react_resizable";


export const Global = createGlobalStyle`
    body{
        background: #eee;
        position: relative;
        margin: 0;
        transition: .5s;
        overflow-x: hidden;
    }
    *{
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    input[type='checkbox']{
        &:focus, &:focus-visible{
            background: ${ColorTheme.Blue};
            box-shadow: 0 0 0 0.2rem ${chroma(ColorTheme.Blue).alpha(0.4)};
            outline: none;
        }
    }
    .fade{
        transition: none !important;
    }
    ${ReactCropStyles}
    ${ReactGridLayoutStyled}
    ${ReactResizableStyles}
`;
