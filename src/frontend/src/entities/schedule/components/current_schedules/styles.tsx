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
import {Text} from "@app_component/base/text/Text";
import {Card} from "@app_component/base/card/Card";
import DefaultText from "@app_component/base/text/DefaultText";

const CurrentSchedulesStyled = styled(Card)`
    padding: 1vw 1vw 0.5vw;
    background-color: #fff;
    border-radius: 5px;
    transition: all 0.3s cubic-bezier(.25,.8,.25,1);
    &> div{
        margin: 20px 0;
    }
    margin-bottom: 20px;
`;

const HeaderStyled = styled.div`
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 30px;
`;

const EmptyListStyled = styled(DefaultText)`
`;

export {
    CurrentSchedulesStyled,
    HeaderStyled,
    EmptyListStyled,
}
