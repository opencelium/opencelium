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
import {setAnimationPaused } from "@root/redux_toolkit/slices/ModalConnectionSlice";
import {CONNECTOR_FROM, CONNECTOR_TO} from "@classes/content/connection/CConnectorItem";
import { Connector } from "@entity/connector/classes/Connector";
import {ModalConnection} from "@root/classes/ModalConnection";
import { Connection } from "@entity/connection/classes/Connection";

import { setVideoAnimationName, setAnimationPreviewPanelVisibility } from "@entity/connection/redux_toolkit/slices/ConnectionSlice";

import { setFocusById, positionElementOver, positionElementOverByClassName } from '@application/utils/utils';

import CSvg from "@entity/connection/components/classes/components/content/connection_overview_2/CSvg";

import { toggleModalDetails } from '@root/redux_toolkit/slices/ModalConnectionSlice';

//@ts-ignore
const connectionData = {"nodeId":null,"connectionId":null,"title":"test","description":"test","fromConnector":{"nodeId":null,"connectorId":3,"title":null,"invoker":{"name":"trello"},"methods":[{"name":"GetBoards","request":{"endpoint":"{url}/1/members/{username}/boards?key={key}&token={token}","body":null,"method":"GET"},"response":{"success":{"status":"200","body":{"type":"array","format":"json","data":"raw","fields":{"name":"","id":""}}},"fail":{"status":"401","body":null}},"index":"0","label":null,"color":"#FFCFB5"}],"operators":[]},"toConnector":{"nodeId":null,"connectorId":3,"title":null,"invoker":{"name":"trello"},"methods":[],"operators":[]},"fieldBinding":[]}


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
    const [index, setIndex] = useState(0);
    const [stopTimer, setStopTimer] = useState(false);

    const [connectorType, setConnectorType] = useState<ConnectorPanelType>("fromConnector");
    const [showLinkInBody, setShowLinkInBody] = useState(true);

    const ref = React.useRef(null);
    const duration = 1000;

    

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


      // const fromConnectorHeight = fromConnectorPanel.getBoundingClientRect().height;
      // const toConnectorHeight = toConnectorPanel.getBoundingClientRect().height;

      const fromConnectorWidth = fromConnectorPanel.getBoundingClientRect().width;
      const toConnectorWidth = toConnectorPanel.getBoundingClientRect().width;

      const [x, y, width, height] = viewBoxValue.split(' ').map(parseFloat);

      let offsetX; 
      // let offsetY = fromConnectorHeight > height / 2 || toConnectorHeight > height / 2 ? y + 80 : y
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

    const ifDetails = () => {
      // setIndex(index + 1); return;
      const refs: any = {};
      refs.detailsRef = ref.current.detailsRef.current;

      // @ts-ignore
      const condition = animationData[videoAnimationName][connectorType][index].conditionForIf;

      if(condition){
        delay(duration)
        .then(() => {
          refs.conditionRef = refs.detailsRef.descriptionRef.current.conditionRef.current;
          refs.conditionRef.toggleEdit();

          return delay(duration)
        })
        .then(() => {
          refs.leftStatementRef = refs.conditionRef.leftStatementRef.current;
          refs.rightStatementRef = refs.conditionRef.rightStatementRef.current;
          
          const connectionMethods = ref.current.props.connection[condition.leftStatement.fromConnector].methods;

          let method;
          for(let i = 0; i < connectionMethods.length; i++) {
            if(connectionMethods[i].index === condition.leftStatement.leftMethodIndex){
              method = connectionMethods[i];
              break;
            }
          }

          refs.leftStatementRef.updateMethod(method);

          return delay(duration)
        })
        .then(() => {
          setFocusById(refs.leftStatementRef.paramInputRef.current.props.id);

          return delay(duration)
        })
        .then(() => {
          refs.leftStatementRef.updateParam(condition.leftStatement.leftParam);
          refs.leftParamInput = document.getElementById(refs.leftStatementRef.paramInputRef.current.props.id);

          return delay(duration)
        })
        .then(() => {
          refs.leftParamInput.blur();
          refs.conditionRef.updateRelationalOperator({ value: condition.relationalOperator});
          return delay(duration)
        })
        .then(() => {
          if(condition.rightStatement.property){
            setFocusById(`if_operator_property_${refs.rightStatementRef.props.operator.index}`);

            return delay(duration)
          }
        })
        .then(() => {
          if(condition.rightStatement.property){
            refs.rightStatementRef.updateProperty(condition.rightStatement.property);
            refs.propertyInput = document.getElementById(`if_operator_property_${refs.rightStatementRef.props.operator.index}`);

            return delay(duration)
          }
        })
        .then(() => {
          if(condition.rightStatement.property){
            refs.propertyInput.blur();

            return delay(duration)
          }
        })
        .then(() => {
          if(condition.rightStatement.rightMethodIndex){
            const connectionMethods = ref.current.props.connection[condition.rightStatement.fromConnector].methods;

            let method;
            for(let i = 0; i < connectionMethods.length; i++) {
              if(connectionMethods[i].index === condition.rightStatement.rightMethodIndex){
                method = connectionMethods[i];
                break;
              }
            }
            refs.rightStatementRef.updateMethod(method);

            return delay(duration)
          }
        })
        .then(() => {
          if(condition.rightStatement.rightParam){
            setFocusById(refs.rightStatementRef.paramInputRef.current.props.id);

            return delay(duration)
          }
        })
        .then(() => {
          if(condition.rightStatement.rightParam){
            refs.rightStatementRef.updateParam(condition.rightStatement.rightParam);
            refs.rightParamInput = document.getElementById(refs.rightStatementRef.paramInputRef.current.props.id)

            return delay(duration)
          }
        })
        .then(() => {
          if(condition.rightStatement.rightParam){
            refs.rightParamInput.blur();

            return delay(duration)
          }
        })
        .then(() => {
          refs.conditionRef.updateConnection();
          // refs.conditionRef.toggleEdit();
          setIndex(index + 1);
        })
        .catch(() => {})
      }
      else{
        setIndex(index + 1);
      }
    }

    const loopDetails = () =>{
      const refs: any = {};
      refs.detailsRef = ref.current.detailsRef.current;

      // @ts-ignore
      const condition = animationData[videoAnimationName][connectorType][index].conditionForLoop;
      
      if(condition){
        delay(duration)
        .then(() => {
          refs.conditionRef = refs.detailsRef.descriptionRef.current.conditionRef.current;
          refs.conditionRef.toggleEdit();

          return delay(duration)
        })
        .then(() => {
          refs.leftStatementRef = refs.conditionRef.leftStatementRef.current;
          refs.rightStatementRef = refs.conditionRef.rightStatementRef.current;

          const connectionMethods = ref.current.props.connection[condition.leftStatement.fromConnector].methods;

          let method;
          for(let i = 0; i < connectionMethods.length; i++) {
            if(connectionMethods[i].index === condition.leftStatement.leftMethodIndex){
              method = connectionMethods[i];
              break;
            }
          }

          refs.leftStatementRef.updateMethod(method);

          return delay(duration)
        })
        .then(() => {
          setFocusById(refs.leftStatementRef.paramInputRef.current.props.id);

          return delay(duration)
        })
        .then(() => {
          refs.leftStatementRef.updateParam(condition.leftStatement.leftParam);
          refs.leftParamInput = document.getElementById(refs.leftStatementRef.paramInputRef.current.props.id);

          return delay(duration)
        })
        .then(() => {
          refs.leftParamInput.blur();
          refs.conditionRef.updateRelationalOperator({ value: condition.relationalOperator});

          return delay(duration)
        })
        .then(() => {

          const connectionMethods = ref.current.props.connection[condition.rightStatement.fromConnector].methods;

          let method;
          for(let i = 0; i < connectionMethods.length; i++) {
            if(connectionMethods[i].index === condition.rightStatement.rightMethodIndex){
              method = connectionMethods[i];
              break;
            }
          }

          refs.rightStatementRef.updateMethod(method);

          return delay(duration)
        })
        .then(() => {
          refs.rightStatementRef.updateParam(condition.rightStatement.rightParam);

          return delay(duration)
        })
        .then(() => {
          refs.conditionRef.updateConnection();
          setIndex(index + 1);
        })
        .catch(() => {})
      }
      else{
        setIndex(index + 1);
      }
    }

    const methodDetails = () => {

      // setIndex(index + 1); return;

      const refs: any = {};

      refs.animationData = animationData[videoAnimationName][connectorType][index];
      refs.endpointData = refs.animationData.endpoint;
      refs.currentElementId = refs.animationData.index;

      delay(duration)
      .then(() => {
        if(refs.animationData.label){
          refs.labelRef = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.labelRef.current;
          refs.labelRef.toggleEdit();
          positionElementOver(["Label", "Label_option"], 10);
  
          return delay(duration)
        }
      })
      .then(() => {
        if(refs.animationData.label){
          positionElementOver(["Label", "Label_option"], 10, true);
          refs.labelRef.cancelEdit();

          return delay(duration)
        }
      })
      .then(() => {
        if(refs.endpointData){
          refs.urlRef = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.urlRef.current;
          refs.urlRef.toggleUrlVisibleIcon();
          positionElementOver(["url_label", "url_option"], 10);
          
          return delay(duration)
        }
      })
      .then(() => {
        if(refs.endpointData){
          positionElementOver([`param_generator_select_${connectorType}_${refs.currentElementId}`], 10);
          return delay(duration)
        }
      })
      .then(() => {
        if(refs.endpointData){
          refs.endpointRef = refs.urlRef.endpointRef.current;
          refs.paramGeneratorRef = refs.endpointRef.paramGeneratorRef.current;

          const connectionMethods = ref.current.props.connection[refs.endpointData.connectorType].methods;

          let method;
          for(let i = 0; i < connectionMethods.length; i++) {
            if(connectionMethods[i].index === refs.endpointData.index){
              method = connectionMethods[i];
              break;
            }
          }

          refs.paramGeneratorRef.updateColor(method)

          positionElementOver([`param_generator_select_${connectorType}_${refs.currentElementId}`], 10);
          
          return delay(duration)
        }

      })
      .then(() => {
        if(refs.endpointData){
          positionElementOver([`input_no_id`], 10)
          return delay(duration)
        }
      })
      .then(() => {
        if(refs.endpointData){
          refs.paramGeneratorRef.onChangeField(refs.endpointData.param)
          return delay(duration)
        }
      })
      .then(() => {
        if(refs.endpointData){
          positionElementOver([`param_generator_add_${connectorType}_${refs.currentElementId}`], 10)
          return delay(duration);
        }
      })
      .then(() => {
        if(refs.endpointData){
          refs.paramGeneratorRef.addParam()
          positionElementOver([`param_generator_add_${connectorType}_${refs.currentElementId}`], 10, true)
          return delay(duration);
        }
      })
      .then(() => {
        if(refs.endpointData){
          refs.urlRef.toggleUrlVisibleIcon();
  
          return delay(duration)
        }
      })
      .then(() => {
        if(connectorType === 'fromConnector' && index === 0){
          positionElementOver(["header_label", "header_option"], 10);
          refs.headerRef = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.headerRef.current;
          refs.headerRef.toggleHeaderVisible();
          return delay(duration)
        }
      })
      .then(() => {
        if(connectorType === 'fromConnector' && index === 0){
          positionElementOver(["header_label", "header_option"], 10, true);
          refs.headerRef.toggleHeaderVisible();

          return delay(duration)
        }
      })
      .then(async () => {
        const bodyData = refs.animationData.body;

        if(bodyData){
          refs.bodyRef = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.bodyRef.current;
          positionElementOver(["body_label", "body_option"], 10);
          
          await delay(duration)
          positionElementOver(["body_label", "body_option"], 10, true);
          refs.bodyRef.toggleBodyVisible();
      
          await delay(duration);
          positionElementOverByClassName(['.react-json-view .icon-container'], 10)
      
          await delay(duration);
          refs.collapse = document.querySelector('.react-json-view .collapsed-icon');
          refs.collapse.click()
      
          for(let i = 0; i < bodyData.length; i++){
            await delay(duration)
            let addButton = document.querySelector('.react-json-view .click-to-add');
            // @ts-ignore
            addButton.style.display = 'inline-block';
            positionElementOverByClassName(['.react-json-view .click-to-add'], 10)
        
            await delay(duration)
            refs.add = document.querySelector('.react-json-view .click-to-add-icon');
            refs.add.click()
          
            await delay(duration)
            positionElementOverByClassName(['.react-json-view .key-modal-input'], 10)
          
            await delay(duration)
            refs.input = document.querySelector('.react-json-view .key-modal-input')
            refs.nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
            refs.nativeInputValueSetter.call(refs.input, bodyData[i].keyName);
            refs.inputEvent = new Event('input', { bubbles: true});
            refs.input.dispatchEvent(refs.inputEvent);
            
            await delay(duration)
            let submitButton = document.querySelector('.react-json-view .key-modal-submit');
            // @ts-ignore
            submitButton.style = 'position: absolute; width: 1em; height: 1em; right: 0;';
            positionElementOverByClassName(['.react-json-view .key-modal-submit'], 10)
        
            await delay(duration)
            positionElementOverByClassName(['.react-json-view .key-modal-submit'], 10, true)
            refs.submit = document.querySelector('.react-json-view .key-modal-submit');
            refs.submit.click()
        
            await delay(duration)
            refs.editButton = document.querySelectorAll('.react-json-view .click-to-edit');
            // @ts-ignore
            refs.editButton[i].style.display = 'inline-block';
            positionElementOverByClassName(['.react-json-view .click-to-edit'], 10)
        
            await delay(duration)
            positionElementOverByClassName(['.react-json-view .click-to-edit'], 10, true)
            refs.edit = document.querySelectorAll('.react-json-view .click-to-edit-icon');
            refs.edit[i].click()
        
            await delay(duration)
            positionElementOverByClassName(['.react-json-view .variable-editor'], 10)
          
            await delay(duration)
            positionElementOverByClassName(['.react-json-view .variable-editor'], 10, true)
            refs.textarea = document.querySelector('.react-json-view .variable-editor');
            refs.nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
            refs.nativeTextAreaValueSetter.call(refs.textarea, bodyData[i].keyValue);
            refs.textarea.dispatchEvent(refs.inputEvent);
            
            if(bodyData[i].keyValue === '#'){
              
              for(let referenceCount = 0; referenceCount < bodyData[i].reference.length; referenceCount++) {
                for(let methodCount = 0; methodCount < bodyData[i].reference[referenceCount].method.length; methodCount++){
                  if(methodCount > 0){
                    await delay(duration)
                    refs.editButton = document.querySelectorAll('.react-json-view .click-to-edit');
                    // @ts-ignore
                    refs.editButton[i].style.display = 'inline-block';
                    positionElementOverByClassName(['.react-json-view .click-to-edit'], 10)
                
                    await delay(duration)
                    positionElementOverByClassName(['.react-json-view .click-to-edit'], 10, true)
                    refs.edit = document.querySelectorAll('.react-json-view .click-to-edit-icon');
                    refs.edit[i].click()
                  }
                  
                  
                  await delay(duration)
                  refs.currentItemId = ref.current.props.currentTechnicalItem.id;
                  positionElementOver([`param_generator_select_${refs.currentItemId}`], 10);
  
                  await delay(duration)
                  const connectionMethods = ref.current.props.connection[bodyData[i].reference[referenceCount].method[methodCount].fromConnector].methods;
                  
                  let method;
  
                  connectionMethods.forEach((element: any) => {
                    if(element.index === bodyData[i].reference[referenceCount].method[methodCount].index){
                      method = element;
                      return;
                    }
                  });
                  
                  refs.bodyRef.JsonBodyRef.current.props.ReferenceComponent.self.current.updateColor(method)
                  
                  await delay(duration)
                  positionElementOver([`input_no_id`], 10)
                  
                  await delay(duration)
                  refs.bodyRef.JsonBodyRef.current.props.ReferenceComponent.self.current.onChangeField(bodyData[i].reference[referenceCount].method[methodCount].param)
                  
                  await delay(duration)
                  positionElementOver([`param_generator_add_${refs.currentItemId}`], 10)
                  
                  await delay(duration)
                  positionElementOver([`param_generator_add_${refs.currentItemId}`], 10, true)
                  refs.bodyRef.JsonBodyRef.current.props.ReferenceComponent.self.current.submitEdit()
                }
  
                if(connectorType === 'toConnector' && bodyData[i].reference[referenceCount].enhancementDescription){
                  await delay(duration);
                  const referenceElement = document.querySelectorAll('.reference_element');
                  referenceElement[i].classList.add(`reference_element_${i}`);
                  positionElementOverByClassName([`.reference_element_${i}`], 10);
                  
                  
                  await delay(duration);
                  positionElementOverByClassName([`.reference_element_${i}`], 10, true);
                  // @ts-ignore
                  referenceElement[i].click();
    
                  await delay(duration)
                  positionElementOver(['enhancement_description'], 10);

                  await delay(duration)
                  refs.textarea = document.querySelector('#enhancement_description');
                  refs.nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
                  refs.nativeTextAreaValueSetter.call(refs.textarea, bodyData[i].reference[referenceCount].enhancementDescription);
                  refs.textarea.dispatchEvent(refs.inputEvent);
                  
                  await delay(duration);
                  positionElementOver(['enhancement_description'], 10, true);
                  positionElementOverByClassName(['.ace_content'], 10);

                  await delay(duration);
                  refs.bodyRef.enhancementRef.current.props.onChange(bodyData[i].reference[referenceCount].enhancementContent);

                  await delay(duration);
                  positionElementOverByClassName(['.ace_content'], 10, true);
                }
              }
            }
            else{
              await delay(duration);
              positionElementOverByClassName(['.react-json-view .edit-check'], 10);

              await delay(duration);
              positionElementOverByClassName(['.react-json-view .edit-check'], 10, true);
              refs.editSubmit = document.querySelector('.react-json-view .edit-check');
      
              refs.editSubmit.click();
            }
          }
          await delay(duration);
          refs.bodyRef.toggleBodyVisible();
          return delay(duration);
        }
      })          
      .then(() => {
        if(connectorType === 'fromConnector' && index === 0){
          positionElementOver(["response_label"], 10);
          return delay(duration);
        }
      })
      .then(() => {
        if(connectorType === 'fromConnector' && index === 0){
          ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.toggleResponseVisibleIcon();
          positionElementOver(["response_label"], 10, true);
          return delay(duration);
        }
      })
      .then(() => {
        if(index === animationData[videoAnimationName].toConnector.length - 1 && connectorType === 'toConnector'){
          positionElementOver(['delete_icon'], 10);

          return delay(duration);
        }
      })
      .then(() => {
        if(index === animationData[videoAnimationName].toConnector.length - 1 && connectorType === 'toConnector'){
          positionElementOver(['delete_icon'], 10, true)
          const processRef = ref.current.technicalLayoutRef.current.svgRef.current.processRef.current;

          processRef.deleteProcess();
          return delay(duration);
        }
      })
      .then(() => {
        if(index === animationData[videoAnimationName].toConnector.length - 1 && connectorType === 'toConnector'){
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
          setIndex(index + 1);
        }
        else{
          setIndex(index + 1);
        }
      })
      .catch(() => {})
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
        if(type === "process" && label){
          setFocusById('new_request_label');
          return delay(duration);
        }
      })
      .then(() => {
        if(type === "process" && label){
          const createProcessRef = ref.current.createElementPalenRef.current.createProcessRef.current;
          createProcessRef.changeLabel(label)
          return delay(duration);
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
          methodDetails();
        }
        if(name === 'if'){
          ifDetails();
        }
        if(name === 'loop'){
          loopDetails();
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
