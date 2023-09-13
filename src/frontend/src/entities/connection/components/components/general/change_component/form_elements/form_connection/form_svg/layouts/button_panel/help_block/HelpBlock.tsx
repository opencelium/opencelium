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
import { setVideoAnimationName, setAnimationPreviewPanelVisibility, setIsAnamationNotFoud } from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import AnimationSpeedSlider from "./AnimationSpeedSlider/AnimationSpeedSlider";

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
import SyncInvokers from "../../../../form_methods/SyncInvokers";


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
  const { isAnimationPaused, isDetailsOpened } = ModalConnection.getReduxState();
  const [ index, setIndex ] = useState(0);

  const [connectorType, setConnectorType] = useState<ConnectorPanelType>("fromConnector");

  const [popoverProps, setPopoverProps] = useState<AnimationPopoverProps>(null);

  const ref = React.useRef(null);

  const reference: any = React.useRef();
  reference.current = animationSpeed;

  const showDetailsForOperatorIf = async (condition: any) => {
    const refs: any = {};
    refs.animationData = animationData[videoAnimationName][connectorType].items[index];
    const details = new DetailsForOperators(ref, setPopoverProps, condition, refs.animationData);
    if(refs.animationData.delete){
      await AdditionalFunctions.delay(reference.current)
      await details.deleteOperator(reference.current);
    }
    else{
      if(condition){
        const conditionRef = ref.current.detailsRef.current.descriptionRef.current.conditionRef.current;
        await AdditionalFunctions.delay(reference.current)
        await details.openConditionDialog(reference.current);

        await details.changeLeftMethod(reference.current);

        await details.setFocusOnLeftParam(reference.current);

        await details.changeLeftParam(reference.current);

        await details.changeRelationalOperator(reference.current);

        if(condition.rightStatement.property){
          await details.setFocusOnRightProperty(reference.current);

          await details.changeRightProperty(reference.current);

          await details.removeFocusFromRightProperty(reference.current);
        }

        if(condition.rightStatement.rightMethodIndex){
          await details.changeRightMethod(reference.current);
        }

        if(condition.rightStatement.rightParam){
          await details.setFocusOnRightParam(reference.current);

          await details.changeRightParam(reference.current);

          await details.removeFocusFromRightParam(reference.current);
        }

        conditionRef.updateConnection();
      }
    }
  }

  const showDetailsForOperatorLoop = async (condition: any) => {
    const refs: any = {};

    refs.animationData = animationData[videoAnimationName][connectorType].items[index];
    const details = new DetailsForOperators(ref, setPopoverProps, condition, refs.animationData);
    if(refs.animationData.delete){
      await AdditionalFunctions.delay(reference.current)
      await details.deleteOperator(reference.current);
    }
    else{
      if(condition){
        const conditionRef = ref.current.detailsRef.current.descriptionRef.current.conditionRef.current;
        await AdditionalFunctions.delay(reference.current)
        await details.openConditionDialog(reference.current);

        await details.changeLeftMethod(reference.current);

        await details.setFocusOnLeftParam(reference.current);

        await details.changeLeftParam(reference.current);

        await details.changeRelationalOperator(reference.current);

        await details.changeRightMethod(reference.current);

        await details.changeRightParam(reference.current);

        conditionRef.updateConnection();
      }
    }
  }

  const showDetailsForProcess = async () => {
    const refs: any = {};

    refs.animationData = animationData[videoAnimationName][connectorType].items[index];
    refs.endpointData = refs.animationData.endpoint;
    refs.currentElementId = refs.animationData.index;
    const details = new DetailsForProcess(ref, setPopoverProps, refs.animationData);
    if(refs.animationData.delete){
      await AdditionalFunctions.delay(reference.current)
      await details.deleteProcess(reference.current);
    }
    else{
      if(refs.animationData.label){
        await AdditionalFunctions.delay(reference.current)
        await details.startEditLabel(reference.current);

        await details.endEditLabel(reference.current);
      }

      if(refs.endpointData){
        await details.openUrlDialog(reference.current);

        await details.changeUrlMethod(refs.animationData, refs.endpointData.connectorType, reference.current);

        await details.changeUrlParam(refs.animationData, reference.current);

        await details.addUrlParam(refs.animationData, connectorType, reference.current);

        await details.closeUrlDialog(reference.current);
      }

      if(connectorType === 'fromConnector' && index === 0){
        await details.openHeaderDialog(reference.current);

        await details.closeHeaderDialog(reference.current);
      }

      const bodyData = refs.animationData.body;

      if(bodyData){
        await details.showPopoverForOpenBodyDialog(reference.current);
        await details.openBodyDialog(reference.current);
        let availableBodyContent: any;

        for(var i = 0; i < bodyData.length; i++){
          if(bodyData[i].available){
            availableBodyContent = true;
            break;
          }
        }

        if(!availableBodyContent){
          await details.openBodyObject(reference.current);
        }


        for(let bodyIndex = 0; bodyIndex < bodyData.length; bodyIndex++){

          if(!bodyData[bodyIndex].available){
            await details.displayBodyAddKeysButton(reference.current);

            await details.clickAddKeysButton(reference.current);

            await details.addBodyKeyName(bodyData[bodyIndex].keyName, reference.current);

            await details.displaySubmitButtonToAddKey(reference.current);

            await details.clickSubmitButtonToAddKey(reference.current);
          }


          await details.displayEditKeyValueButton(bodyIndex, reference.current);

          await details.clickEditKeyValueButton(bodyIndex, reference.current);

          await details.addBodyKeyValue(bodyData[bodyIndex].keyValue, reference.current);

          if(bodyData[bodyIndex].keyValue === '#'){
            for(let referenceIndex = 0; referenceIndex < bodyData[bodyIndex].reference.length; referenceIndex++) {
              for(let methodIndex = 0; methodIndex < bodyData[bodyIndex].reference[referenceIndex].method.length; methodIndex++){
                if(methodIndex > 0){
                  await details.displayEditKeyValueButton(bodyIndex, reference.current);

                  await details.clickEditKeyValueButton(bodyIndex, reference.current);
                }

                const currentItemId = ref.current.props.currentTechnicalItem.id;
                await details.changeBodyMethod(bodyData, bodyIndex, referenceIndex, methodIndex, currentItemId, reference.current);

                await details.changeBodyParam(bodyData, bodyIndex, referenceIndex, methodIndex, reference.current);

                await details.addBodyMethodAndParam(currentItemId, reference.current);
              }

              if(connectorType === 'toConnector' && bodyData[bodyIndex].reference[referenceIndex].enhancementDescription){
                await details.clickOnReferenceElements(bodyIndex, reference.current);

                await details.changeReferenceDescription(bodyData, bodyIndex, referenceIndex, reference.current);

                await details.changeReferenceContent(bodyData, bodyIndex, referenceIndex, reference.current);
              }
            }
          }
          else{
            await details.clickSubmitButtonToAddValue(bodyIndex, reference.current);
          }
        }
        await details.closeBodyDialog(reference.current);
      }

      if(connectorType === 'fromConnector' && index === 0){
        await details.showResponse(reference.current);
      }
    }

  }

  const animationFunction = async (connectorPanelType: ConnectorPanelType) => {

    const refs: any = {};
    const initialConnection = animationData[videoAnimationName].initialConnection;
    const hasInitialConnection = (!!initialConnection && connectorPanelType === 'fromConnector');
    refs.animationData = animationData[videoAnimationName][connectorPanelType].items[index];

    const animationSteps = new AnimationFunctionSteps(ref, refs.animationData, setPopoverProps);

    const currentElementId = animationData[videoAnimationName][connectorPanelType].items[index].index;
    const type = animationData[videoAnimationName][connectorPanelType].items[index].type;
    const name = animationData[videoAnimationName][connectorPanelType].items[index].name;
    const label = animationData[videoAnimationName][connectorPanelType].items[index].label;
    const prevElementType = animationData[videoAnimationName][connectorPanelType].items[index > 0 ? index - 1 : index].type;
    const svgRef = ref.current.technicalLayoutRef.current.svgRef.current;

    const connectorPanel = connectorPanelType === 'fromConnector' ? svgRef.fromConnectorPanelRef.current : svgRef.toConnectorPanelRef.current;

    if(index <= 0 && !hasInitialConnection){
      if(!isDetailsOpened){
        dispatch(toggleModalDetails())
      }
      const technicalLayout = document.getElementById('modal_technical_layout_svg');
      technicalLayout.removeAttribute('style')
      await AdditionalFunctions.delay(reference.current)

      await animationSteps.clickOnPanel(connectorPanel, reference.current);
    }
    else{
      if(hasInitialConnection && index === 0){
        const fromItems = animationData[videoAnimationName].fromConnector.items;
        const toItems = animationData[videoAnimationName].toConnector.items;
        const firstItem = fromItems.length > 0 ? fromItems[0] : toItems.length > 0 ? toItems[0] : null;
        if(firstItem) {
          const connector = animationProps.connection.getConnectorByType(fromItems.length ? 'fromConnector' : 'toConnector');
          await animationSteps.setCurrentItem(connector, firstItem.index, reference.current);
          animationSteps.setFocusOnCurrentElement();
        }
      }

      await animationSteps.onMouseOver(prevElementType, reference.current);
    }

    if(index >= 1 || hasInitialConnection && index === 0){
      await animationSteps.showPopoverForCreateElement(type, reference.current);

      await animationSteps.createProcessOrOperator(type, animationProps, refs.animationData, connectorType, prevElementType, reference.current);
    }

    await animationSteps.changeElementNameOrType(type, name, reference.current);

    await animationSteps.changeProcessLabel(type, label, reference.current);

    animationSteps.create(type);

    animationSteps.setFocusOnCurrentElement();

    const currentSvgElementId = `${connectorType}__${connectorType}_${currentElementId}${type === "process" ? "__" + name : ''}`

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
      await details.showResult(dispatch, reference.current);
    }
    setIndex(index + 1)
  }

  useEffect(() => {
    if(gettingInvokers !== API_REQUEST_STATE.FINISH) {
      dispatch(getAllInvokers())
    }
  }, [])

  useEffect(() => {
    if(animationData[videoAnimationName] && ref.current) {
      if (videoAnimationName && index <= 0 && connectorType === 'fromConnector') {
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
    }
  }, [videoAnimationName, index])

  useEffect(() => {
    if(animationData[videoAnimationName] && ref.current){
      if(isButtonPanelOpened && videoAnimationName && !isAnimationPaused) {
        if(index < animationData[videoAnimationName].fromConnector.items.length + animationData[videoAnimationName].toConnector.items.length) {
          if(index < animationData[videoAnimationName].fromConnector.items.length && connectorType === 'fromConnector'){
            animationFunction('fromConnector');
          }
          else if(index === animationData[videoAnimationName].fromConnector.items.length && connectorType === 'fromConnector'){
            setConnectorType('toConnector');
            setIndex(0)
          }
          else if(index > 0 && index < animationData[videoAnimationName].toConnector.items.length && connectorType === 'toConnector'){
            animationFunction('toConnector');
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
  }, [videoAnimationName, isAnimationPaused, index])

  useEffect(() => {
    setIndex(0);
    if(isAnimationPaused){
      dispatch(setAnimationPaused(!isAnimationPaused))
    }
  }, [videoAnimationName])

  useEffect(() => {
    if(isVisible){
      dispatch(setVideoAnimationName(''));
      setAnimationProps({...animationProps});
      dispatch(setAnimationPreviewPanelVisibility(true))
    }
  }, [isVisible])

  useEffect(() => {
    if(connectorType === 'toConnector'){
      animationFunction('toConnector');
    }
  }, [connectorType])

  function toggleVisibleHelpDialog() {
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
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            zIndex: 100000,
            padding: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#FFF',
            boxShadow: '0px 0px 5px 0px rgba(0,0,0,0.75)',
          }}>
            <TooltipButton
              size={TextSize.Size_40}
              position={"bottom"}
              icon={isAnimationPaused ? "play_arrow" : "pause"}
              tooltip={isAnimationPaused ? "play animation" : 'pause animation'}
              target={`animation_play_button`}
              hasBackground={true}
              background={ColorTheme.White}
              color={ColorTheme.Blue}
              padding="2px"
              handleClick={() => dispatch(setAnimationPaused(!isAnimationPaused))}
            />
            <AnimationSpeedSlider step={1000} min={1000} max={6000}/>
          </div>
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
          handleClick={() => {console.log('shortcuts')}}
        />
      </div>
    </HelpBlockStyled>
  );
};

HelpBlock.defaultProps = {};

export { HelpBlock };

export default withTheme(HelpBlock);
