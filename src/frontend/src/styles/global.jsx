/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';
import chroma from "chroma-js";
import {createGlobalStyle} from "styled-components";
import {ColorTheme} from "@style/Theme";
import {SlickCarousel} from "./slick_carousel";


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
    @-webkit-keyframes dash {
      to {
        stroke-dashoffset: 1000;
      }
    }
    .fade{
        transition: none !important;
    }
    .hide_dialog_content{
        border: none;
    }
    .error-ace-marker{
        position: absolute; 
        background: red;
    }
    #notificationTemplateContent>.ace_scroller.ace_scroll-left:after{
        box-shadow: none !important;
    }
    .tooltip{
        z-index: 1000000 !important;
    }
    ${SlickCarousel}
`;
