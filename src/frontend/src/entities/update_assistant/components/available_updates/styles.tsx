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
import Button from "@basic_components/buttons/Button";

const ImportButtonStyled = styled(Button)`
    margin: 0 110px 0 0;
    padding: 15px 10px;
    width: 100px;
    justify-content: center;
`;

const ExportButtonStyled = styled(Button)`
    padding: 15px 10px;
    width: 100px;
    justify-content: center;
`;

export {
    ImportButtonStyled,
    ExportButtonStyled,
}