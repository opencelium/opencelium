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
import {HelpBlockAllData} from "./HelpBlockData";
import CConnection from "@classes/content/connection/CConnection";
import {setModalConnectionData, setModalCurrentTechnicalItem} from "@root/redux_toolkit/slices/ModalConnectionSlice";
import {CONNECTOR_FROM, CONNECTOR_TO} from "@classes/content/connection/CConnectorItem";
import { Connector } from "@entity/connector/classes/Connector";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {sortByIndex} from "@application/utils/utils";
import {setVideoAnimationName} from "@root/redux_toolkit/slices/ConnectionSlice";


const prepareConnection = (connection: any, connectors: any,) => {
    if(connection) {
        let fromConnector = connectors.find((c: any) => c.connectorId === connection.fromConnector.id);
        let toConnector = connectors.find((c: any) => c.connectorId === connection.toConnector.id);
        connection.fromConnector.methods = [];
        connection.fromConnector.operators = [];
        //@ts-ignore
        connection.fromConnector.invoker = fromConnector.invoker;
        connection.fromConnector.setConnectorType(CONNECTOR_FROM);
        connection.toConnector.methods = [];
        connection.toConnector.operators = [];
        //@ts-ignore
        connection.toConnector.invoker = toConnector.invoker;
        connection.toConnector.setConnectorType(CONNECTOR_TO);
    }
    return connection;
}


const HelpBlock = () => {
    const dispatch = useAppDispatch();
    const [animationProps, setAnimationProps] = useState<any>({index: -1, connection: CConnection.createConnection(), allItems: {fromConnector: [], toConnector: []}})
    const {connectors, gettingConnectors} = Connector.getReduxState();
    const [isVisible, setIsVisible] = useState(false);
    const { isButtonPanelOpened, videoAnimationName } = useAppSelector(
        (state) => state.connectionReducer
    );
    const [timeOutId, setTimeOutId] = useState(null);
    useEffect(() => {
        if(videoAnimationName !== ''){
            let connection = CConnection.createConnection(HelpBlockAllData[videoAnimationName]);
            let allItems = {
                fromConnector: sortByIndex([...connection.fromConnector.methods, ...connection.fromConnector.operators]),
                toConnector: sortByIndex([...connection.toConnector.methods, ...connection.toConnector.operators])
            }
            setAnimationProps({
                index: 0,
                connection: prepareConnection(connection, connectors),
                allItems,
            })
        }
        if(timeOutId) {
            clearTimeout(timeOutId);
            setTimeOutId(null);
        }
    }, [videoAnimationName])
    useEffect(() => {
        if(isButtonPanelOpened && videoAnimationName) {
            if (animationProps.index >= 0 && animationProps.index < animationProps.allItems.fromConnector.length + animationProps.allItems.toConnector.length) {
                if (animationProps.index < animationProps.allItems.fromConnector.length) {
                    if (animationProps.allItems.fromConnector[animationProps.index].hasOwnProperty('type')) {
                        animationProps.connection.fromConnector.operators.push(animationProps.allItems.fromConnector[animationProps.index]);
                    } else {
                        animationProps.connection.fromConnector.methods.push(animationProps.allItems.fromConnector[animationProps.index]);
                    }
                    animationProps.connection.fromConnector.setSvgItems();
                    dispatch(setModalCurrentTechnicalItem(animationProps.connection.fromConnector.getSvgElementByIndex(animationProps.allItems.fromConnector[animationProps.index].index).getObject()))
                } else {
                    if (animationProps.allItems.toConnector[animationProps.index - animationProps.allItems.fromConnector.length].hasOwnProperty('type')) {
                        animationProps.connection.toConnector.operators.push(animationProps.allItems.toConnector[animationProps.index - animationProps.allItems.fromConnector.length]);
                    } else {
                        animationProps.connection.toConnector.methods.push(animationProps.allItems.toConnector[animationProps.index - animationProps.allItems.fromConnector.length]);
                    }
                    animationProps.connection.toConnector.setSvgItems();
                    const currentItem = animationProps.connection.toConnector.getSvgElementByIndex(animationProps.allItems.toConnector[animationProps.index - animationProps.allItems.fromConnector.length].index).getObject();
                    dispatch(setModalCurrentTechnicalItem(animationProps.connection.toConnector.getSvgElementByIndex(animationProps.allItems.toConnector[animationProps.index - animationProps.allItems.fromConnector.length].index).getObject()))
                }
                updateEntity(animationProps.connection);
                setTimeOutId(setTimeout(() => setAnimationProps({...animationProps, connection: animationProps.connection, index: animationProps.index + 1}), 1000))
            }
        }
    }, [animationProps.index])


  function toggleVisible() {
    setIsVisible(!isVisible);
  }

  const updateEntity = (updatedEntity: any) => {
      setAnimationProps({...animationProps, connection: updatedEntity});
      let connection = updatedEntity instanceof CConnection ? updatedEntity.getObjectForConnectionOverview() : updatedEntity;
      dispatch(setModalConnectionData({connection}));
  }


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
                entity={animationProps.connection}
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
