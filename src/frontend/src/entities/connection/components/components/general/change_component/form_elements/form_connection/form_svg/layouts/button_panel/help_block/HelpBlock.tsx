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

import React, { useState, useEffect } from "react";
import { withTheme } from "styled-components";
import { TooltipButton } from "@app_component/base/tooltip_button/TooltipButton";
import { TextSize } from "@app_component/base/text/interfaces";
import { HelpBlockStyled } from "./styles";
import { ConnectorPanelType } from "./interfaces";
import { ColorTheme } from "@style/Theme";
import { useAppDispatch } from "@application/utils/store";
import Dialog from "@app_component/base/dialog/Dialog";
// @ts-ignore
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import Content from "./content/Content";
import FormConnectionSvg from "../../../FormConnectionSvg";
import { ModalContext } from "@entity/connection/components/components/general/change_component/FormSection";
import animationData from "./AnimationData";
import CConnection from "@classes/content/connection/CConnection";
import {setAnimationPaused, toggleModalDetails } from "@root/redux_toolkit/slices/ModalConnectionSlice";
import {CONNECTOR_FROM, CONNECTOR_TO} from "@classes/content/connection/CConnectorItem";
import { Connector } from "@entity/connector/classes/Connector";
import {ModalConnection} from "@root/classes/ModalConnection";
import { Connection } from "@entity/connection/classes/Connection";
import { setVideoAnimationName, setAnimationPreviewPanelVisibility } from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import { setFocusById, positionElementOver, positionElementOverByClassName } from '@application/utils/utils';
import CSvg from "@entity/connection/components/classes/components/content/connection_overview_2/CSvg";
import AnimationSpeedSlider from "./AnimationSpeedSlider/AnimationSpeedSlider";

import DetailsForOperators from "./AnimationFunctions/DetailsForOperators";
import DetailsForProcess from "./AnimationFunctions/DetailsForProcess";
import { current } from "@reduxjs/toolkit";

