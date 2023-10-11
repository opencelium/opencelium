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
import ReactDOM from "react-dom";
import { withTheme } from "styled-components";
import { TooltipButton } from "@app_component/base/tooltip_button/TooltipButton";
import { TextSize } from "@app_component/base/text/interfaces";
import { HelpBlockStyled } from "./styles";
import {ConnectorPanelType, IfOperatorFunctions, LoopOperatorFunctions, MethodFunctions} from "./interfaces";
import { ColorTheme } from "@style/Theme";
import { useAppDispatch } from "@application/utils/store";
import Dialog from "@app_component/base/dialog/Dialog";
// @ts-ignore
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import Content from "./content/Content";
import FormConnectionSvg from "@entity/connection/components/components/general/change_component/form_elements/form_connection/form_svg/FormConnectionSvg";
import { ModalContext } from "@entity/connection/components/components/general/change_component/FormSection";
import animationData from "./AnimationData";
import CConnection from "@classes/content/connection/CConnection";
import {setAnimationPaused, setModalCurrentTechnicalItem, toggleModalDetails } from "@root/redux_toolkit/slices/ModalConnectionSlice";
import {CONNECTOR_FROM, CONNECTOR_TO} from "@classes/content/connection/CConnectorItem";
import { Connector } from "@entity/connector/classes/Connector";
import {ModalConnection} from "@root/classes/ModalConnection";
import { Connection } from "@entity/connection/classes/Connection";
import { setVideoAnimationName, setAnimationPreviewPanelVisibility, setIsAnamationNotFoud } from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import AnimationSpeed from "./AnimationSpeed/AnimationSpeed";
import DetailsForOperators from "./classes/DetailsForOperators";
import DetailsForProcess from "./classes/DetailsForProcess";
import AdditionalFunctions from "./classes/AdditionalFunctions";
import { AnimationPopoverProps } from "./AnimationPopover/interfaces";
import AnimationPopover from "./AnimationPopover/AnimationPopover";
import AnimationFunctionSteps from "./classes/AnimationFunctionSteps";
import { getAllInvokers } from "@entity/invoker/redux_toolkit/action_creators/InvokerCreators";
import { Invoker } from "@entity/invoker/classes/Invoker";
import Loading from "@app_component/base/loading/Loading";
import { API_REQUEST_STATE } from "@application/interfaces/IApplication";
import SyncInvokers from "@entity/connection/components/components/general/change_component/form_elements/form_connection/form_methods/SyncInvokers";
import RefFunctions from "./classes/RefFunctions";
import Shortcuts from "./shortcuts/Shortcuts";
import {
  DetailsForOperatorsMethodProps
} from "@change_component/form_elements/form_connection/form_svg/layouts/button_panel/help_block/interfaces/IDetailsForOperators";


const prepareConnection = (connection: any, connectors: any, invokers: any) => {
  if(connection && connection.fromConnector && connection.toConnector) {
    let fromInvoker = invokers.find((i: any) => i.name === connection.fromConnector.invoker.name);
    let toInvoker = invokers.find((i: any) => i.name === connection.toConnector.invoker.name);
    if(fromInvoker && toInvoker) {
      connection.fromConnector.methods = connection.fromConnector.methods || [];
      connection.fromConnector.operators = connection.fromConnector.operators || [];
      //@ts-ignore
      connection.fromConnector.invoker = fromInvoker;
      connection.fromConnector.setConnectorType(CONNECTOR_FROM);
      connection.toConnector.methods = connection.toConnector.methods || [];
      connection.toConnector.operators = connection.toConnector.operators ||[];
      //@ts-ignore
      connection.toConnector.invoker = toInvoker;
      connection.toConnector.setConnectorType(CONNECTOR_TO);
    }
  }
  return connection;
}

