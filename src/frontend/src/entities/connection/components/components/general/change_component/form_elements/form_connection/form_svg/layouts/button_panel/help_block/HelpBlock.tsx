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

import React, { useState } from "react";
import { withTheme } from "styled-components";
import { TooltipButton } from "@app_component/base/tooltip_button/TooltipButton";
import { TextSize } from "@app_component/base/text/interfaces";
import { HelpBlockProps } from "./interfaces";
import { HelpBlockStyled } from "./styles";

import { ColorTheme } from "@style/Theme";
import { useAppSelector } from "@application/utils/store";
import Dialog from "@app_component/base/dialog/Dialog";

const HelpBlock = () => {
  const [isVisible, setIsVisible] = useState(false);

  const { isButtonPanelOpened } = useAppSelector(
    (state) => state.connectionReducer
  );

  function toggleVisible() {
    setIsVisible(!isVisible);
  }

  return (
    <HelpBlockStyled isButtonPanelOpened={isButtonPanelOpened}>
      <div style={{display: 'flex', gap: '10px'}}>
      <TooltipButton
        size={TextSize.Size_40}
        position={"bottom"}
        icon={"video_library"}
        tooltip={"Help"}
        target={`help_connection_button`}
        hasBackground={true}
        background={ColorTheme.White}
        color={ColorTheme.Gray}
        padding="2px"
        handleClick={() => toggleVisible()}
      />
      <Dialog
        actions={[
          {
            label: "Close",
            id: "close_dialog",
            onClick: () => setIsVisible(!isVisible),
          },
        ]}
        title="Help"
        active={isVisible}
        toggle={() => setIsVisible(!isVisible)}
      ></Dialog>

      <TooltipButton
        position={"bottom"}
        icon={"menu_book"}
        tooltip={"Documentation"}
        target={`documentation`}
        hasBackground={true}
        background={ColorTheme.White}
        color={ColorTheme.Gray}
        padding="2px"
      />
      <TooltipButton
        position={"bottom"}
        icon={"keyboard"}
        tooltip={"Shortcuts"}
        target={`shortcuts`}
        hasBackground={true}
        background={ColorTheme.White}
        color={ColorTheme.Gray}
        padding="2px"
      />
      </div>
    </HelpBlockStyled>
  );
};

HelpBlock.defaultProps = {};

export { HelpBlock };

export default withTheme(HelpBlock);
