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

import ProgressBar from 'react-toolbox/lib/progress_bar';
import styled from "styled-components";
import chroma from "chroma-js";
import { ITheme } from '@style/Theme';

const ProgressBarElementStyled = styled.div`
    height: 33px;
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
    line-height: 33px;
    position: absolute;
    z-index: 1;
    color: #000000;
    left: 0;
    padding-left: 10px;
    font-size: 16px;
    & span{
        padding: 5px 5px 5px 5px;
        background: #fea532;
        border-radius: 5px 5px 5px 5px;
    }
`;

const ProgressBarTitleStyled = styled.div`
    line-height: 33px;
    position: absolute;
    z-index: 1;
    color: #ffffff;
    text-align: center;
    width: 100%;
    font-size: 16px;
`;

const BarSectionStyled = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    padding-bottom: 10px;
`;

const ProgressBarToStyled = styled.div`
    line-height: 33px;
    position: absolute;
    z-index: 1;
    color: #000000;
    padding-right: 10px;
    right: 25px;
    text-align: right;
    font-size: 16px;
    span{
        padding: 5px 5px 5px 5px;
        background: #fea532;
        border-radius: 5px 5px 5px 5px;
    }
`;

const ProgressBarStyled = styled(ProgressBar)`
    height: 33px !important;
    border-radius: 0.25rem;
    float: left;
    &> div{
        & span:first-child{
            background-color: ${({theme}: {theme: ITheme}) => theme?.progressBarElement?.background ? chroma(theme.progressBarElement.background).alpha(0.4).toString() : '#c6cbe9'};
            background-image: none;
        }
        & span:last-child{
            background-color: ${({theme}: {theme: ITheme}) => theme?.progressBarElement?.background || '#3f51b5'};
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
    BarSectionStyled,
}
