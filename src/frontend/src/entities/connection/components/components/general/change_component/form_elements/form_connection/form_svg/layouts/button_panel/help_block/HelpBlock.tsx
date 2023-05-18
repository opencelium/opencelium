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
import { animations } from "./HelpBlockData";
import CConnection from "@classes/content/connection/CConnection";
import {setModalConnectionData, setModalCurrentTechnicalItem} from "@root/redux_toolkit/slices/ModalConnectionSlice";
import {CONNECTOR_FROM} from "@classes/content/connection/CConnectorItem";
import { Connector } from "@entity/connector/classes/Connector";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {sortByIndex} from "@application/utils/utils";
import {setVideoAnimationName} from "@root/redux_toolkit/slices/ConnectionSlice";
import { setAnimationPaused } from "@root/redux_toolkit/slices/ModalConnectionSlice";

const HelpBlock = () => {
    const dispatch = useAppDispatch();
    const { isButtonPanelOpened, videoAnimationName } = useAppSelector(
        (state) => state.connectionReducer
    );
    const { isAnimationPaused } = useAppSelector(
        (state) => state.modalConnectionReducer
    );
    
    const animation = videoAnimationName ? animations[videoAnimationName] : animations.firstSteps;

    const [index, setIndex] = useState<number>(-1);
    const {connectors, gettingConnectors} = Connector.getReduxState();
    const [connection, setConnection] = useState(CConnection.createConnection(animation));
    const [isVisible, setIsVisible] = useState(false);
    const [allItems, setAllItems] = useState({fromConnector: [], toConnector: []});

    useEffect(() => {
        if(!isVisible){
            setIndex(-1);
            dispatch(setVideoAnimationName(''));
            setAllItems({fromConnector: [], toConnector: []});
        }
    }, [isVisible]);
    useEffect(() => {
        if(isVisible && videoAnimationName && !isAnimationPaused) {
            if (index >= 0 && index < allItems.fromConnector.length + allItems.toConnector.length) {
                if (index < allItems.fromConnector.length) {
                    if (allItems.fromConnector[index].hasOwnProperty('type')) {
                        connection.fromConnector.operators.push(allItems.fromConnector[index]);
                    } else {
                        connection.fromConnector.methods.push(allItems.fromConnector[index]);
                    }
                    connection.fromConnector.setSvgItems();
                    dispatch(setModalCurrentTechnicalItem(connection.fromConnector.getSvgElementByIndex(allItems.fromConnector[index].index).getObject()))
                } else {
                    if (allItems.toConnector[index - allItems.fromConnector.length].hasOwnProperty('type')) {
                        connection.toConnector.operators.push(allItems.toConnector[index - allItems.fromConnector.length]);
                    } else {
                        connection.toConnector.methods.push(allItems.toConnector[index - allItems.fromConnector.length]);
                    }
                    connection.toConnector.setSvgItems();
                    dispatch(setModalCurrentTechnicalItem(connection.toConnector.getSvgElementByIndex(allItems.toConnector[index - allItems.fromConnector.length].index).getObject()))
                }
                updateEntity(connection);
                setTimeout(() => setIndex(index + 1), 1000);
            }
        }
    }, [index, isVisible, videoAnimationName, isAnimationPaused])

    useEffect(() => {
        if(allItems.fromConnector.length === 0 && allItems.toConnector.length === 0){
            setAllItems({
                fromConnector: sortByIndex([...connection.fromConnector.methods, ...connection.fromConnector.operators]),
                toConnector: sortByIndex([...connection.toConnector.methods, ...connection.toConnector.operators])
            });
        }
    }, [])
    useEffect(() => {
      if(gettingConnectors === API_REQUEST_STATE.FINISH) {
          let fromConnector = connectors.find(c => c.connectorId === animation.fromConnector.connectorId);
          let toConnector = connectors.find(c => c.connectorId === animation.toConnector.connectorId);
          if (fromConnector && toConnector) {
              connection.fromConnector.id = fromConnector.connectorId;
              connection.fromConnector.title = fromConnector.title;
              connection.fromConnector.methods = [];
              connection.fromConnector.operators = [];
              //@ts-ignore
              connection.fromConnector.invoker = fromConnector.invoker;
              connection.fromConnector.setConnectorType(CONNECTOR_FROM);
              connection.toConnector.id = toConnector.connectorId;
              connection.toConnector.title = toConnector.title;
              connection.toConnector.methods = [];
              connection.toConnector.operators = [];
              //@ts-ignore
              connection.toConnector.invoker = toConnector.invoker;
              connection.toConnector.setConnectorType(CONNECTOR_FROM);
              setConnection(connection);
          }
      }
    }, [gettingConnectors]);

    useEffect(() => {
        if(index === -1){
            setIndex(0)
        }
    }, [connection])

  function toggleVisible() {
    setIsVisible(!isVisible);
  }

  const updateEntity = (updatedEntity: any) => {
      setConnection(updatedEntity);
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
          <TooltipButton
          style={{position: "absolute", top:0, left:0, right: 'auto', zIndex: 100000}}
          size={TextSize.Size_40}
          position={"bottom"}
          icon={isAnimationPaused ? "play_arrow" : "pause"}
          tooltip={isAnimationPaused ? "play animation" : 'pause animation'}
          target={`animation_play_button`}
          hasBackground={true}
          background={ColorTheme.White}
          color={ColorTheme.Gray}
          padding="2px"
          handleClick={() => dispatch(setAnimationPaused(!isAnimationPaused))}
        />
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
