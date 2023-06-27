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

import React, { useState, useEffect, useRef } from "react";
import { withTheme } from "styled-components";
import { TooltipButton } from "@app_component/base/tooltip_button/TooltipButton";
import { TextSize } from "@app_component/base/text/interfaces";
import { HelpBlockStyled } from "./styles";

import { ColorTheme } from "@style/Theme";
import { useAppDispatch,  } from "@application/utils/store";
import Dialog from "@app_component/base/dialog/Dialog";

// @ts-ignore
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";

import Content from "./content/Content";
import FormConnectionSvg from "../../../FormConnectionSvg";
import { ModalContext } from "@entity/connection/components/components/general/change_component/FormSection";
import {HelpBlockAllData} from "./HelpBlockData";
import CConnection from "@classes/content/connection/CConnection";
import {setAnimationPaused, setModalConnectionData, setModalCurrentTechnicalItem} from "@root/redux_toolkit/slices/ModalConnectionSlice";
import {CONNECTOR_FROM, CONNECTOR_TO} from "@classes/content/connection/CConnectorItem";
import { Connector } from "@entity/connector/classes/Connector";
import {sortByIndex} from "@application/utils/utils";
import {ModalConnection} from "@root/classes/ModalConnection";
import { Connection } from "@entity/connection/classes/Connection";

import { setFocusById } from "@application/utils/utils";
import { setVideoAnimationName } from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import { setAnimationPreviewPanelVisibility } from "@entity/connection/redux_toolkit/slices/ConnectionSlice";


//@ts-ignore
const connectionData = {"nodeId":null,"connectionId":null,"title":"title","description":"desc","fromConnector":{"nodeId":null,"connectorId":2,"title":null,"invoker":{"name":"trello"},"methods":[{"name":"GetBoards","request":{"endpoint":"{url}/1/members/{username}/boards?key={key}&token={token}","body":null,"method":"GET","header":{"Content-Type":"application/json"}},"response":{"success":{"status":"200","body":{"type":"array","format":"json","data":"raw","fields":{"name":"","id":""}}},"fail":{"status":"401","body":null}},"index":"0","color":"#FFCFB5"}],"operators":[]},"toConnector":{"nodeId":null,"connectorId":2,"title":null,"invoker":{"name":"trello"},"methods":[],"operators":[]},"fieldBinding":[]}