//@ts-ignore
const connectionData = {"nodeId":null,"connectionId":null,"title":"trello connection","description":"desc","fromConnector":{"nodeId":null,"connectorId":1,"title":null,"invoker":{"name":"trello"},"methods":[{"name":"GetBoards","request":{"endpoint":"{url}/1/members/{username}/boards?key={key}&token={token}","body":null,"method":"GET"},"response":{"success":{"status":"200","body":{"type":"array","format":"json","data":"raw","fields":{"name":"","id":""}}},"fail":{"status":"401","body":null}},"index":"0","label":null,"color":"#FFCFB5"}],"operators":[]},"toConnector":{"nodeId":null,"connectorId":1,"title":null,"invoker":{"name":"trello"},"methods":[],"operators":[]},"fieldBinding":[]}

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
  const { isButtonPanelOpened, videoAnimationName, animationSpeed } = Connection.getReduxState();
  const { isAnimationPaused } = ModalConnection.getReduxState();
  const [index, setIndex] = useState(0);
  const [stopTimer, setStopTimer] = useState(false);

  const [connectorType, setConnectorType] = useState<ConnectorPanelType>("fromConnector");
  const [showLinkInBody, setShowLinkInBody] = useState(true);

  const ref = React.useRef(null);

  const reference: any = React.useRef();
  const currentAnimationSpeed = reference.current = animationSpeed;

  function delay(ms: number) {
    return new Promise((resolve, reject) => {
      if (!stopTimer) {
        setTimeout(resolve, ms);
      } else {
        reject();
      }
    });
  }

  const setSvgViewBox = (elementId: string, currentSvgElementId: string) => {
    const svgElement = document.getElementById(elementId);
    const viewBoxValue = svgElement.getAttribute('viewBox');
    const fromConnectorPanel = svgElement.querySelector('#fromConnector_panel_modal');
    const toConnectorPanel = svgElement.querySelector('#toConnector_panel_modal');

    const currentElement = svgElement.querySelector(`#${currentSvgElementId}`);

    const fromConnectorWidth = fromConnectorPanel.getBoundingClientRect().width;
    const toConnectorWidth = toConnectorPanel.getBoundingClientRect().width;

    const [x, y, width, height] = viewBoxValue.split(' ').map(parseFloat);

    let offsetX;
    // @ts-ignore
    let offsetY = currentElement.y.animVal.value / 2 - 50

    if(connectorType === 'fromConnector'){
      offsetX = fromConnectorWidth > 350 ? fromConnectorWidth / 4 : x
    }
    if(connectorType === 'toConnector'){
      offsetX = toConnectorWidth > 350 ? toConnectorWidth / 2 + fromConnectorWidth : fromConnectorWidth;
    }

    const viewBox = {x: offsetX, y: offsetY, width: width, height: height};

    CSvg.setViewBox(elementId, viewBox)
  }

  const showDetailsForOperatorIf = async (condition: any) => {
    if(condition){
      const conditionRef = ref.current.detailsRef.current.descriptionRef.current.conditionRef.current;

      await DetailsForOperators.openConditionDialog(ref, currentAnimationSpeed);

      await DetailsForOperators.changeLeftMethod(ref, condition, currentAnimationSpeed);

      await DetailsForOperators.setFocusOnLeftParam(ref, currentAnimationSpeed);

      await DetailsForOperators.changeLeftParam(ref, condition, currentAnimationSpeed);

      await DetailsForOperators.changeRelationalOperator(ref, condition, currentAnimationSpeed);

      if(condition.rightStatement.property){
        await DetailsForOperators.setFocusOnRightProperty(ref, currentAnimationSpeed);

        await DetailsForOperators.changeRightProperty(ref, condition, currentAnimationSpeed);

        await DetailsForOperators.removeFocusFromRightProperty(ref, currentAnimationSpeed);
      }
      
      if(condition.rightStatement.rightMethodIndex){
        await DetailsForOperators.changeRightMethod(ref, condition, currentAnimationSpeed);
      }
      
      if(condition.rightStatement.rightParam){
        await DetailsForOperators.setFocusOnRightParam(ref, currentAnimationSpeed);

        await DetailsForOperators.changeRightParam(ref, condition, currentAnimationSpeed);

        await DetailsForOperators.removeFocusFromRightParam(ref, currentAnimationSpeed);
      }
      
      conditionRef.updateConnection();
      setIndex(index + 1);
    }
    else{
      setIndex(index + 1);
    }
  }
  
  const showDetailsForOperatorLoop = async (condition: any) => {
    if(condition){
      const conditionRef = ref.current.detailsRef.current.descriptionRef.current.conditionRef.current;

      await DetailsForOperators.openConditionDialog(ref, currentAnimationSpeed);

      await DetailsForOperators.changeLeftMethod(ref, condition, currentAnimationSpeed);

      await DetailsForOperators.setFocusOnLeftParam(ref, currentAnimationSpeed);

      await DetailsForOperators.changeLeftParam(ref, condition, currentAnimationSpeed);

      await DetailsForOperators.changeRelationalOperator(ref, condition, currentAnimationSpeed);

      await DetailsForOperators.changeRightMethod(ref, condition, currentAnimationSpeed);

      await DetailsForOperators.changeRightParam(ref, condition, currentAnimationSpeed);
    
      conditionRef.updateConnection();
      setIndex(index + 1);
    }
    else{
      setIndex(index + 1);
    }
  }

  // for show process details

  const showDetailsForProcess = async () => {
    const refs: any = {};

    refs.animationData = animationData[videoAnimationName][connectorType][index];
    refs.endpointData = refs.animationData.endpoint;
    refs.currentElementId = refs.animationData.index;
    
    if(refs.animationData.label){
      await DetailsForProcess.startEditLabel(ref, currentAnimationSpeed);

      await DetailsForProcess.endEditLabel(ref, currentAnimationSpeed);
    }
    
    if(refs.endpointData){
      await DetailsForProcess.openUrlDialog(ref, currentAnimationSpeed);

      await DetailsForProcess.changeUrlMethod(ref, refs.animationData, connectorType, currentAnimationSpeed);

      await DetailsForProcess.changeUrlParam(ref, refs.animationData, currentAnimationSpeed);

      await DetailsForProcess.addUrlParam(ref, refs.animationData, connectorType, currentAnimationSpeed);

      await DetailsForProcess.closeUrlDialog(ref, currentAnimationSpeed);
    }
    
    if(connectorType === 'fromConnector' && index === 0){
      await DetailsForProcess.openHeaderDialog(ref, currentAnimationSpeed);

      await DetailsForProcess.closeHeaderDialog(ref, currentAnimationSpeed);
    }
    
    const bodyData = refs.animationData.body;

    if(bodyData){
      await DetailsForProcess.openBodyDialog(ref, currentAnimationSpeed);

      await DetailsForProcess.openBodyObject(currentAnimationSpeed);
      
      for(let bodyIndex = 0; bodyIndex < bodyData.length; bodyIndex++){
        await DetailsForProcess.displayBodyAddKeysButton(currentAnimationSpeed);

        await DetailsForProcess.clickAddKeysButton(currentAnimationSpeed);

        await DetailsForProcess.addBodyKeyName(bodyData[bodyIndex].keyName, currentAnimationSpeed);

        await DetailsForProcess.displaySubmitButtonToAddKey(currentAnimationSpeed);

        await DetailsForProcess.clickSubmitButtonToAddKey(currentAnimationSpeed);

        await DetailsForProcess.displayEditKeyValueButton(bodyIndex, currentAnimationSpeed);

        await DetailsForProcess.clickEditKeyValueButton(bodyIndex, currentAnimationSpeed);

        await DetailsForProcess.addBodyKeyValue(bodyData[bodyIndex].keyValue, currentAnimationSpeed);
        
        if(bodyData[bodyIndex].keyValue === '#'){
          for(let referenceIndex = 0; referenceIndex < bodyData[bodyIndex].reference.length; referenceIndex++) {
            for(let methodIndex = 0; methodIndex < bodyData[bodyIndex].reference[referenceIndex].method.length; methodIndex++){
              if(methodIndex > 0){
                await DetailsForProcess.displayEditKeyValueButton(bodyIndex, currentAnimationSpeed);

                await DetailsForProcess.clickEditKeyValueButton(bodyIndex, currentAnimationSpeed);
              }

              await DetailsForProcess.changeBodyMethod(ref, bodyData, bodyIndex, referenceIndex, methodIndex, currentAnimationSpeed);

              await DetailsForProcess.changeBodyParam(ref, bodyData, bodyIndex, referenceIndex, methodIndex, currentAnimationSpeed);

              await DetailsForProcess.addBodyMethodAndParam(ref, currentAnimationSpeed);
            }

            if(connectorType === 'toConnector' && bodyData[bodyIndex].reference[referenceIndex].enhancementDescription){
              await DetailsForProcess.clickOnReferenceElements(bodyIndex, currentAnimationSpeed);

              await DetailsForProcess.changeReferenceDescription(bodyData, bodyIndex, referenceIndex, currentAnimationSpeed);

              await DetailsForProcess.changeReferenceContent(ref, bodyData, bodyIndex, referenceIndex, currentAnimationSpeed);
            }
          }
        }
        else{
          await DetailsForProcess.clickSubmitButtonToAddValue(currentAnimationSpeed);
        }
      }
      await DetailsForProcess.closeBodyDialog(ref, currentAnimationSpeed);
    }
            
    if(connectorType === 'fromConnector' && index === 0){
      await DetailsForProcess.showResponse(ref, currentAnimationSpeed);
    }
  
    if(index === animationData[videoAnimationName].toConnector.length - 1 && connectorType === 'toConnector'){
      await DetailsForProcess.deleteLastProcess(ref, currentAnimationSpeed);

      await DetailsForProcess.showResult(dispatch, currentAnimationSpeed);
      
      setIndex(index + 1);
    }
    else{
      setIndex(index + 1);
    }
  }

  const animationFunction = (connectorPanelType: ConnectorPanelType) => {
    const currentElementId = animationData[videoAnimationName][connectorPanelType][index].index;
    const type = animationData[videoAnimationName][connectorPanelType][index].type;
    const name = animationData[videoAnimationName][connectorPanelType][index].name;
    // @ts-ignore
    const label = animationData[videoAnimationName][connectorPanelType][index].label;
    const direction = animationData[videoAnimationName][connectorPanelType][index].toDown;
    const after = animationData[videoAnimationName][connectorPanelType][index].after;
    const prevElementType = animationData[videoAnimationName][connectorPanelType][index > 0 ? index - 1 : index].type;
    const svgRef = ref.current.technicalLayoutRef.current.svgRef.current;

    const connectorPanel = connectorPanelType === 'fromConnector' ? svgRef.fromConnectorPanelRef.current : svgRef.toConnectorPanelRef.current;
    
    delay(reference.current)
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
        return delay(reference.current);
    })
    .then(() => {
      if(index >= 1){
        const createPanelElement = document.querySelector(`#create_panel_right`).nextElementSibling;
        let currentItem = null;
        if(after){
          const svgItems = ref.current.technicalLayoutRef.current.props.connectionOverviewState.connection[connectorType].svgItems
          for(let i = 0; i < svgItems.length; i++){
            if(svgItems[i].id === `${connectorType}_${after}`){

              currentItem = animationProps.connection.fromConnector.getSvgElementByIndex(after)
              
              break;
            }
          }
        }
        
        if(type === "process" && prevElementType === "operator"){
          const operatorCreatePanel = svgRef.operatorRef.current.createPanelRef.current;

          operatorCreatePanel.createProcess(createPanelElement, direction ? 'in' : 'out', currentItem);
        }
         
        else if(type === "process" && prevElementType === "process"){
          const processCreatePanel = svgRef.processRef.current.createPanelRef.current;

          processCreatePanel.createProcess(createPanelElement, direction ? 'in' : 'out', currentItem);
        }
          
        else if(type === "operator" && prevElementType === "process"){
          const processCreatePanel = svgRef.processRef.current.createPanelRef.current;

          processCreatePanel.createOperator(createPanelElement, direction ? 'in' : 'out', currentItem);
        }

        else if(type === "operator" && prevElementType === "operator"){
          const operatorCreatePanel = svgRef.operatorRef.current.createPanelRef.current;

          operatorCreatePanel.createOperator(createPanelElement, direction ? 'in' : 'out', currentItem);
        }
        return delay(reference.current);
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
      return delay(reference.current);
    })
    .then(() => {
      if(type === "process" && label){
        setFocusById('new_request_label');
        return delay(reference.current);
      }
    })
    .then(() => {
      if(type === "process" && label){
        const createProcessRef = ref.current.createElementPalenRef.current.createProcessRef.current;
        createProcessRef.changeLabel(label)
        return delay(reference.current);
      }
    })
    .then(() => {
      const createProcessRef = ref.current.createElementPalenRef.current.createProcessRef.current;
      const createOperatorRef = ref.current.createElementPalenRef.current.createOperatorRef.current;
      
      type === "process" ? createProcessRef.create() : createOperatorRef.create()
      const processRef = svgRef.processRef.current;
     
      processRef.onClick()
      
      const currentSvgElementId = `${connectorType}__${connectorType}_${currentElementId}${type === "process" ? "__" + name : ''}`

      setSvgViewBox('modal_technical_layout_svg', currentSvgElementId);
      
      if(index >= 0 && name !=='if' && name !== 'loop'){
        showDetailsForProcess();
      }
      if(name === 'if'){
        // @ts-ignore
        const condition = animationData[videoAnimationName][connectorType][index].conditionForIf;
        showDetailsForOperatorIf(condition);
      }
      if(name === 'loop'){
        // @ts-ignore
        const condition = animationData[videoAnimationName][connectorType][index].conditionForLoop;
        showDetailsForOperatorLoop(condition);
      }
    })
    .catch(() => {})
  }

  useEffect(() => {
    if(ref.current){
      if(videoAnimationName && index <= 0 && connectorType === 'fromConnector'){
        let connection = CConnection.createConnection(connectionData);
        setAnimationProps({
            connection: prepareConnection(connection, connectors)
        })
      }
      if(isButtonPanelOpened && videoAnimationName && !isAnimationPaused) {
        if(index < animationData[videoAnimationName].fromConnector.length + animationData[videoAnimationName].toConnector.length) {
          if(index < animationData[videoAnimationName].fromConnector.length && connectorType === 'fromConnector'){
            animationFunction('fromConnector');
          }
          else if(index === animationData[videoAnimationName].fromConnector.length && connectorType === 'fromConnector'){
            setConnectorType('toConnector')
            setShowLinkInBody(true)
            setIndex(0)
          }
          else if(index < animationData[videoAnimationName].toConnector.length && connectorType === 'toConnector'){
            animationFunction('toConnector');
          }
          else if(index === animationData[videoAnimationName].toConnector.length && connectorType === 'toConnector'){
            setConnectorType('fromConnector')
            dispatch(setVideoAnimationName(''));
            setIndex(0)
          }
        }
      }
    }
    
  }, [videoAnimationName, isAnimationPaused, index])

  useEffect(() => {
    setIndex(0);
    if(isAnimationPaused) dispatch(setAnimationPaused(!isAnimationPaused))
  }, [videoAnimationName])

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

  useEffect(() => {
    if(connectorType === 'toConnector'){
      animationFunction('toConnector');
    }
  }, [connectorType])

  function toggleVisible() {
    setIsVisible(!isVisible);
  }

  const updateEntity = (updatedEntity: any) => {
    setAnimationProps({...animationProps, connection: updatedEntity});
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
          <AnimationSpeedSlider step={500} min={500} max={2500}/>
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
          handleClick={() => {console.log('documentation')}}
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
          handleClick={() => {console.log('shortcuts')}}
        />
      </div>
    </HelpBlockStyled>
  );
};

HelpBlock.defaultProps = {};

export { HelpBlock };

export default withTheme(HelpBlock);