const HelpBlock = () => {
  const dispatch = useAppDispatch();
  const [ animationProps, setAnimationProps ] = useState<any>({connection: CConnection.createConnection()})
  const { connectors } = Connector.getReduxState();
  const { invokers, gettingInvokers } = Invoker.getReduxState();
  const [ isVisible, setIsVisible ] = useState(false);
  const { isButtonPanelOpened, videoAnimationName, animationSpeed, isAnimationNotFound } = Connection.getReduxState();
  const { isAnimationPaused: isPaused, isDetailsOpened } = ModalConnection.getReduxState();
  const [ index, setIndex ] = useState(0);

  const [connectorType, setConnectorType] = useState<ConnectorPanelType>("fromConnector");

  const [popoverProps, setPopoverProps] = useState<AnimationPopoverProps>(null);

  const ref = React.useRef(null);

  const videoAnimationNameReference: any = React.useRef();
  videoAnimationNameReference.current = videoAnimationName;

  const isPausedReference: any = React.useRef();
  isPausedReference.current = isPaused;

  const animationSpeedReference: any = React.useRef();
  animationSpeedReference.current = animationSpeed;

  const showDetailsForOperatorIf = async (condition: any) => {
    const refs: any = {};
    refs.animationData = animationData[videoAnimationName][connectorType].items[index];
    const details = new DetailsForOperators(ref, setPopoverProps, condition, refs.animationData);
    await AdditionalFunctions.delay(animationSpeedReference.current)
    if(refs.animationData.delete){
      await details.deleteOperator(animationSpeedReference.current);
    }
    else{
      if(condition){
        const conditionRef = RefFunctions.getCondition(ref);
        const operatorFunctions: IfOperatorFunctions = {
          LeftExpression: ["openConditionDialog", "changeLeftMethod", "setFocusOnLeftParam", "changeLeftParam"],
          RelationalOperator: "changeRelationalOperator",
          RightExpression: {
            PropertyExpression: ["setFocusOnRightProperty", "changeRightProperty", "removeFocusFromRightProperty"],
            RestExpression: ["changeRightMethod", "setFocusOnRightParam", "changeRightParam", "removeFocusFromRightParam"]
          }
        }
        for(let i = 0; i < operatorFunctions.LeftExpression.length; i++){
          await details[operatorFunctions.LeftExpression[i]](animationSpeedReference.current);
        }
        await details[operatorFunctions.RelationalOperator](animationSpeedReference.current);
        if(condition.rightStatement) {
          if (condition.rightStatement.property) {
            for (let i = 0; i < operatorFunctions.RightExpression.PropertyExpression.length; i++) {
              await details[operatorFunctions.RightExpression.PropertyExpression[i]](animationSpeedReference.current);
            }
          }
          for (let i = 0; i < operatorFunctions.RightExpression.RestExpression.length; i++) {
            await details[operatorFunctions.RightExpression.RestExpression[i]](animationSpeedReference.current);
          }
        }
        if(conditionRef){
          conditionRef.updateConnection();
        }
      }
    }
  }

  const showDetailsForOperatorLoop = async (condition: any) => {
    const refs: any = {};
    refs.animationData = animationData[videoAnimationName][connectorType].items[index];
    const details = new DetailsForOperators(ref, setPopoverProps, condition, refs.animationData);
    await AdditionalFunctions.delay(animationSpeedReference.current)
    if(refs.animationData.delete){
      await details.deleteOperator(animationSpeedReference.current);
    }
    else{
      if(condition){
        const conditionRef = RefFunctions.getCondition(ref);
        const operatorFunctions: LoopOperatorFunctions = {
          LeftExpression: ["openConditionDialog", "changeLeftMethod", "setFocusOnLeftParam", "changeLeftParam"],
          RelationalOperator: "changeRelationalOperator",
          RightExpression: ["changeRightMethod", "changeRightParam"],
        };
        for(let i = 0; i < operatorFunctions.LeftExpression.length; i++){
          await details[operatorFunctions.LeftExpression[i]](animationSpeedReference.current);
        }
        await details[operatorFunctions.RelationalOperator](animationSpeedReference.current);
        if(condition.rightStatement){
          for(let i = 0; i < operatorFunctions.RightExpression.length; i++){
            await details[operatorFunctions.RightExpression[i]](animationSpeedReference.current);
          }
        }
        if(conditionRef){
          conditionRef.updateConnection();
        }
      }
    }
  }

  const showDetailsForProcess = async () => {
    const refs: any = {};
    refs.animationData = animationData[videoAnimationName][connectorType].items[index];
    refs.endpointData = refs.animationData.endpoint;
    refs.currentElementId = refs.animationData.index;
    const details = new DetailsForProcess(ref, setPopoverProps, refs.animationData);
    await AdditionalFunctions.delay(animationSpeedReference.current);
    if(refs.animationData.delete){
      await details.deleteProcess(animationSpeedReference.current);
    }
    else{
      const methodFunctions: MethodFunctions = {
        Label: ["startEditLabel", "endEditLabel"],
        Url: ["openUrlDialog", "changeUrlMethod", "changeUrlParam", "addUrlParam", "closeUrlDialog"],
        Header: ["openHeaderDialog", "closeHeaderDialog"],
        Body: {
          KeyNotExist: [
            "displayBodyAddKeysButton","showPopoverForBodyAddKeysButton",
            "clickAddKeysButton","addBodyKeyName","displaySubmitButtonToAddKey",
            "clickSubmitButtonToAddKey",
          ],
          DeleteKey: [
            "displayRemoveKeyButton","showPopoverForBodyRemoveKeysButton","clickRemoveKeyButton",
          ],
          AddValue: [
            "displayEditKeyValueButton","clickEditKeyValueButton",
            "showPopoverForAddBodyKeyValue","addBodyKeyValue",
          ],
          SetReference: [
              "changeBodyMethod", "changeBodyParam", "addBodyMethodAndParam"
          ]
        }
      }
      if(refs.animationData.changeLabel){
        for(let i = 0; i < methodFunctions.Label.length; i++){
          await details[methodFunctions.Label[i]](animationSpeedReference.current);
        }
      }
      if(refs.endpointData){
        for(let i = 0; i < methodFunctions.Url.length; i++){
          await details[methodFunctions.Url[i]](animationSpeedReference.current, refs.animationData, methodFunctions.Url[i] === "addUrlParam" ? connectorType : refs.endpointData.connectorType);
        }
      }
      if(refs.animationData.header){
        for(let i = 0; i < methodFunctions.Header.length; i++){
          await details[methodFunctions.Header[i]](animationSpeedReference.current);
        }
      }
      const bodyData = refs.animationData.body;
      if(bodyData){
        await details.showPopoverForOpenBodyDialog(animationSpeedReference.current);
        await details.openBodyDialog(animationSpeedReference.current);
        if(bodyData.length > 0){
          let availableBodyContent: any;
          for(let i = 0; i < bodyData.length; i++){
            if(bodyData[i].available){
              availableBodyContent = true;
              break;
            }
          }
          if(!availableBodyContent){
            await details.openBodyObject(animationSpeedReference.current);
          }
          for(let bodyIndex = 0; bodyIndex < bodyData.length; bodyIndex++){
            if(!bodyData[bodyIndex].available){
              for(let i = 0; i < methodFunctions.Body.KeyNotExist.length; i++){
                await details[methodFunctions.Body.KeyNotExist[i]](animationSpeedReference.current, bodyData[bodyIndex].keyName);
              }
            }
            if(bodyData[bodyIndex].deleteKey){
              for(let i = 0; i < methodFunctions.Body.DeleteKey.length; i++){
                await details[methodFunctions.Body.DeleteKey[i]](animationSpeedReference.current, bodyIndex);
              }
            }
            for(let i = 0; i < methodFunctions.Body.AddValue.length; i++){
              await details[methodFunctions.Body.AddValue[i]](animationSpeedReference.current, methodFunctions.Body.AddValue[i] === "addBodyKeyValue" ? bodyData[bodyIndex].keyValue : bodyIndex);
            }
            if(bodyData[bodyIndex].keyValue === '#'){
              for(let referenceIndex = 0; referenceIndex < bodyData[bodyIndex].reference.length; referenceIndex++) {
                for(let methodIndex = 0; methodIndex < bodyData[bodyIndex].reference[referenceIndex].method.length; methodIndex++){
                  try{
                    if(ref.current.props){
                      const currentItemId = ref.current.props.currentTechnicalItem.id;
                      if(currentItemId){
                        if(methodIndex > 0){
                          await details.displayEditKeyValueButton(animationSpeedReference.current, bodyIndex);
                          await details.clickEditKeyValueButton(animationSpeedReference.current, bodyIndex);
                        }
                        for(let i = 0; i < methodFunctions.Body.SetReference.length; i++){
                          await details[methodFunctions.Body.SetReference[i]](animationSpeedReference.current, bodyData, bodyIndex, referenceIndex, methodIndex, currentItemId);
                        }
                      }
                    }
                    else{
                      throw new Error('props is not defined')
                    }
                  }
                  catch(e){}
                }
                if(connectorType === 'toConnector' && bodyData[bodyIndex].reference[referenceIndex].enhancementDescription || connectorType === 'toConnector' && bodyData[bodyIndex].reference[referenceIndex].enhancementContent){
                  let bIndex;
                  if(bodyData[bodyIndex - 1]){
                    bIndex = bodyData[bodyIndex - 1].deleteKey ? bodyIndex - 1 : bodyIndex;
                  }
                  else{
                    bIndex = bodyIndex;
                  }
                  await details.clickOnReferenceElements(animationSpeedReference.current, bIndex);
                  if(connectorType === 'toConnector' && bodyData[bodyIndex].reference[referenceIndex].enhancementDescription){
                    await details.changeReferenceDescription(animationSpeedReference.current, bodyData, bodyIndex, referenceIndex);
                  }
                  if(connectorType === 'toConnector' && bodyData[bodyIndex].reference[referenceIndex].enhancementContent){
                    await details.changeReferenceContent(animationSpeedReference.current, bodyData, bodyIndex, referenceIndex);
                  }
                }
              }
            }
            else{
              await details.clickSubmitButtonToAddValue(animationSpeedReference.current, bodyIndex);
            }
          }
        }
        await details.closeBodyDialog(animationSpeedReference.current);
      }
      if(refs.animationData.response){
        await details.showResponse(animationSpeedReference.current);
      }
    }
  }

  const animationFunction = async (connectorPanelType: ConnectorPanelType) => {
    const refs: any = {};
    const initialConnection = animationData[videoAnimationName].initialConnection;
    const hasInitialConnection = (!!initialConnection);
    refs.animationData = animationData[videoAnimationName][connectorPanelType].items[index];

    const animationSteps = new AnimationFunctionSteps(ref, refs.animationData, setPopoverProps);

    const currentElementId = animationData[videoAnimationName][connectorPanelType].items[index].index;
    const type = animationData[videoAnimationName][connectorPanelType].items[index].type;
    const name = animationData[videoAnimationName][connectorPanelType].items[index].name;
    const label = animationData[videoAnimationName][connectorPanelType].items[index].label;
    const prevElementType = hasInitialConnection ? 'process' : animationData[videoAnimationName][connectorPanelType].items[index > 0 ? index - 1 : index].type;
    const fromConnectorPanelRef = RefFunctions.getFromConnectorPanel(ref);
    const toConnectorPanelRef = RefFunctions.getToConnectorPanel(ref);

    const connectorPanel = connectorPanelType === 'fromConnector' ? fromConnectorPanelRef : toConnectorPanelRef;

    if(index <= 0 && !hasInitialConnection){
      if(!isDetailsOpened){
        dispatch(setModalCurrentTechnicalItem(null));
        dispatch(toggleModalDetails())
      }
      const technicalLayout = document.getElementById('modal_technical_layout_svg');
      technicalLayout.removeAttribute('style')
      await AdditionalFunctions.delay(animationSpeedReference.current)

      await animationSteps.clickOnPanel(connectorPanel, connectorPanelType, animationSpeedReference.current);
    }
    else{
      if(hasInitialConnection && index === 0){
        if(!isDetailsOpened){
          dispatch(setModalCurrentTechnicalItem(null));
          dispatch(toggleModalDetails())
        }
        const technicalLayout = document.getElementById('modal_technical_layout_svg');
        technicalLayout.removeAttribute('style')
        const fromItems = animationData[videoAnimationName].fromConnector.items;
        const toItems = animationData[videoAnimationName].toConnector.items;
        const firstItem = fromItems.length > 0 ? fromItems[0] : toItems.length > 0 ? toItems[0] : null;
        if(firstItem) {
          const connector = animationProps.connection.getConnectorByType(fromItems.length ? 'fromConnector' : 'toConnector');
          await animationSteps.setCurrentItem(connector, firstItem.index, animationSpeedReference.current);
          await animationSteps.setFocusOnCurrentElement();
        }
      }

      if(refs.animationData.after){
        const fromItems = animationData[videoAnimationName].fromConnector.items;
        const connector = animationProps.connection.getConnectorByType(fromItems.length ? 'fromConnector' : 'toConnector');
        const currentItem = connector.getSvgElementByIndex(refs.animationData.after);
        const technicalLayout = RefFunctions.getTechnicalLayout(ref);
        technicalLayout.setCurrentItem(currentItem);
        await animationSteps.onMouseOver(refs.animationData.afterElementType, animationSpeedReference.current);
      }
      else{
        await animationSteps.onMouseOver(prevElementType, animationSpeedReference.current);
      }

    }

    if(index >= 1 || hasInitialConnection && index === 0){
      await animationSteps.showPopoverForCreateElement(type, animationSpeedReference.current);

      const prevElement = refs.animationData.afterElementType ? refs.animationData.afterElementType : prevElementType;

      await animationSteps.createProcessOrOperator(animationProps, refs.animationData, connectorType, prevElement, animationSpeedReference.current);
    }

    await animationSteps.changeElementNameOrType(type, name, animationSpeedReference.current);

    await animationSteps.changeProcessLabel(type, label, animationSpeedReference.current);

    await animationSteps.create(type);

    await animationSteps.setFocusOnCurrentElement();

    const currentSvgElementId = `${connectorType}__${connectorType}_${currentElementId}${type === "process" ? "__" + name : ''}`;

    AdditionalFunctions.setSvgViewBox({elementId: 'modal_technical_layout_svg', currentSvgElementId, connectorType});

    if(index >= 0 && name !=='if' && name !== 'loop'){
      await showDetailsForProcess();
    }
    if(name === 'if'){
      // @ts-ignore
      const condition = animationData[videoAnimationName][connectorType].items[index].conditionForIf;
      await showDetailsForOperatorIf(condition);
    }
    if(name === 'loop'){
      // @ts-ignore
      const condition = animationData[videoAnimationName][connectorType].items[index].conditionForLoop;
      await showDetailsForOperatorLoop(condition);
    }
    if(index === animationData[videoAnimationName].fromConnector.items.length - 1 && animationData[videoAnimationName].toConnector.items.length === 0 || index === animationData[videoAnimationName].toConnector.items.length - 1 && connectorType === 'toConnector'){
      const details = new DetailsForProcess(ref, setPopoverProps, refs.animationData);
      await details.showResult(animationSpeedReference.current, dispatch);
    }
    setIndex(index + 1)
  }

  useEffect(() => {
    if(gettingInvokers !== API_REQUEST_STATE.FINISH) {
      dispatch(getAllInvokers())
    }
  }, [])

  useEffect(() => {
    if(videoAnimationName) {
      const fromInvoker = animationData[videoAnimationName].fromConnector.invoker.name;
      const toInvoker = animationData[videoAnimationName].fromConnector.invoker.name;
      const hasInitialConnection = !!animationData[videoAnimationName].initialConnection;
      const cData = hasInitialConnection ? animationData[videoAnimationName].initialConnection : {
        connectionId: null,
        fromConnector: {invoker: {name: fromInvoker}},
        toConnector: {invoker: {name: toInvoker}}
      };
      let connection = CConnection.createConnection(cData);
      const newConnection = prepareConnection(connection, connectors, invokers);
      setAnimationProps({
        connection: newConnection,
      })
    }
    setIndex(0);
    if(isPausedReference.current){
      dispatch(setAnimationPaused(false))
    }
  }, [videoAnimationName])

  useEffect(() => {
    (async () => {
      if(animationData[videoAnimationName] && ref.current){
        if(isButtonPanelOpened && videoAnimationName) {
          if(index < animationData[videoAnimationName].fromConnector.items.length + animationData[videoAnimationName].toConnector.items.length) {
            if(index < animationData[videoAnimationName].fromConnector.items.length && connectorType === 'fromConnector'){
              await animationFunction('fromConnector');
            }
            else if(index === animationData[videoAnimationName].fromConnector.items.length && connectorType === 'fromConnector'){
              setConnectorType('toConnector');
              setIndex(0)
            }
            else if(index > 0 && index < animationData[videoAnimationName].toConnector.items.length && connectorType === 'toConnector'){
              await animationFunction('toConnector');
            }
            else if(index === animationData[videoAnimationName].toConnector.items.length && connectorType === 'toConnector'){
              setConnectorType('fromConnector')
              dispatch(setVideoAnimationName(''));
              setIndex(0)
              setAnimationProps({...animationProps});
            }
          }
        }
      }
    })()
  }, [videoAnimationName, index])

  useEffect(() => {
    if(isVisible){
      dispatch(setVideoAnimationName(''));
      setAnimationProps({...animationProps});
      dispatch(setAnimationPreviewPanelVisibility(true))
    }
    else{
      let outlineElement = document.getElementById('wrapActiveElement');
      if(outlineElement){
        outlineElement.remove();
      }
      outlineElement = document.getElementById('wrapActiveElementId');
      if(outlineElement){
        outlineElement.remove();
      }
    }
  }, [isVisible])

  useEffect(() => {
    (async () => {
      if(connectorType === 'toConnector'){
        await animationFunction('toConnector');
      }
    })();
  }, [connectorType])

  function toggleVisibleHelpDialog() {
    setIsVisible(!isVisible);
  }

  const updateEntity = (updatedEntity: any) => {
    setAnimationProps({...animationProps, connection: updatedEntity});
  }

  const [isShorcutsDialogOpened, setIsShorcutsDialogOpened] = useState(false);

  return (
    <HelpBlockStyled isButtonPanelOpened={isButtonPanelOpened}>
      <div style={{ display: "flex", gap: "15px" }}>
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
          handleClick={() => toggleVisibleHelpDialog()}
        />
        <AnimationPopover {...popoverProps}/>
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
          {ReactDOM.createPortal(
            <div className={styles.animation_controls}>
              <TooltipButton
                size={TextSize.Size_40}
                position={"bottom"}
                icon={isPausedReference.current ? "play_arrow" : "pause"}
                tooltip={isPausedReference.current ? "Play Animation" : 'Pause Animation'}
                target={`animation_play_button`}
                hasBackground={true}
                background={ColorTheme.White}
                color={ColorTheme.Blue}
                padding="2px"
                handleClick={() => dispatch(setAnimationPaused(!isPausedReference.current))}
              />
              <AnimationSpeed/>
            </div>,
            document.body
          )}
          {gettingInvokers === API_REQUEST_STATE.START && <Loading className="animationDataLoading"/>}
          {gettingInvokers === API_REQUEST_STATE.FINISH &&
            <React.Fragment>
              <ModalContext.Provider value={{ isModal: true }}>
                <FormConnectionSvg
                  ref={ref}
                  data={{ readOnly: false }}
                  entity={animationProps.connection}
                  updateEntity={updateEntity}
                />
              </ModalContext.Provider>
              <Content />
            </React.Fragment>
          }
        </Dialog>
        <Dialog
          actions={[
            {id: 'animationNotFound', label: 'Ok', onClick: () => dispatch(setIsAnamationNotFoud(false))}
          ]}
          active={isAnimationNotFound}
          toggle={null}
          title={""}
        >
          <React.Fragment>
            This help animation is currently in development. Thank you for your understanding.
          </React.Fragment>
        </Dialog>
        <SyncInvokers
          connection={animationProps.connection}
          updateConnection={updateEntity}
          connectors={connectors}
          tooltipButtonProps={{
            position: "bottom",
            icon: "description",
            tooltip: 'Sync invokers',
            target: 'sync_invokers',
            hasBackground: true,
            padding: "2px"
          }}
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
          handleClick={() => setIsShorcutsDialogOpened(!isShorcutsDialogOpened)}
        />
        <Dialog
          actions={[
            {id: 'shortcutsDialog', label: 'Ok', onClick: () => setIsShorcutsDialogOpened(!isShorcutsDialogOpened)}
          ]}
          active={isShorcutsDialogOpened}
          toggle={() => setIsShorcutsDialogOpened(!isShorcutsDialogOpened)}
          title={"Shortcuts"}
          dialogClassname={styles.shortcutsDialog}
        >
          <React.Fragment>
            <Shortcuts/>
          </React.Fragment>
        </Dialog>
      </div>
    </HelpBlockStyled>
  );
};

HelpBlock.defaultProps = {};

export { HelpBlock };

export default withTheme(HelpBlock);
