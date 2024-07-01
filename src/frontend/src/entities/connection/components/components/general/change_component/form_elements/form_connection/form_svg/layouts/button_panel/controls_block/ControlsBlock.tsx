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

import React, { FC, useEffect, useState } from "react";

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
import { getAllConnections } from "@entity/connection/redux_toolkit/action_creators/ConnectionCreators";
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
    isTemplatePanelVisible,
    connections
  } = useAppSelector((state) => state.connectionReducer);

  useEffect(() => {
    dispatch(getAllConnections())
  }, [])

  const { isFullScreen } = useAppSelector((state) => state.applicationReducer);

  const { data, connection, entity, updateEntity, currentTechnicalItem, setCurrentTechnicalItem } = props;

  let saveAndExit: any, saveAndGoToSchedule: any, loadTemplateData: any;

  const [titleData, setTitleData] = useState<{title?: string, fromConfigurations?: boolean}>({});
  const [descriptionData, setDescriptionData] = useState<{description?: string, fromConfigurations?: boolean}>({});

  const [errorAction, setErrorAction] = useState({});

  if(data.additionalButtonsProps){
    saveAndExit = data.additionalButtonsProps.saveAndExit.onClick;
    saveAndGoToSchedule = data.additionalButtonsProps.saveAndGoToSchedule.onClick;
    loadTemplateData = data.additionalButtonsProps?.loadTemplate?.data || null;
  }

  const toggleVisibleSavePanel = () => {
    dispatch(setSavePanelVisibility(!isSavePanelVisible))
  }

  const toggleVisibleTemplatePanel = () => {
    dispatch(setTemplatePanelVisibility(!isTemplatePanelVisible))
  }

  const getTitle = (title: any) => {
    setTitleData({title, fromConfigurations: true})
  }

  const getDescription = (description: any) => {
    setDescriptionData({description, fromConfigurations: true})
  }

  const checkTitle = ({title, fromConfigurations}: any) => {
    const specialCharacters = /[\/\\]/;
    const connectionExist = connections.find(c => c.title === title && c.id !== connection.id);
    if (title === '' && fromConfigurations) {
      return {error: true, message: 'Title is a required field'};
    }
    else if(specialCharacters.test(title)){
      return {error: true, message: 'Title cannot contain \"/\" and \"\\\" characters'};
    }
    else if(connectionExist){
      return {error: true, message: 'Connection with such title already exist'};
    }
    else{
      return {error: false, message: ''}
    }
  }

  const updateConnection = (action: string) => {
    const check = checkTitle(titleData);
    if(check.error){
      setErrorAction(check);
    }
    else{
      if(titleData.fromConfigurations){
        connection.title = titleData.title;
      }
      if(descriptionData.fromConfigurations){
        connection.description = descriptionData.description;
      }
      if(action === 'update'){
        data.justUpdate(connection)
      }
      else if(action === 'saveAndExit'){
        saveAndExit(connection)
      }
      else if(action === 'saveAndGoToSchedule'){
        saveAndGoToSchedule(connection, '/schedules/add', true)
      }
    }
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
          <ConfigurationsIcon connection={connection} updateConnection={updateEntity} readOnly={props.readOnly} getTitle={getTitle} errorAction={errorAction} getDescription={getDescription}/>
        </div>
      </div>

      <div className="wrapper">
        <div className="button_wrap">
          <DataAggregatorButton
            readOnly={props.readOnly}
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

      <div className="wrapper" style={{zIndex: 10}}>
        <div className="button_wrap">
            <TooltipButton
              isDisabled={data.readOnly}
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
          <TooltipButton
            isDisabled={data.readOnly}
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
                handleClick={() => updateConnection('update')}
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
                onClick={() => updateConnection('saveAndExit')}
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
                handleClick={() => updateConnection('saveAndGoToSchedule')}
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
