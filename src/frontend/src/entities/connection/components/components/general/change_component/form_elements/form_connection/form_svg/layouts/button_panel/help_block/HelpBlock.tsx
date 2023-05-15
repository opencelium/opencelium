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

import React, { useState, createContext, useEffect } from "react";
import { withTheme } from "styled-components";
import { TooltipButton } from "@app_component/base/tooltip_button/TooltipButton";
import { TextSize } from "@app_component/base/text/interfaces";
import { HelpBlockProps } from "./interfaces";
import { HelpBlockStyled } from "./styles";

import { ColorTheme } from "@style/Theme";
import { useAppDispatch, useAppSelector } from "@application/utils/store";
import Dialog from "@app_component/base/dialog/Dialog";

// @ts-ignore
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";

import Content from "./content/Content";
import FormConnectionSvg from "../../../FormConnectionSvg";
import { ModalContext } from "@entity/connection/components/components/general/change_component/FormSection";
import { HelpBlockData } from "./HelpBlockData";
import CConnection from "@classes/content/connection/CConnection";
import {setModalConnectionData} from "@root/redux_toolkit/slices/ModalConnectionSlice";
import {CONNECTOR_FROM} from "@classes/content/connection/CConnectorItem";
import { Connector } from "@entity/connector/classes/Connector";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";

const HelpBlock = () => {
  const dispatch = useAppDispatch();
  const {connectors, gettingConnectors} = Connector.getReduxState();
  const [connection, setConnection] = useState(CConnection.createConnection(HelpBlockData));
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
      if(gettingConnectors === API_REQUEST_STATE.FINISH) {
          let fromConnector = connectors.find(c => c.connectorId === HelpBlockData.fromConnector.connectorId);
          let toConnector = connectors.find(c => c.connectorId === HelpBlockData.toConnector.connectorId);
          if (fromConnector && toConnector) {
              connection.fromConnector.id = fromConnector.connectorId;
              connection.fromConnector.title = fromConnector.title;
              //@ts-ignore
              connection.fromConnector.invoker = fromConnector.invoker;
              connection.fromConnector.setConnectorType(CONNECTOR_FROM);
              connection.toConnector.id = toConnector.connectorId;
              connection.toConnector.title = toConnector.title;
              //@ts-ignore
              connection.toConnector.invoker = toConnector.invoker;
              connection.toConnector.setConnectorType(CONNECTOR_FROM);
              setConnection(connection);
          }
      }
  }, [gettingConnectors]);

  function toggleVisible() {
    setIsVisible(!isVisible);
  }

  const updateEntity = (updatedEntity: any) => {
      setConnection(updatedEntity);
      let connection = updatedEntity instanceof CConnection ? updatedEntity.getObjectForConnectionOverview() : updatedEntity;
      dispatch(setModalConnectionData({connection}));
  }

  const { isButtonPanelOpened, videoAnimationName } = useAppSelector(
    (state) => state.connectionReducer
  );

  return (
    <HelpBlockStyled isButtonPanelOpened={isButtonPanelOpened}>
      <div style={{ display: "flex", gap: "10px" }}>
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
          actions={[]}
          title="Videoanimations"
          active={isVisible}
          toggle={() => setIsVisible(!isVisible)}
          dialogTheme={{
            content: `${styles.help_dialog_content}`,
            body: `${styles.help_dialog_body}`,
            footer: `${styles.help_dialog_footer}`,
            backdrop: `${styles.help_dialog_backdrop}`,
          }}
          dialogClassname={`${styles.help_dialog}`}
        >
          <ModalContext.Provider value={{ isModal: true }}>
            {
              <FormConnectionSvg
                data={{ readOnly: false }}
                entity={connection}
                updateEntity={updateEntity}
              />
            }
          </ModalContext.Provider>
          <Content />
        </Dialog>

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
