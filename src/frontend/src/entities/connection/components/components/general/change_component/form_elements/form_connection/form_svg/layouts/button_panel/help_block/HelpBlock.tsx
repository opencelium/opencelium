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

import { setVideoAnimationName, setAnimationPreviewPanelVisibility } from "@entity/connection/redux_toolkit/slices/ConnectionSlice";

import { setFocusById, positionElementOver, positionElementOverByClassName } from '@application/utils/utils';


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
 
    const [connectorType, setConnectorType] = useState('fromConnector');
    const [showLinkInBody, setShowLinkInBody] = useState(true);

    const ref = React.useRef(null);
    const duration = 1200;

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
          },
          {
            "type": "process",
            "name": "GetBoardList",
            "label": "test3"
          },
          {
            "type": "operator",
            "name": "loop",
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
          },
          {
            "type": "process",
            "name": "GetBoards",
            "label": "test5"
          },
        ]
      },
      "configureAPI": {
        "fromConnector": [
          {
            "type": "process",
            "name": "GetBoards",
            "label": "test"
          },
          {
            "type": "operator",
            "name": "if",
          },
          {
            "type": "process",
            "name": "GetBoardList",
            "label": "test3"
          },
          {
            "type": "operator",
            "name": "loop",
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

    const ifDetails = () => {
      const refs: any = {};
      refs.detailsRef = ref.current.detailsRef.current;

      if(refs.detailsRef){
        delay(duration)
        .then(() => {
          refs.conditionRef = refs.detailsRef.descriptionRef.current.conditionRef.current;
          refs.conditionRef.toggleEdit();

          return delay(duration)
        })
        .then(() => {
          refs.leftStatementRef = refs.conditionRef.leftStatementRef.current;
          refs.rightStatementRef = refs.conditionRef.rightStatementRef.current;
          refs.leftStatementRef.updateMethod(refs.leftStatementRef.methodSelectRef.current.props.source[0]);

          return delay(duration)
        })
        .then(() => {
          setFocusById(refs.leftStatementRef.paramInputRef.current.props.id);

          return delay(duration)
        })
        .then(() => {
          refs.leftStatementRef.updateParam("[0]");
          refs.leftParamInput = document.getElementById(refs.leftStatementRef.paramInputRef.current.props.id);

          return delay(duration)
        })
        .then(() => {
          refs.leftParamInput.blur();
          refs.conditionRef.updateRelationalOperator({ value: "Contains", label: {} });

          return delay(duration)
        })
        .then(() => {
          setFocusById(`if_operator_property_${refs.rightStatementRef.props.operator.index}`);

          return delay(duration)
        })
        .then(() => {
          refs.rightStatementRef.updateProperty("id");
          refs.propertyInput = document.getElementById(`if_operator_property_${refs.rightStatementRef.props.operator.index}`);

          return delay(duration)
        })
        .then(() => {
          refs.propertyInput.blur();

          return delay(duration)
        })
        .then(() => {
          refs.rightStatementRef.updateMethod(refs.leftStatementRef.methodSelectRef.current.props.source[0]);

          return delay(duration)
        })
        .then(() => {
          setFocusById(refs.rightStatementRef.paramInputRef.current.props.id);

          return delay(duration)
        })
        .then(() => {
          refs.rightStatementRef.updateParam("[0]");
          refs.rightParamInput = document.getElementById(refs.rightStatementRef.paramInputRef.current.props.id)

          return delay(duration)
        })
        .then(() => {
          refs.rightParamInput.blur();


          return delay(duration)
        })
        .then(() => {
          refs.conditionRef.toggleEdit();
          setIndex(index + 1);
        })
        .catch(() => {})
      }
    }

    const loopDetails = () =>{
      const refs: any = {};
      refs.detailsRef = ref.current.detailsRef.current;
      
      if(refs.detailsRef){
        delay(duration)
        .then(() => {
          refs.conditionRef = refs.detailsRef.descriptionRef.current.conditionRef.current;
          refs.conditionRef.toggleEdit();

          return delay(duration)
        })
        .then(() => {
          refs.leftStatementRef = refs.conditionRef.leftStatementRef.current;
          refs.rightStatementRef = refs.conditionRef.rightStatementRef.current;
          refs.leftStatementRef.updateMethod(refs.leftStatementRef.methodSelectRef.current.props.source[0]);

          return delay(duration)
        })
        .then(() => {
          setFocusById(refs.leftStatementRef.paramInputRef.current.props.id);

          return delay(duration)
        })
        .then(() => {
          refs.leftStatementRef.updateParam("[0]");
          refs.leftParamInput = document.getElementById(refs.leftStatementRef.paramInputRef.current.props.id);

          return delay(duration)
        })
        .then(() => {
          refs.leftParamInput.blur();
          refs.conditionRef.updateRelationalOperator({ value: "SplitString", label: {} });

          return delay(duration)
        })
        .then(() => {
          refs.rightStatementRef.updateMethod(refs.leftStatementRef.methodSelectRef.current.props.source[0]);

          return delay(duration)
        })
        .then(() => {
          refs.rightStatementRef.updateParam("[0]");

          return delay(duration)
        })
        .then(() => {
          refs.conditionRef.toggleEdit();
          setIndex(index + 1);
        })
        .catch(() => {})
      }
    }

    const methodDetails = () => {
      const refs: any = {};
      refs.name = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.nameRef.current.selectableInputRef.current;

      delay(duration)
      .then(() => {
        refs.name.toggleEdit();
        positionElementOver(["Name", "Name_option"], 10);

        return delay(duration)
      })
      .then(() => {
        refs.name.toggleConfirmation();

        return delay(duration)
      })
      .then(() => {
        refs.name.cancelEdit();

        return delay(duration)
      })
      .then(() => {
        refs.label = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.labelRef.current;
        refs.label.toggleEdit();
        positionElementOver(["Label", "Label_option"], 10);

        return delay(duration)
      })
      .then(() => {
        refs.label.cancelEdit();

        return delay(duration)
      })
      .then(() => {
        refs.url = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.urlRef.current;
        refs.url.toggleUrlVisibleIcon();
        positionElementOver(["url_label", "url_option"], 10);

        return delay(duration)
      })
      .then(() => {
        if(connectorType === 'toConnector'){
          positionElementOver([`param_generator_select_${connectorType}_${index}`], 10);
          return delay(duration)
        }
      })
      .then(() => {
        if(connectorType === 'toConnector'){
          if(ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.urlRef.current.endpointRef.current){
            const method = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.urlRef.current.endpointRef.current.paramGeneratorRef.current.getOptionsForMethods()
            ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.urlRef.current.endpointRef.current.paramGeneratorRef.current.updateColor(method[0].options[0])
          }
          return delay(duration)
        }

      })
      .then(() => {
        if(connectorType === 'toConnector'){
          positionElementOver([`input_no_id`], 10)
          return delay(duration)
        }
      })
      .then(() => {
        if(connectorType === 'toConnector'){
          ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.urlRef.current.endpointRef.current.paramGeneratorRef.current.onChangeField('[0]')
          return delay(duration)
        }
      })
      .then(() => {
        if(connectorType === 'toConnector'){
          positionElementOver([`param_generator_add_${connectorType}_${index}`], 10)
          return delay(duration);
        }
      })
      .then(() => {
        if(connectorType === 'toConnector'){
          if(ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.urlRef.current.endpointRef.current){
           ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.urlRef.current.endpointRef.current.paramGeneratorRef.current.addParam()
           positionElementOver([`param_generator_add_${connectorType}_${index}`], 10, true)
           return delay(duration);
          }
        }
      })
      .then(() => {
        refs.url.toggleUrlVisibleIcon();

        return delay(duration)
      })
      .then(() => {
        refs.header = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.headerRef.current;
        refs.header.toggleHeaderVisible();
        positionElementOver(["header_label", "header_option"], 10);

        return delay(duration)
      })
      .then(() => {
        refs.header.toggleHeaderVisible();

        return delay(duration)
      })
      .then(() => {
        refs.body = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.bodyRef.current;
        refs.body.toggleBodyVisible();
        positionElementOver(["body_label", "body_option"], 10);

        return delay(duration)
      })
      .then(() => {
        positionElementOver(["body_label", "body_option"], 10, true);
        positionElementOverByClassName(['.react-json-view .icon-container'], 10)

        return delay(duration)
      })
      .then(() => {
        refs.collapse = document.querySelector('.react-json-view .collapsed-icon');
        refs.collapse.click()

        return delay(duration)
      })
      .then(() => {
        let addButton = document.querySelector('.react-json-view .click-to-add');
        // @ts-ignore
        addButton.style.display = 'inline-block';
        positionElementOverByClassName(['.react-json-view .click-to-add'], 10)

        return delay(duration)
      })
      .then(() => {
        refs.add = document.querySelector('.react-json-view .click-to-add-icon');
        refs.add.click()

        return delay(duration)
      })
      .then(() => {
        positionElementOverByClassName(['.react-json-view .key-modal-input'], 10)

        return delay(duration)
      })
      .then(() => {
        refs.input = document.querySelector('.react-json-view .key-modal-input')
        refs.nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        refs.nativeInputValueSetter.call(refs.input, 'key name');

        refs.inputEvent = new Event('input', { bubbles: true});
        refs.input.dispatchEvent(refs.inputEvent);

        return delay(duration)
      })
      .then(() => {
        let submitButton = document.querySelector('.react-json-view .key-modal-submit');
        // @ts-ignore
        submitButton.style = 'position: absolute; width: 1em; height: 1em; right: 0;';
        positionElementOverByClassName(['.react-json-view .key-modal-submit'], 10)

        return delay(duration)
      })
      .then(() => {
        positionElementOverByClassName(['.react-json-view .key-modal-submit'], 10, true)
        refs.submit = document.querySelector('.react-json-view .key-modal-submit');
        refs.submit.click()

        return delay(duration)
      })
      .then(() => {
        let editButton = document.querySelector('.react-json-view .click-to-edit');
        // @ts-ignore
        editButton.style.display = 'inline-block'
        positionElementOverByClassName(['.react-json-view .click-to-edit'], 10)

        return delay(duration)
      })
      .then(() => {
        positionElementOverByClassName(['.react-json-view .click-to-edit'], 10, true)
        refs.edit = document.querySelector('.react-json-view .click-to-edit-icon');
        
        refs.edit.click()

        return delay(duration)
      })
      .then(() => {
        positionElementOverByClassName(['.react-json-view .variable-editor'], 10)
        
        return delay(duration)
      })
      .then(() => {
        positionElementOverByClassName(['.react-json-view .variable-editor'], 10, true)
        refs.textarea = document.querySelector('.react-json-view .variable-editor');
        refs.nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
        refs.nativeTextAreaValueSetter.call(refs.textarea, `${index >= 1 && showLinkInBody && connectorType === 'fromConnector' || index === 0 && showLinkInBody && connectorType === 'toConnector' ? '#' : 'key value'}`);

        return delay(duration)
      })
      .then(() => {
        refs.textarea.dispatchEvent(refs.inputEvent);

        return delay(duration)
      })
      .then(() =>{
        if(index >= 1 && showLinkInBody && connectorType === 'fromConnector' || index === 0 && showLinkInBody && connectorType === 'toConnector'){
          if(ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.bodyRef.current.JsonBodyRef.current.props.ReferenceComponent.self.current !== null){
            positionElementOver([`param_generator_select_${connectorType}_${index}`], 10);
            return delay(duration)
          }
        }
      })
      .then(() =>{
        if(index >= 1 && showLinkInBody && connectorType === 'fromConnector' || index === 0 && showLinkInBody && connectorType === 'toConnector'){
          if(ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.bodyRef.current.JsonBodyRef.current.props.ReferenceComponent.self.current !== null){
            const method = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.bodyRef.current.JsonBodyRef.current.props.ReferenceComponent.self.current.getOptionsForMethods();
            console.log(method)
            ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.bodyRef.current.JsonBodyRef.current.props.ReferenceComponent.self.current.updateColor(connectorType === 'toConnector' ? method[0].options[0] : method[0])
            return delay(duration)
          }
        }
      })
      .then(() =>{
        if(index >= 1 && showLinkInBody && connectorType === 'fromConnector' || index === 0 && showLinkInBody && connectorType === 'toConnector'){
          if(ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.bodyRef.current.JsonBodyRef.current.props.ReferenceComponent.self.current !== null){
            positionElementOver([`input_no_id`], 10)
            return delay(duration)
          }
        }
      })
      .then(() =>{
        if(index >= 1 && showLinkInBody && connectorType === 'fromConnector' || index === 0 && showLinkInBody && connectorType === 'toConnector'){
          if(ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.bodyRef.current.JsonBodyRef.current.props.ReferenceComponent.self.current !== null){
            ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.bodyRef.current.JsonBodyRef.current.props.ReferenceComponent.self.current.onChangeField('[0]')
            return delay(duration)
          }
        }
      })
      .then(() =>{
        if(index >= 1 && showLinkInBody && connectorType === 'fromConnector' || index === 0 && showLinkInBody && connectorType === 'toConnector'){
          if(ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.bodyRef.current.JsonBodyRef.current.props.ReferenceComponent.self.current !== null){
            positionElementOver([`param_generator_add_${connectorType}_${index}`], 10)
            return delay(duration)
          }
        }
      })
      .then(() =>{
        if(index >= 1 && showLinkInBody && connectorType === 'fromConnector' || index === 0 && showLinkInBody && connectorType === 'toConnector'){
          if(ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.bodyRef.current.JsonBodyRef.current.props.ReferenceComponent.self.current !== null){
            positionElementOver([`param_generator_add_${connectorType}_${index}`], 10, true)
            ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.bodyRef.current.JsonBodyRef.current.props.ReferenceComponent.self.current.submitEdit()
            setShowLinkInBody(false);
            return delay(duration)
          }
        }
      })
      .then(() => {
        if(index === 0 && showLinkInBody && connectorType === 'toConnector'){
          positionElementOverByClassName(['.reference_element'], 10)
          
          return delay(duration);
        } 
      })
      .then(() => {
        if(index === 0 && showLinkInBody && connectorType === 'toConnector'){
          positionElementOverByClassName(['.reference_element'], 10, true)
          const referenceElement = document.querySelector('.reference_element');
          // @ts-ignore
          referenceElement.click();
          return delay(duration);
        } 
      })
      .then(() => {
        if(index === 0 && showLinkInBody && connectorType === 'toConnector'){
          positionElementOver(['enhancement_description'], 10)
          refs.textarea = document.querySelector('#enhancement_description');
          refs.nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
          refs.nativeTextAreaValueSetter.call(refs.textarea, 'Enhancement description');
          refs.textarea.dispatchEvent(refs.inputEvent);
          return delay(duration)
        }
      })
      .then(() => {
        if(index === 0 && connectorType === 'fromConnector'){
          positionElementOverByClassName(['.react-json-view .edit-check'], 10)

          return delay(duration)
        }
      })
      .then(() => {
        if(index === 0 && connectorType === 'fromConnector'){
          positionElementOverByClassName(['.react-json-view .edit-check'], 10, true)
          refs.editSubmit = document.querySelector('.react-json-view .edit-check');
  
          refs.editSubmit.click()
          
          return delay(duration)
        }
      })
      .then(() => {
        if(index === 0 && showLinkInBody && connectorType === 'toConnector'){
          positionElementOver(['enhancement_description'], 10, true)
        }
        refs.body.toggleBodyVisible();
        
        return delay(duration)
      })
      .then(() => {
        ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.toggleResponseVisibleIcon();
        positionElementOver(["response_label"], 10, true);
        setIndex(index + 1)
      })
      .catch(() => {})
    }

    const animationFunction = (panel: string) => {

      const type = animationData[videoAnimationName][panel][index].type;
      const name = animationData[videoAnimationName][panel][index].name;
      const label = animationData[videoAnimationName][panel][index].label;
      const prevElementType = animationData[videoAnimationName][panel][index > 0 ? index - 1 : index].type;
      const svgRef = ref.current.technicalLayoutRef.current.svgRef.current;

      const connectorPanel = panel === 'fromConnector' ? svgRef.fromConnectorPanelRef.current : svgRef.toConnectorPanelRef.current;
      
      
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
        
        type === "process" ? createProcessRef.create() : createOperatorRef.create()
        const processRef = svgRef.processRef.current;
        processRef.onClick()
        if(index >= 1 && showLinkInBody && connectorType === 'fromConnector' && name !=='if' && name !== 'loop'){
          methodDetails()
        }
        if(index <= 0){
          methodDetails()
        }
        if(name === 'if'){
          ifDetails()
        }
        if(name === 'loop'){
          loopDetails()
        }
        if(index >= 1 && name !== 'if' && name !== 'loop' && !showLinkInBody){
          setIndex(index + 1);
        }
        // if(index <= 0 && connectorType === 'toConnector'){
        //   setIndex(index + 1);
        // }
        return delay(duration);
      })
      .then(() => {
        if(index === animationData[videoAnimationName].toConnector.length - 1 && connectorType === 'toConnector'){
          positionElementOver(['delete_icon'], 10)

          return delay(duration)
        }
      })
      .then(() => {
        if(index === animationData[videoAnimationName].toConnector.length - 1 && connectorType === 'toConnector'){
          positionElementOver(['delete_icon'], 10, true)
          const processRef = svgRef.processRef.current;

          processRef.deleteProcess();
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
