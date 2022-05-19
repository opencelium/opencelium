/*
 *  Copyright (C) <2022>  <becon GmbH>
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

const ProgressBarElementStyled = styled.div`
    height: 15px;
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
    line-height: 17px;
    position: absolute;
    z-index: 1;
    color: #000000;
    padding-left: 10px;
    font-size: 16px;
    & span{
        padding: 5px 5px 5px 5px;
        background: #fea532;
        border-radius: 5px 5px 5px 5px;
    }
`;

const ProgressBarTitleStyled = styled.div`
    line-height: 17px;
    position: absolute;
    z-index: 1;
    color: #ffffff;
    text-align: center;
    width: 100%;
    font-size: 16px;
`;

const ProgressBarToStyled = styled.div`
    line-height: 17px;
    position: absolute;
    z-index: 1;
    color: #000000;
    padding-right: 10px;
    right: 0;
    text-align: right;
    font-size: 16px;
    span{
        padding: 5px 5px 5px 5px;
        background: #fea532;
        border-radius: 5px 5px 5px 5px;
    }
`;

const ProgressBarStyled = styled(ProgressBar)`
    top: -8px;
    height: 33px !important;
    margin-bottom: 10px;
    border-radius: 0.25rem;
    float: left;
    &> div{
        & span:first-child{
            background-color: #c6cbe9;
            background-image: none;
        }
        & span:last-child{
            background-color: #3f51b5;
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
}