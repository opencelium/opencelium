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

import React, { FC, useEffect } from "react";

import { withTheme } from "styled-components";
import { ControlsBlockProps } from "./interfaces";
import { ControlsBlockStyled } from "./styles";
import ConfigurationsIcon from "@change_component/form_elements/form_connection/form_svg/details/configurations_icon/ConfigurationsIcon";
import { API_REQUEST_STATE } from "@application/interfaces/IApplication";
import { TooltipButton } from "@app_component/base/tooltip_button/TooltipButton";
import { useAppDispatch, useAppSelector } from "@application/utils/store";
import { setFullScreen as setFullScreenFormSection } from "@application/redux_toolkit/slices/ApplicationSlice";
import {
  setLogPanelHeight,
  LogPanelHeight,
  setButtonPanelVisibility,
} from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import { ColorTheme } from "@style/Theme";

const ControlsBlock: FC<ControlsBlockProps> = (props: any) => {
  const dispatch = useAppDispatch();

  const {
    addingConnection,
    updatingConnection,
    isTestingConnection,
    logPanelHeight,
    isButtonPanelOpened,
  } = useAppSelector((state) => state.connectionReducer);

  const { isFullScreen } = useAppSelector((state) => state.applicationReducer);

  const { data, connection, readOnly } = props;

  // useEffect(() => {
  //   if (isFullScreen) {
  //     window.scrollTo({
  //       top: findTopLeft(`technical_layout_svg`).top - 4,
  //       behavior: "auto",
  //     });
  //   }
  //   console.log(window.scrollY);
  // }, [dispatch, isFullScreen]);

  return (
    <ControlsBlockStyled isButtonPanelOpened={isButtonPanelOpened}>
      {!readOnly && (
        <TooltipButton
          position={"bottom"}
          icon={"save"}
          tooltip={"Save"}
          target={`save_connection_button`}
          hasBackground={true}
          background={
            addingConnection === API_REQUEST_STATE.START ||
            updatingConnection === API_REQUEST_STATE.START
              ? ColorTheme.Blue
              : ColorTheme.White
          }
          color={
            addingConnection === API_REQUEST_STATE.START ||
            updatingConnection === API_REQUEST_STATE.START
              ? ColorTheme.White
              : ColorTheme.Gray
          }
          padding="2px"
          isLoading={
            addingConnection === API_REQUEST_STATE.START ||
            updatingConnection === API_REQUEST_STATE.START
          }
          isDisabled={
            isTestingConnection ||
            addingConnection === API_REQUEST_STATE.START ||
            updatingConnection === API_REQUEST_STATE.START
          }
          handleClick={() => data.justUpdate(connection)}
        />
      )}

      <TooltipButton
        position={"bottom"}
        icon={isFullScreen ? "close_fullscreen" : "open_in_full"}
        tooltip={isFullScreen ? "Minimize" : "Maximize"}
        target={`fullscreen_connection_button`}
        hasBackground={true}
        background={isFullScreen ? ColorTheme.Blue : ColorTheme.White}
        color={isFullScreen ? ColorTheme.White : ColorTheme.Gray}
        padding="2px"
        handleClick={() => dispatch(setFullScreenFormSection(!isFullScreen))}
      />
      <TooltipButton
        position={"bottom"}
        icon={"menu"}
        tooltip={
          !isButtonPanelOpened ? "Show Button Panel" : "Hide Button Panel"
        }
        target={`show_button_panel`}
        hasBackground={true}
        background={isButtonPanelOpened ? ColorTheme.Blue : ColorTheme.White}
        color={isButtonPanelOpened ? ColorTheme.White : ColorTheme.Gray}
        padding="2px"
        handleClick={() =>
          dispatch(setButtonPanelVisibility(!isButtonPanelOpened))
        }
      />
      <TooltipButton
        position={"bottom"}
        icon={"sort"}
        tooltip={!logPanelHeight ? "Show Logs" : "Hide Logs"}
        target={`show_log_panel`}
        hasBackground={true}
        background={!logPanelHeight ? ColorTheme.White : ColorTheme.Blue}
        color={!logPanelHeight ? ColorTheme.Gray : ColorTheme.White}
        padding="2px"
        handleClick={() =>
          dispatch(setLogPanelHeight(!logPanelHeight ? LogPanelHeight.High : 0))
        }
      />
      <ConfigurationsIcon />
    </ControlsBlockStyled>
  );
};

ControlsBlock.defaultProps = {};

export { ControlsBlock };

export default withTheme(ControlsBlock);
