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

import React, { FC } from "react";

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
  setSavePanelVisibility,
  setTemplatePanelVisibility
} from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import { ColorTheme } from "@style/Theme";
import { TextSize } from "@app_component/base/text/interfaces";
import AddTemplate from "@entity/connection/components/components/general/change_component/form_elements/form_connection/form_methods/AddTemplate";
import LoadTemplate from "@change_component/form_elements/form_connection/form_methods/LoadTemplate";
import DataAggregatorButton from "@entity/data_aggregator/components/dialog_button/DataAggregatorButton";
import { CONNECTOR_FROM } from "@entity/connection/components/classes/components/content/connection/CConnectorItem";

const ControlsBlock: FC<ControlsBlockProps> = (props: any) => {
  const dispatch = useAppDispatch();
  const {
    addingConnection,
    updatingConnection,
    isTestingConnection,
    logPanelHeight,
    isButtonPanelOpened,
    isSavePanelVisible,
    isTemplatePanelVisible
  } = useAppSelector((state) => state.connectionReducer);

  const { isFullScreen } = useAppSelector((state) => state.applicationReducer);

  const { data, connection, entity, updateEntity, currentTechnicalItem, setCurrentTechnicalItem } = props;

  let saveAndExit: any, saveAndGoToSchedule: any, loadTemplateData: any;

  if(data.additionalButtonsProps){
    saveAndExit = data.additionalButtonsProps.saveAndExit.onClick;
    saveAndGoToSchedule = data.additionalButtonsProps.saveAndGoToSchedule.onClick;
    loadTemplateData = data.additionalButtonsProps.loadTemplate.data;
  }

  const toggleVisibleSavePanel = () => {
    dispatch(setSavePanelVisibility(!isSavePanelVisible))
  }

  const toggleVisibleTemplatePanel = () => {
    dispatch(setTemplatePanelVisibility(!isTemplatePanelVisible))
  }

  return (
    <ControlsBlockStyled isButtonPanelOpened={isButtonPanelOpened}>

      {/* hide panel */}
      <div className="center_item">
        <div className="button_wrap">
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
        </div>
      </div>
      
      {/* resize */}
      <div className="wrapper">
        <div className="button_wrap">
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
        </div>
      </div>

      {/* logs */}
      <div className="wrapper">
        <div className="button_wrap">
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
        </div>
      </div>


      {/* settings */}
      <div className="wrapper">
        <div className="button_wrap">
          <ConfigurationsIcon />
        </div>
      </div>

      <div className="wrapper">
        <div className="button_wrap">
          <DataAggregatorButton
            tooltipButtonProps={{
              position: "bottom",
              icon: "subtitles",
              tooltip: 'Aggregator',
              target: 'aggregator',
              hasBackground: true,
              padding: "2px"
            }}
            connection={entity}
            updateConnection={(e: any) => {
              updateEntity(e);
              if(currentTechnicalItem){
                const connector = currentTechnicalItem.connectorType === CONNECTOR_FROM ? e.fromConnector : e.toConnector;
                const currentItem = connector.getSvgElementByIndex(currentTechnicalItem.entity.index);
                setCurrentTechnicalItem(currentItem.getObject());
              }
            }}
          />
        </div>
      </div>

      <div className="wrapper">
        <div className="button_wrap">
          {!data.readOnly && (
            <TooltipButton
              size={TextSize.Size_40}
              position={"bottom"}
              icon={"text_snippet"}
              tooltip={"Templates"}
              target={`template_panel`}
              hasBackground={true}
              background={!isTemplatePanelVisible ? ColorTheme.White : ColorTheme.Blue}
              color={!isTemplatePanelVisible ? ColorTheme.Gray : ColorTheme.White}
              padding="2px"
              handleClick={() => toggleVisibleTemplatePanel()}
            />
          )}
          {isTemplatePanelVisible && (
            <div className="additional_panel additional_panel_template">
              {/* add template */}
              <AddTemplate
                tooltipButtonProps={{
                  position: "bottom",
                  icon: "add",
                  tooltip: 'Add template',
                  target: 'add_template',
                  hasBackground: true,
                  padding: "2px"
                }}
                data={data}
                entity={entity}
              />

              {/* load template */}
              <LoadTemplate 
                data={loadTemplateData}
                entity={entity}
                updateEntity={updateEntity}
                tooltipButtonProps={{
                  position: "bottom",
                  icon: "download",
                  tooltip: 'Load template',
                  target: 'load_template',
                  hasBackground: true,
                  padding: "2px"
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* save panel */}
      <div className="wrapper">
        <div className="button_wrap">
          {/* toggle save panel */}
          {!data.readOnly && (
            <TooltipButton
            size={TextSize.Size_40}
            position={"bottom"}
            icon={"save_as"}
            tooltip={"Save as"}
            target={`save_panel`}
            hasBackground={true}
            background={!isSavePanelVisible ? ColorTheme.White : ColorTheme.Blue}
            color={!isSavePanelVisible ? ColorTheme.Gray : ColorTheme.White}
            padding="2px"
            handleClick={() => toggleVisibleSavePanel()}
          />
          )}
          {isSavePanelVisible && (
            <div className="additional_panel additional_panel_save">
              {/* save */}
              <TooltipButton
                position={"bottom"}
                icon={"save"}
                tooltip={"Save"}
                target={`save_connection_button`}
                hasBackground={true}
                background={ColorTheme.White}
                color={ColorTheme.Gray}
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
              
              {/* add/update and close */}
              <TooltipButton
                position={"bottom"}
                icon={"close"}
                tooltip={"Save & Close"}
                target={`save_and_exit_connection_button`}
                hasBackground={true}
                background={ColorTheme.White}
                color={ColorTheme.Gray}
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
                onClick={() => saveAndExit(entity)}
              />

              {/* add/update and go add/update schedule */}
              <TooltipButton
                position={"bottom"}
                icon={"update"}
                tooltip={"Save & Go to Scheduler"}
                target={`save_and_go_to_scheduler_connection_button`}
                hasBackground={true}
                background={ColorTheme.White}
                color={ColorTheme.Gray}
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
                handleClick={() => saveAndGoToSchedule(entity, '/schedules/add', true)}
              />
            </div>
          )}
        </div>
      </div>
    </ControlsBlockStyled>
  );
};

ControlsBlock.defaultProps = {};

export { ControlsBlock };

export default withTheme(ControlsBlock);
