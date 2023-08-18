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

  const addOutlineById = async (idsArray: any, withDelay = false) => {
    positionElementOver(idsArray, 10);
    
    if(withDelay){
      return delay(currentAnimationSpeed)
    }
  }

  const removeOutlineById = async (idsArray: any, withDelay = false) => {
    positionElementOver(idsArray, 10, true);
    if(withDelay){
      return delay(currentAnimationSpeed)
    }
  }

  const addOutlineByClassName = async (classNamesArray: any, withDelay = false) => {
    positionElementOverByClassName(classNamesArray, 10);
    if(withDelay){
      return delay(currentAnimationSpeed)
    }
  }

  const removeOutlineByClassName = async (classNamesArray: any, withDelay = false) => {
    positionElementOverByClassName(classNamesArray, 10, true);
    if(withDelay){
      return delay(currentAnimationSpeed)
    }
  }

  // for show if operator details

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
  const startEditLabel = async (label: any) => {
    addOutlineById(["Label", "Label_option"]);
    label.toggleEdit();

    return delay(reference.current)
  }

  const endEditLabel = async (label: any) => {
    removeOutlineById(["Label", "Label_option"]);
    label.cancelEdit();

    return delay(reference.current)
  }

  const openUrlDialog = async (url: any) => {
    url.toggleUrlVisibleIcon();
    addOutlineById(["url_label", "url_option"]);
      
    return delay(reference.current)
  }

  const changeUrlMethod = async (refs: any) => {
    await addOutlineById([`param_generator_select_${connectorType}_${refs.currentElementId}`], true);

    const connectionMethods = ref.current.props.connection[refs.endpointData.connectorType].methods;

    let method;

    connectionMethods.forEach((element: any) => {
      if(element.index === refs.endpointData.index){
        method = element;
        return;
      }
    })

    refs.paramGeneratorRef.updateColor(method)

    addOutlineById([`param_generator_select_${connectorType}_${refs.currentElementId}`]);

    return delay(reference.current)
  }

  const changeUrlParam = async (refs: any) => {
    await addOutlineById([`input_no_id`]);
    refs.paramGeneratorRef.onChangeField(refs.endpointData.param);
    return delay(reference.current)
  }

  const addUrlParam = async (refs: any) => {
    await addOutlineById([`param_generator_add_${connectorType}_${refs.currentElementId}`])

    refs.paramGeneratorRef.addParam()
    removeOutlineById([`param_generator_add_${connectorType}_${refs.currentElementId}`]);
    return delay(reference.current)
  }

  const closeUrlDialog = async (refs: any) => {
    refs.urlRef.toggleUrlVisibleIcon();
    return delay(reference.current)
  }

  const openHeaderDialog = async (refs: any) => {
    addOutlineById(["header_label", "header_option"]);
    refs.headerRef = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.headerRef.current;
    refs.headerRef.toggleHeaderVisible();
    return delay(reference.current);
  }

  const closeHeaderDialog = async (refs: any) => {
      removeOutlineById(["header_label", "header_option"]);
      refs.headerRef.toggleHeaderVisible();

      return delay(reference.current)
  }

  const openBodyDialog = async (refs: any) => {
    await addOutlineById(["body_label", "body_option"], true);

    removeOutlineById(["body_label", "body_option"]);
    refs.bodyRef.toggleBodyVisible();
  
    return delay(reference.current);
  }

  const openBodyObject = async (refs: any) => {
    await addOutlineByClassName(['.react-json-view .icon-container'], true);

    refs.collapse = document.querySelector('.react-json-view .collapsed-icon');
    refs.collapse.click()

    return delay(reference.current);
  }

  const displayBodyAddKeysButton = async () => {
    let addButton = document.querySelector('.react-json-view .click-to-add');
    // @ts-ignore
    addButton.style.display = 'inline-block';
    addOutlineByClassName(['.react-json-view .click-to-add'])
    return delay(reference.current);
  }

  const clickAddKeysButton = async () => {
    const addButton = document.querySelector('.react-json-view .click-to-add-icon');
    // @ts-ignore
    addButton.click()
      
    return delay(reference.current)
  }

  const addBodyKeyName = async (keyName: any) => {
    await addOutlineByClassName(['.react-json-view .key-modal-input'], true);

    const input = document.querySelector('.react-json-view .key-modal-input')
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    nativeInputValueSetter.call(input, keyName);
    const inputEvent = new Event('input', { bubbles: true});
    input.dispatchEvent(inputEvent);
        
    return delay(reference.current)
  }

  const displaySubmitButtonToAddKey = async () => {
    const submitButton = document.querySelector('.react-json-view .key-modal-submit');
    // @ts-ignore
    submitButton.style = 'position: absolute; width: 1em; height: 1em; right: 0;';
    addOutlineByClassName(['.react-json-view .key-modal-submit']);
    
    return delay(reference.current)
  }

  const clickSubmitButtonToAddKey = async () => {
    removeOutlineByClassName(['.react-json-view .key-modal-submit']);
    const submitButton = document.querySelector('.react-json-view .key-modal-submit');
    // @ts-ignore
    submitButton.click()
    
    return delay(reference.current)
  }

  const displayEditKeyValueButton = async (index: any) => {
    const editButton = document.querySelectorAll('.react-json-view .click-to-edit');
    // @ts-ignore
    editButton[index].style.display = 'inline-block';
    addOutlineByClassName(['.react-json-view .click-to-edit'])

    return delay(reference.current)
  }

  const clickEditKeyValueButton = async (index: any) => {
    removeOutlineByClassName(['.react-json-view .click-to-edit']);
    const edit = document.querySelectorAll('.react-json-view .click-to-edit-icon');
    // @ts-ignore
    edit[index].click();

    return delay(reference.current);
  }

  const addBodyKeyValue = async (keyValue: any) => {
    await addOutlineByClassName(['.react-json-view .variable-editor'], true);
        
    removeOutlineByClassName(['.react-json-view .variable-editor'])
    const textarea = document.querySelector('.react-json-view .variable-editor');
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
    nativeTextAreaValueSetter.call(textarea, keyValue);
    const inputEvent = new Event('input', { bubbles: true});
    textarea.dispatchEvent(inputEvent);

    return delay(reference.current);
  }

  const changeBodyMethod = async (refs: any, bodyData: any, bodyDataIndex: any, referenceIndex: any, methodIndex: any) => {

    const currentItemId = ref.current.props.currentTechnicalItem.id;
    await addOutlineById([`param_generator_select_${currentItemId}`], true);

    const connectionMethods = ref.current.props.connection[bodyData[bodyDataIndex].reference[referenceIndex].method[methodIndex].fromConnector].methods;
    
    let method;

    connectionMethods.forEach((element: any) => {
      if(element.index === bodyData[bodyDataIndex].reference[referenceIndex].method[methodIndex].index){
        method = element;
        return;
      }
    });
    
    refs.bodyRef.JsonBodyRef.current.props.ReferenceComponent.self.current.updateColor(method);

    return delay(reference.current)
  }

  const changeBodyParam = async (refs: any, bodyData: any, bodyIndex: number, referenceIndex: number, methodIndex: number) => {
    await addOutlineById([`input_no_id`], true)

    refs.bodyRef.JsonBodyRef.current.props.ReferenceComponent.self.current.onChangeField(bodyData[bodyIndex].reference[referenceIndex].method[methodIndex].param)

    return delay(reference.current)
  }

  const addBodyMethodAndParam = async (refs: any) => {
    const currentItemId = ref.current.props.currentTechnicalItem.id;
    await addOutlineById([`param_generator_add_${currentItemId}`])

    removeOutlineById([`param_generator_add_${currentItemId}`])
    refs.bodyRef.JsonBodyRef.current.props.ReferenceComponent.self.current.submitEdit()
    return delay(reference.current)
  }

  const clickOnReferenceElements = async (bodyIndex: number) => {
    const referenceElement = document.querySelectorAll('.reference_element');
    referenceElement[bodyIndex].classList.add(`reference_element_${bodyIndex}`);
    await addOutlineByClassName([`.reference_element_${bodyIndex}`], true);

    removeOutlineByClassName([`.reference_element_${bodyIndex}`]);

    // @ts-ignore
    referenceElement[bodyIndex].click();

    return delay(reference.current);
  }

  const changeReferenceDescription = async (bodyData: any, bodyIndex: number, referenceIndex: number) => {
    await addOutlineById(['enhancement_description'], true);

    const textarea = document.querySelector('#enhancement_description');
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
    nativeTextAreaValueSetter.call(textarea, bodyData[bodyIndex].reference[referenceIndex].enhancementDescription);
    const inputEvent = new Event('input', { bubbles: true});
    textarea.dispatchEvent(inputEvent);

    return delay(reference.current)
  }

  const changeReferenceContent = async (refs: any, bodyData: any, bodyDataIndex: number, referenceIndex: number) => {
    await removeOutlineById(['enhancement_description']);
    await addOutlineByClassName(['.ace_content'], true);

    refs.bodyRef.enhancementRef.current.props.onChange(bodyData[bodyDataIndex].reference[referenceIndex].enhancementContent);

    await removeOutlineByClassName(['.ace_content']);

    return delay(reference.current);
  }

  const clickSubmitButtonToAddValue = async () => {
    await addOutlineByClassName(['.react-json-view .edit-check']);

    await removeOutlineByClassName(['.react-json-view .edit-check'], true);
    const editSubmitButton = document.querySelector('.react-json-view .edit-check');
    // @ts-ignore
    editSubmitButton.click();

    return delay(reference.current);
  }

  const closeBodyDialog = async (refs: any) => {
    refs.bodyRef.toggleBodyVisible();

    return delay(reference.current);
  }

  const showResponse = async () => {
    await addOutlineById(["response_label"], true);
    
    ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.toggleResponseVisibleIcon();
    await removeOutlineById(["response_label"], true);

    return delay(reference.current);
  }

  const deleteLastProcess = async () => {
    const processRef = ref.current.technicalLayoutRef.current.svgRef.current.processRef.current;
    await addOutlineById(['delete_icon'], true);

    await removeOutlineById(['delete_icon'])
    processRef.deleteProcess();

    return delay(reference.current);
  }

  const showResult = async () => {
    const technicalLayout = document.getElementById('modal_technical_layout_svg');
      // @ts-ignore
      technicalLayout.style = `
        height: auto;
        width: 1000px;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        overflow: visible;
      `;

      const setSvgViewBox = (elementId: string) => {
        const svgElement = document.getElementById(elementId);
        const viewBoxValue = svgElement.getAttribute('viewBox');
        const fromConnectorPanel = svgElement.querySelector('#fromConnector_panel_modal');
        const toConnectorPanel = svgElement.querySelector('#toConnector_panel_modal');

        const fromConnectorHeight = fromConnectorPanel.getBoundingClientRect().height;
        const toConnectorHeight = toConnectorPanel.getBoundingClientRect().height;

        const svgElementHeight = svgElement.getBoundingClientRect().height;
        const svgElementWidth = svgElement.getBoundingClientRect().width;
  
        const fromConnectorWidth = fromConnectorPanel.getBoundingClientRect().width;
        const toConnectorWidth = toConnectorPanel.getBoundingClientRect().width;
  
        const [x, y, width, height] = viewBoxValue.split(' ').map(parseFloat);
  
        let offsetX = ((fromConnectorWidth + toConnectorWidth + 50) - svgElementWidth) / 2;
        let offsetY;

        if(fromConnectorHeight > toConnectorHeight){
          if(fromConnectorHeight > svgElementHeight){
            offsetY = Math.abs(svgElementHeight - fromConnectorHeight);
          }
          else{
            offsetY = fromConnectorHeight - svgElementHeight 
          }
        }
        else{
          if(toConnectorHeight > svgElementHeight){
            offsetY = Math.abs(svgElementHeight - toConnectorHeight);
          }
          else{
            offsetY = toConnectorHeight - svgElementHeight
          }
        }

        const viewBox = {x: offsetX, y: offsetY, width: width, height: height};
  
        CSvg.setViewBox(elementId, viewBox)
      }
      dispatch(toggleModalDetails())
      setSvgViewBox('modal_technical_layout_svg');
  }

  const showDetailsForProcess = async () => {
    const refs: any = {};

    refs.animationData = animationData[videoAnimationName][connectorType][index];
    refs.endpointData = refs.animationData.endpoint;
    refs.currentElementId = refs.animationData.index;

    await delay(reference.current)
    
    if(refs.animationData.label){
      refs.labelRef = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.labelRef.current;
      await startEditLabel(refs.labelRef)
    
      await endEditLabel(refs.labelRef)
    }
    
    if(refs.endpointData){
      refs.urlRef = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.urlRef.current;
      
      await openUrlDialog(refs.urlRef)
      
      refs.paramGeneratorRef = refs.urlRef.endpointRef.current.paramGeneratorRef.current;

      await changeUrlMethod(refs)
    
      await changeUrlParam(refs);
    
      await addUrlParam(refs);

      await closeUrlDialog(refs);
    }
    
    if(connectorType === 'fromConnector' && index === 0){
      await openHeaderDialog(refs);
    
      await closeHeaderDialog(refs);
    }
    
    const bodyData = refs.animationData.body;

    if(bodyData){
      refs.bodyRef = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.bodyRef.current;

      await openBodyDialog(refs);
  
      await openBodyObject(refs);
      
      for(let i = 0; i < bodyData.length; i++){
        await displayBodyAddKeysButton();

        await clickAddKeysButton();

        await addBodyKeyName(bodyData[i].keyName);

        await displaySubmitButtonToAddKey()

        await clickSubmitButtonToAddKey()
        
        await displayEditKeyValueButton(i);

        await clickEditKeyValueButton(i);

        await addBodyKeyValue(bodyData[i].keyValue)
        
        if(bodyData[i].keyValue === '#'){
          
          for(let referenceCount = 0; referenceCount < bodyData[i].reference.length; referenceCount++) {
            for(let methodCount = 0; methodCount < bodyData[i].reference[referenceCount].method.length; methodCount++){
              if(methodCount > 0){
                await displayEditKeyValueButton(i);
            
                await clickEditKeyValueButton(i);
              }

              await changeBodyMethod(refs, bodyData, i, referenceCount, methodCount);

              await changeBodyParam(refs, bodyData, i, referenceCount, methodCount)

              await addBodyMethodAndParam(refs);
            }

            if(connectorType === 'toConnector' && bodyData[i].reference[referenceCount].enhancementDescription){

              await clickOnReferenceElements(i);

              await changeReferenceDescription(bodyData, i, referenceCount);

              await changeReferenceContent(refs, bodyData, i, referenceCount);
            }
          }
        }
        else{
          await clickSubmitButtonToAddValue();
        }
      }
      await closeBodyDialog(refs);
    }
            
    if(connectorType === 'fromConnector' && index === 0){
      await showResponse();
    }
  
    if(index === animationData[videoAnimationName].toConnector.length - 1 && connectorType === 'toConnector'){

      await deleteLastProcess();
      
      await showResult();
      
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