const prepareConnection = (connection: any, connectors: any,) => {
    if(connection && connection.fromConnector && connection.toConnector) {
        let fromConnector = connectors.find((c: any) => c.connectorId === connection.fromConnector.id);
        let toConnector = connectors.find((c: any) => c.connectorId === connection.toConnector.id);
        if(fromConnector && toConnector) {
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
    }
    return connection;
}


const HelpBlock = () => {
    const dispatch = useAppDispatch();
    const [animationProps, setAnimationProps] = useState<any>({connection: CConnection.createConnection()})
    const {connectors, gettingConnectors} = Connector.getReduxState();
    const [isVisible, setIsVisible] = useState(false);
    const { isButtonPanelOpened, videoAnimationName } = Connection.getReduxState();
    const { isAnimationPaused } = ModalConnection.getReduxState();
    const [ timeOutId, setTimeOutId ] = useState(null);
    const [index, setIndex] = useState(0);
    const [stopTimer, setStopTimer] = useState(false);

    const ref = React.useRef(null);

    // console.log(HelpBlockAllData)

    // useEffect(() => {
    //     if(videoAnimationName !== ''){
    //         let connection = CConnection.createConnection(HelpBlockAllData[videoAnimationName]);
    //         let allItems = {
    //             fromConnector: sortByIndex([...connection.fromConnector.methods, ...connection.fromConnector.operators]),
    //             toConnector: sortByIndex([...connection.toConnector.methods, ...connection.toConnector.operators])
    //         }
    //         setAnimationProps({
    //             index: 0,
    //             connection: prepareConnection(connection, connectors),
    //             allItems,
    //         })
    //     }
    //     if(timeOutId) {
    //         clearTimeout(timeOutId);
    //         setTimeOutId(null);
    //     }
    // }, [videoAnimationName])

    // useEffect(() => {
    //     if(isButtonPanelOpened && videoAnimationName && !isAnimationPaused) {
    //         if (animationProps.index >= 0 && animationProps.index < animationProps.allItems.fromConnector.length + animationProps.allItems.toConnector.length) {
    //             if (animationProps.index < animationProps.allItems.fromConnector.length) {
    //                 if (animationProps.allItems.fromConnector[animationProps.index].hasOwnProperty('type')) {
    //                     animationProps.connection.fromConnector.operators.push(animationProps.allItems.fromConnector[animationProps.index]);
    //                   } else {
    //                     animationProps.connection.fromConnector.methods.push(animationProps.allItems.fromConnector[animationProps.index]);
    //                 }
    //                 animationProps.connection.fromConnector.setSvgItems();
    //                 dispatch(setModalCurrentTechnicalItem(animationProps.connection.fromConnector.getSvgElementByIndex(animationProps.allItems.fromConnector[animationProps.index].index).getObject()))

    //                 if(ref.current !== null) {
    //                   // dispatch(setAnimationPaused(true))
    //                   setTimeout(() => {
    //                     ref.current.technicalLayoutRef.current.svgRef.current.processRef.current.onMouseOverSvg()
    //                     setTimeout(() => {
    //                       const createPanelElement = document.querySelector('#create_panel_right').nextElementSibling;
    //                       const createProcess = ref.current.technicalLayoutRef.current.svgRef.current.processRef.current.createPanelRef.current.createProcess;
    //                       createProcess(createPanelElement);
    //                       ref.current.createElementPalenRef.current.createProcessRef.current.changeName({label: "GetBoards", value: "GetBoards"})
    //                       ref.current.createElementPalenRef.current.createProcessRef.current.changeLabel('test')
    //                       setTimeout(() => {
    //                         ref.current.createElementPalenRef.current.createProcessRef.current.create()
    //                         // dispatch(setAnimationPaused(false))
    //                       }, 1000)
    //                     }, 1000)
    //                   }, 1000)
    //                 }
                    
    //             } else {
    //                 if (animationProps.allItems.toConnector[animationProps.index - animationProps.allItems.fromConnector.length].hasOwnProperty('type')) {
    //                     animationProps.connection.toConnector.operators.push(animationProps.allItems.toConnector[animationProps.index - animationProps.allItems.fromConnector.length]);
    //                 } else {
    //                     animationProps.connection.toConnector.methods.push(animationProps.allItems.toConnector[animationProps.index - animationProps.allItems.fromConnector.length]);
    //                 }
    //                 animationProps.connection.toConnector.setSvgItems();
    //                 const currentItem = animationProps.connection.toConnector.getSvgElementByIndex(animationProps.allItems.toConnector[animationProps.index - animationProps.allItems.fromConnector.length].index).getObject();
    //                 dispatch(setModalCurrentTechnicalItem(animationProps.connection.toConnector.getSvgElementByIndex(animationProps.allItems.toConnector[animationProps.index - animationProps.allItems.fromConnector.length].index).getObject()))
    //             }
    //             updateEntity(animationProps.connection);
    //             setTimeOutId(setTimeout(() => setAnimationProps({...animationProps, connection: animationProps.connection, index: animationProps.index + 1}), 1000))
    //         }
    //     }
    // }, [animationProps.index, isAnimationPaused])

    const animationData: any = {
      "firstSteps": {
        "fromConnector": [
          {
            "type": "process",
            "name": "GetBoards",
            "label": "test"
          },
          {
            "type": "operator",
            "name": "if",
            "direction": "right"
          },
          {
            "type": "process",
            "name": "GetBoardList",
            "label": "test3"
          },
          {
            "type": "operator",
            "name": "if",
            "direction": "bottom"
          },
          {
            "type": "process",
            "name": "GetBoardList",
            "label": "test2"
          },
        ],
        "toConnector": [
          {
            "type": "process",
            "name": "GetBoardList",
            "label": "test4"
          }
        ]
      },
      "configureAPI": {

      }
    }

    function delay(ms: number) {
      return new Promise((resolve, reject) => {
        if (!stopTimer) {
          setTimeout(resolve, ms);
        } else {
          reject();
        }
      });
    }

    const animationFunction = (panel: string) => {
      const duration = 500;

      const type = animationData[videoAnimationName][panel][index].type;
      const name = animationData[videoAnimationName][panel][index].name;
      const label = animationData[videoAnimationName][panel][index].label;
      const prevElementType = animationData[videoAnimationName][panel][index > 0 ? index - 1 : index].type;

      const svgRef = ref.current.technicalLayoutRef.current.svgRef.current;

      const connectorPanel = svgRef.connectorPanelsRef.current;


      delay(duration)
      .then(() => {
        if(index <= 0){
          connectorPanel.onClick()
        }
        else{
          const operatorRef = svgRef.operatorRef.current;
          const processRef = svgRef.processRef.current;
          
            if(prevElementType === "operator"){
              operatorRef.onMouseOverSvg()
            }
            else{
              processRef.onMouseOverSvg()
            }

          }
          return delay(duration);
        })
        .then(() => {
          if(index >= 1){
            const createPanelElement = document.querySelector(`#create_panel_right`).nextElementSibling;
            
            if(type === "process" && prevElementType === "operator"){
              const operatorCreatePanel = svgRef.operatorRef.current.createPanelRef.current;

              operatorCreatePanel.createProcess(createPanelElement);
            }
            
            else if(type === "process" && prevElementType === "process"){
              const processCreatePanel = svgRef.processRef.current.createPanelRef.current;

              processCreatePanel.createProcess(createPanelElement);
            }
            
            else if(type === "operator" && prevElementType === "process"){
              const processCreatePanel = svgRef.processRef.current.createPanelRef.current;

              processCreatePanel.createOperator(createPanelElement);
            }

            else if(type === "operator" && prevElementType === "operator"){
              const operatorCreatePanel = svgRef.operatorRef.current.createPanelRef.current;

              operatorCreatePanel.createOperator(createPanelElement);
            }

            return delay(duration);
          }
        })
        .then(() => {
          const createProcessRef = ref.current.createElementPalenRef.current.createProcessRef.current;
          const createOperatorRef = ref.current.createElementPalenRef.current.createOperatorRef.current;

          if(type === "process"){
            createProcessRef.changeName({label: name, value: name})
          }
          else{
            createOperatorRef.changeType({label: name, value: name})
          }
          return delay(duration);
        })
        .then(() => {
          if(type === "process"){
            setFocusById('new_request_label');
            return delay(duration);
          }
        })
        .then(() => {
          const createProcessRef = ref.current.createElementPalenRef.current.createProcessRef.current;

          if(type === "process"){
            createProcessRef.changeLabel(label)
            return delay(duration);
          }

        })
        .then(() => {
          const createProcessRef = ref.current.createElementPalenRef.current.createProcessRef.current;
          const createOperatorRef = ref.current.createElementPalenRef.current.createOperatorRef.current;

          if(type === "process"){
            createProcessRef.create()
          }
          else{
            createOperatorRef.create()
          }

          setIndex(index + 1);
        })
        .catch(() => {})
    }


    useEffect(() => {
      if(ref.current){
        if(videoAnimationName && index <= 0){
          let connection = CConnection.createConnection(connectionData);
          setAnimationProps({
              connection: prepareConnection(connection, connectors)
          })
        }
        if(isButtonPanelOpened && videoAnimationName && !isAnimationPaused) {
          if(index < animationData[videoAnimationName].fromConnector.length + animationData[videoAnimationName].toConnector.length) {
            if(index < animationData[videoAnimationName].fromConnector.length){
              animationFunction('fromConnector');
            }
            // else{
            //   animationFunction(animationData[videoAnimationName].toConnector[index - animationData[videoAnimationName].fromConnector.length].type, animationData[videoAnimationName].toConnector[index - animationData[videoAnimationName].fromConnector.length].name, animationData[videoAnimationName].toConnector[index - animationData[videoAnimationName].fromConnector.length].label);
            // }
          }
        }
      }
    }, [videoAnimationName, isAnimationPaused, index])

    useEffect(() => {
      if(!isVisible){
        setStopTimer(true);
      }
      else{
        setStopTimer(false);
        dispatch(setVideoAnimationName(''));
        dispatch(setAnimationPreviewPanelVisibility(true))
      }
    }, [isVisible])


  function toggleVisible() {
    setIsVisible(!isVisible);
  }

  const updateEntity = (updatedEntity: any) => {
      setAnimationProps({...animationProps, connection: updatedEntity});
      let connection = updatedEntity instanceof CConnection ? updatedEntity.getObjectForConnectionOverview() : updatedEntity;
      dispatch(setModalConnectionData({connection}));
  }

  const handleClick = () => {
    ref.current.technicalLayoutRef.current.svgRef.current.processRef.current.onMouseOverSvg()
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
                ref={ref}
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
