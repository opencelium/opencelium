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
import {setAnimationPaused } from "@root/redux_toolkit/slices/ModalConnectionSlice";
import {CONNECTOR_FROM, CONNECTOR_TO} from "@classes/content/connection/CConnectorItem";
import { Connector } from "@entity/connector/classes/Connector";
import {ModalConnection} from "@root/classes/ModalConnection";
import { Connection } from "@entity/connection/classes/Connection";
import { setVideoAnimationName, setAnimationPreviewPanelVisibility } from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import AnimationSpeedSlider from "./AnimationSpeedSlider/AnimationSpeedSlider";

import DetailsForOperators from "./classes/DetailsForOperators";
import DetailsForProcess from "./classes/DetailsForProcess";
import AdditionalFunctions from "./classes/AdditionalFunctions";
import { AnimationPopoverProps } from "./AnimationPopover/interfaces";
import AnimationPopover from "./AnimationPopover/AnimationPopover";
import AnimationFunctionSteps from "./classes/AnimationFunctionSteps";


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
  const [ animationProps, setAnimationProps ] = useState<any>({connection: CConnection.createConnection()})
  const { connectors } = Connector.getReduxState();
  const [ isVisible, setIsVisible ] = useState(false);
  const { isButtonPanelOpened, videoAnimationName, animationSpeed, connection: connectionData } = Connection.getReduxState();
  const { isAnimationPaused } = ModalConnection.getReduxState();
  const [ index, setIndex ] = useState(0);
  const [ stopTimer, setStopTimer ] = useState(false);

  const [connectorType, setConnectorType] = useState<ConnectorPanelType>("fromConnector");

  const [popoverProps, setPopoverProps] = useState<AnimationPopoverProps>(null);

  const ref = React.useRef(null);

  const reference: any = React.useRef();
  reference.current = animationSpeed;

  const showDetailsForOperatorIf = async (condition: any) => {
    const refs: any = {};
    refs.animationData = animationData[videoAnimationName][connectorType][index];
    const details = new DetailsForOperators(ref, setPopoverProps, condition, refs.animationData);
    
    if(condition){
      const conditionRef = ref.current.detailsRef.current.descriptionRef.current.conditionRef.current;

      // add delay for first step
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
  
  const showDetailsForOperatorLoop = async (condition: any) => {
    const refs: any = {};
    
    refs.animationData = animationData[videoAnimationName][connectorType][index];
    const details = new DetailsForOperators(ref, setPopoverProps, condition, refs.animationData);
    if(condition){
      const conditionRef = ref.current.detailsRef.current.descriptionRef.current.conditionRef.current;

      // add delay for first step
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

  const showDetailsForProcess = async () => {
    const refs: any = {};
    
    refs.animationData = animationData[videoAnimationName][connectorType][index];
    refs.endpointData = refs.animationData.endpoint;
    refs.currentElementId = refs.animationData.index;
    const details = new DetailsForProcess(ref, setPopoverProps, refs.animationData);
    
    if(refs.animationData.label){
      // add delay for first step
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
  
    if(refs.animationData.delete){
      await details.deleteLastProcess(reference.current);
    }
  }

  const animationFunction = async (connectorPanelType: ConnectorPanelType) => {

    const refs: any = {};
    refs.animationData = animationData[videoAnimationName][connectorPanelType][index];

    const animationSteps = new AnimationFunctionSteps(ref, refs.animationData, setPopoverProps);

    const currentElementId = animationData[videoAnimationName][connectorPanelType][index].index;
    const type = animationData[videoAnimationName][connectorPanelType][index].type;
    const name = animationData[videoAnimationName][connectorPanelType][index].name;
    const label = animationData[videoAnimationName][connectorPanelType][index].label;
    const prevElementType = animationData[videoAnimationName][connectorPanelType][index > 0 ? index - 1 : index].type;
    const svgRef = ref.current.technicalLayoutRef.current.svgRef.current;

    const connectorPanel = connectorPanelType === 'fromConnector' ? svgRef.fromConnectorPanelRef.current : svgRef.toConnectorPanelRef.current;
    
    if(index <= 0){
      // add delay for first step
      await animationSteps.clickOnPanel(connectorPanel, reference.current);
    }
    else{      
     await animationSteps.onMouseOver(prevElementType, reference.current);

    }
  
    if(index >= 1){
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
      const condition = animationData[videoAnimationName][connectorType][index].conditionForIf;
      await showDetailsForOperatorIf(condition);
    }
    if(name === 'loop'){
      // @ts-ignore
      const condition = animationData[videoAnimationName][connectorType][index].conditionForLoop;
      await showDetailsForOperatorLoop(condition);
    }
    if(index === animationData[videoAnimationName].fromConnector.length - 1 && animationData[videoAnimationName].toConnector.length === 0 || index === animationData[videoAnimationName].toConnector.length - 1 && connectorType === 'toConnector'){
      const details = new DetailsForProcess(ref, setPopoverProps, refs.animationData);
      await details.showResult(dispatch, reference.current);
    }
    setIndex(index + 1)
  }

  useEffect(() => {
    if(ref.current){
      if(videoAnimationName && index <= 0 && connectorType === 'fromConnector'){
        
        // @ts-ignore
        const cData = {nodeId:null,connectionId:null,title:"",description:"",fromConnector:{nodeId:null,connectorId:connectionData.fromConnector.connectorId,title:null,invoker:{name:connectionData.fromConnector.invoker.name},methods:[],operators:[]},toConnector:{nodeId:null,connectorId:connectionData.toConnector.connectorId,title:null,invoker:{name:connectionData.toConnector.invoker.name},methods:[],operators:[]},fieldBinding:[]};
        let connection = CConnection.createConnection(cData);
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
            setConnectorType('toConnector');
            setIndex(0)
          }
          else if(index > 0 && index < animationData[videoAnimationName].toConnector.length && connectorType === 'toConnector'){
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
    if(isAnimationPaused){
      dispatch(setAnimationPaused(!isAnimationPaused))
    }
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
