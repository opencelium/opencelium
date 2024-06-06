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

import React from "react";
import TestConnectionButton from "@change_component/form_elements/form_connection/form_svg/details/TestConnection";
import { withTheme } from "styled-components";
import { TestBlockProps } from "./interfaces";
import { TestBlockStyled } from "./styles";
import { useAppSelector } from "@application/utils/store";

const TestBlock = ({data, theme}:{data?: any, theme: any}) => {
  const { isButtonPanelOpened } = useAppSelector(
    (state) => state.connectionReducer
  );

  return (
    <TestBlockStyled isButtonPanelOpened={isButtonPanelOpened}>
      <TestConnectionButton data={data}/>
    </TestBlockStyled>
  );
};

TestBlock.defaultProps = {};

export { TestBlock };

export default withTheme(TestBlock);
