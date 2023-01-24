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

import styled from "styled-components";
import {InvokerDetailsStyledProps} from "./interfaces";

const InvokerIconStyled = styled.img`
    width: 150px;
    float: left;
    margin-right: 20px;
`;

const InvokerDetailsStyled = styled.div<InvokerDetailsStyledProps>`
    float: right;
    width: ${({hasIcon}) => hasIcon ? `calc(100% - 170px)` : '100%'};
`;

const InvokerNameStyled = styled.div`
    margin-bottom: 15px;
`;

const InvokerDescriptionStyled = styled.div`
`;


const SectionStyled = styled.div`
    padding: 0 15px;
    margin-bottom: 20px !important;
`;

const HeaderStyled = styled.div`
    font-weight: bold;
    margin-top: 15px;
    margin-bottom: 5px;
`;

const ContentStyled = styled.div`
    margin-bottom: 5px;
    margin-left: 15px;
    margin-top: 15px;
`;

const DescriptionStyled = styled.div`
`;
const TitleStyled = styled.div`
`;

export {
    InvokerDetailsStyled,
    InvokerDescriptionStyled,
    InvokerIconStyled,
    InvokerNameStyled,
    SectionStyled,
    HeaderStyled,
    ContentStyled,
    DescriptionStyled,
    TitleStyled,
}