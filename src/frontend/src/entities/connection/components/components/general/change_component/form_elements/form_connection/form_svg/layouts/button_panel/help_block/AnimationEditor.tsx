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

import React, {useState, useEffect, FC} from "react";
import { withTheme } from "styled-components";
import {ConnectorPanelType, IfOperatorFunctions, LoopOperatorFunctions, MethodFunctions} from "./interfaces";
import { useAppDispatch } from "@application/utils/store";
// @ts-ignore
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import FormConnectionSvg from "@entity/connection/components/components/general/change_component/form_elements/form_connection/form_svg/FormConnectionSvg";
import { ModalContext } from "@entity/connection/components/components/general/change_component/FormSection";
import animationData from "./AnimationData";
import CConnection from "@classes/content/connection/CConnection";
import {
    setAnimationPaused,
    setIsEditableAnimation,
    setModalCurrentTechnicalItem,
    toggleModalDetails
} from "@root/redux_toolkit/slices/ModalConnectionSlice";
import {CONNECTOR_FROM, CONNECTOR_TO} from "@classes/content/connection/CConnectorItem";
import { Connector } from "@entity/connector/classes/Connector";
import {ModalConnection} from "@root/classes/ModalConnection";
import { Connection } from "@entity/connection/classes/Connection";
import { setVideoAnimationName, setAnimationPreviewPanelVisibility, setIsAnimationNotFound } from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import DetailsForOperators from "./classes/DetailsForOperators";
import DetailsForProcess from "./classes/DetailsForProcess";
import AdditionalFunctions from "./classes/AdditionalFunctions";
import AnimationFunctionSteps from "./classes/AnimationFunctionSteps";
import { Invoker } from "@entity/invoker/classes/Invoker";
import RefFunctions from "./classes/RefFunctions";
import Loading from "@app_component/base/loading/Loading";


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

const callAsync = async (func: any, forcedToStop: boolean) => {
    if(!forcedToStop){
        await func();
    } else{
        throw("Func was forced to stop " + func.name);
    }
}

const AnimationEditor: FC<{setPopoverProps: any, isVisible: boolean, theme?: any}> = ({setPopoverProps, isVisible}) => {
    const dispatch = useAppDispatch();
    const { connectors } = Connector.getReduxState();
    const { invokers } = Invoker.getReduxState();
    const { isButtonPanelOpened, videoAnimationName, animationSpeed, isAnimationForcedToStop} = Connection.getReduxState();
    const { isAnimationPaused: isPaused, isDetailsOpened } = ModalConnection.getReduxState();
    const [ animationProps, updateAnimationProps ] = useState<any>({connection: CConnection.createConnection(), update: false})
    const [ index, updateIndex ] = useState(0);
    const [connectorType, updateConnectorType] = useState<ConnectorPanelType>("fromConnector");
    const [isMount, setIsMount] = useState<boolean>(true);
    const ref = React.useRef(null);
    const setAnimationProps = (data: any) => {
        if (!forcedToStopAnimationReference.current) {
            updateAnimationProps(data);
        }
    }
    const setIndex = (data: any) => {
        if (!forcedToStopAnimationReference.current) {
            updateIndex(data);
        }
    }
    const setConnectorType = (data: ConnectorPanelType) => {
        if (!forcedToStopAnimationReference.current) {
            updateConnectorType(data);
        }
    }

    const forcedToStopAnimationReference: any = React.useRef();
    forcedToStopAnimationReference.current = isAnimationForcedToStop;

    const videoAnimationNameReference: any = React.useRef();
    videoAnimationNameReference.current = videoAnimationName;

    const isPausedReference: any = React.useRef();
    isPausedReference.current = isPaused;

    const animationSpeedReference: any = React.useRef();
    animationSpeedReference.current = animationSpeed;

    useEffect(() => {
        if(isAnimationForcedToStop){
            setIsMount(false);
        } else{
            setIsMount(true);
        }
        return () => {
            //dispatch(forcedToStopAnimationReference)
        }
    }, [isAnimationForcedToStop])

    useEffect(() => {
        if(!isAnimationForcedToStop && isMount) {
            if (videoAnimationName) {
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
                    ...animationProps,
                    update:!animationProps.update,
                    connection: newConnection,
                })
            }
            setConnectorType('fromConnector')
            setIndex(0);
            dispatch(setIsEditableAnimation(false));
            dispatch(setAnimationPaused(false));
            if (isPausedReference.current) {
                dispatch(setAnimationPaused(false))
            }
        }
    }, [videoAnimationName, isAnimationForcedToStop, isMount])

    useEffect(() => {
        try {
            if (animationProps.connection?.fromConnector?.invoker?.operations && animationProps.connection?.fromConnector?.invoker?.operations.length > 0) {
                (async () => {
                    if (animationData[videoAnimationName] && ref.current) {
                        if (isButtonPanelOpened && videoAnimationName) {
                            if (index < animationData[videoAnimationName].fromConnector.items.length + animationData[videoAnimationName].toConnector.items.length) {
                                if (index < animationData[videoAnimationName].fromConnector.items.length && connectorType === 'fromConnector') {
                                    await callAsync(async () => await animationFunction('fromConnector'), forcedToStopAnimationReference.current);
                                } else if (index === animationData[videoAnimationName].fromConnector.items.length && connectorType === 'fromConnector') {
                                    setConnectorType('toConnector');
                                    setIndex(0);
                                } else if (index > 0 && index < animationData[videoAnimationName].toConnector.items.length && connectorType === 'toConnector') {
                                    await callAsync(async () => await animationFunction('toConnector'), forcedToStopAnimationReference.current);
                                } else if (index === animationData[videoAnimationName].toConnector.items.length && connectorType === 'toConnector') {
                                    setConnectorType('fromConnector')
                                    dispatch(setVideoAnimationName(''));
                                    dispatch(setAnimationPreviewPanelVisibility(true));
                                    setIndex(0)
                                    setAnimationProps({...animationProps});
                                }
                            }
                            if(index === animationData[videoAnimationName].fromConnector.items.length && animationData[videoAnimationName].toConnector.items.length === 0){
                                dispatch(setVideoAnimationName(''));
                                dispatch(setAnimationPreviewPanelVisibility(true));
                            }
                        }
                    }
                })()
            }
        }catch (e){
            console.log(e);
        }
    }, [videoAnimationName, index, animationProps.update])

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
        try {
            (async () => {
                if (connectorType === 'toConnector') {
                    await callAsync(async () => await animationFunction('toConnector'), forcedToStopAnimationReference.current);
                }
            })();
        } catch (e){
            console.log(e);
        }
    }, [connectorType])

    const showDetailsForOperatorIf = async (condition: any) => {
        try {
            const refs: any = {};
            refs.animationData = animationData[videoAnimationName][connectorType].items[index];
            const details = new DetailsForOperators(ref, setPopoverProps, condition, refs.animationData);
            await callAsync(async () => await AdditionalFunctions.delay(animationSpeedReference.current), forcedToStopAnimationReference.current)
            if (refs.animationData.delete) {
                await callAsync(async () => await details.deleteOperator(animationSpeedReference.current), forcedToStopAnimationReference.current);
            } else {
                if (condition) {
                    const conditionRef = RefFunctions.getCondition(ref);
                    const operatorFunctions: IfOperatorFunctions = {
                        LeftExpression: ["openConditionDialog", "changeLeftMethod", "setFocusOnLeftParam", "changeLeftParam"],
                        RelationalOperator: "changeRelationalOperator",
                        RightExpression: {
                            PropertyExpression: ["setFocusOnRightProperty", "changeRightProperty", "removeFocusFromRightProperty"],
                            RestExpression: ["changeRightMethod", "setFocusOnRightParam", "changeRightParam", "removeFocusFromRightParam"]
                        }
                    }
                    for (let i = 0; i < operatorFunctions.LeftExpression.length; i++) {
                        await callAsync(async () => await details[operatorFunctions.LeftExpression[i]](animationSpeedReference.current), forcedToStopAnimationReference.current);
                    }
                    await callAsync(async () => await details[operatorFunctions.RelationalOperator](animationSpeedReference.current), forcedToStopAnimationReference.current);
                    if (condition.rightStatement) {
                        if (condition.rightStatement.property) {
                            for (let i = 0; i < operatorFunctions.RightExpression.PropertyExpression.length; i++) {
                                await callAsync(async () => await details[operatorFunctions.RightExpression.PropertyExpression[i]](animationSpeedReference.current), forcedToStopAnimationReference.current);
                            }
                        }
                        for (let i = 0; i < operatorFunctions.RightExpression.RestExpression.length; i++) {
                            await callAsync(async () => await details[operatorFunctions.RightExpression.RestExpression[i]](animationSpeedReference.current), forcedToStopAnimationReference.current);
                        }
                    }
                    if (conditionRef) {
                        conditionRef.updateConnection();
                    }
                }
            }
        } catch(e) {
            console.log(e);
        }
    }

    const showDetailsForOperatorLoop = async (condition: any) => {
        try {
            const refs: any = {};
            refs.animationData = animationData[videoAnimationName][connectorType].items[index];
            const details = new DetailsForOperators(ref, setPopoverProps, condition, refs.animationData);
            await callAsync(async () => await AdditionalFunctions.delay(animationSpeedReference.current), forcedToStopAnimationReference.current);
            if (refs.animationData.delete) {
                await callAsync(async () => await details.deleteOperator(animationSpeedReference.current), forcedToStopAnimationReference.current);
            } else {
                if (condition) {
                    const conditionRef = RefFunctions.getCondition(ref);
                    const operatorFunctions: LoopOperatorFunctions = {
                        LeftExpression: ["openConditionDialog", "changeLeftMethod", "setFocusOnLeftParam", "changeLeftParam"],
                        RelationalOperator: "changeRelationalOperator",
                        RightExpression: ["changeRightMethod", "changeRightParam"],
                    };
                    for (let i = 0; i < operatorFunctions.LeftExpression.length; i++) {
                        await callAsync(async () => await details[operatorFunctions.LeftExpression[i]](animationSpeedReference.current), forcedToStopAnimationReference.current);
                    }
                    await callAsync(async () => await details[operatorFunctions.RelationalOperator](animationSpeedReference.current), forcedToStopAnimationReference.current);
                    if (condition.rightStatement) {
                        for (let i = 0; i < operatorFunctions.RightExpression.length; i++) {
                            await callAsync(async () => await details[operatorFunctions.RightExpression[i]](animationSpeedReference.current), forcedToStopAnimationReference.current);
                        }
                    }
                    if (conditionRef) {
                        conditionRef.updateConnection();
                    }
                }
            }
        } catch(e){
            console.log(e);
        }
    }

    const showDetailsForProcess = async () => {
        try {
            const refs: any = {};
            refs.animationData = animationData[videoAnimationName][connectorType].items[index];
            refs.endpointData = refs.animationData.endpoint;
            refs.currentElementId = refs.animationData.index;
            const details = new DetailsForProcess(ref, setPopoverProps, refs.animationData);
            await callAsync(async () => await AdditionalFunctions.delay(animationSpeedReference.current), forcedToStopAnimationReference.current);
            if (refs.animationData.delete) {
                await callAsync(async () => await details.deleteProcess(animationSpeedReference.current), forcedToStopAnimationReference.current);
            } else {
                const methodFunctions: MethodFunctions = {
                    Label: ["startEditLabel", "endEditLabel"],
                    Url: ["openUrlDialog", "changeUrlMethod", "changeUrlParam", "addUrlParam", "closeUrlDialog"],
                    Header: ["openHeaderDialog", "closeHeaderDialog"],
                    Body: {
                        KeyNotExist: [
                            "displayBodyAddKeysButton", "showPopoverForBodyAddKeysButton",
                            "clickAddKeysButton", "addBodyKeyName", "displaySubmitButtonToAddKey",
                            "clickSubmitButtonToAddKey",
                        ],
                        DeleteKey: [
                            "displayRemoveKeyButton", "showPopoverForBodyRemoveKeysButton", "clickRemoveKeyButton",
                        ],
                        AddValue: [
                            "displayEditKeyValueButton", "clickEditKeyValueButton",
                            "showPopoverForAddBodyKeyValue", "addBodyKeyValue",
                        ],
                        SetReference: [
                            "changeBodyMethod", "changeBodyParam", "addBodyMethodAndParam"
                        ]
                    }
                }
                if (refs.animationData.changeLabel) {
                    for (let i = 0; i < methodFunctions.Label.length; i++) {
                        await callAsync(async () => await details[methodFunctions.Label[i]](animationSpeedReference.current), forcedToStopAnimationReference.current);
                    }
                }
                if (refs.endpointData) {
                    for (let i = 0; i < methodFunctions.Url.length; i++) {
                        await callAsync(async () => await details[methodFunctions.Url[i]](animationSpeedReference.current, refs.animationData, methodFunctions.Url[i] === "addUrlParam" ? connectorType : refs.endpointData.connectorType), forcedToStopAnimationReference.current);
                    }
                }
                if (refs.animationData.header) {
                    for (let i = 0; i < methodFunctions.Header.length; i++) {
                        await callAsync(async () => await details[methodFunctions.Header[i]](animationSpeedReference.current), forcedToStopAnimationReference.current);
                    }
                }
                const bodyData = refs.animationData.body;
                if (bodyData) {
                    await callAsync(async () => await details.showPopoverForOpenBodyDialog(animationSpeedReference.current), forcedToStopAnimationReference.current);
                    await callAsync(async () => await details.openBodyDialog(animationSpeedReference.current), forcedToStopAnimationReference.current);
                    if (bodyData.length > 0) {
                        let availableBodyContent: any;
                        for (let i = 0; i < bodyData.length; i++) {
                            if (bodyData[i].available) {
                                availableBodyContent = true;
                                break;
                            }
                        }
                        if (!availableBodyContent) {
                            await callAsync(async () => await details.openBodyObject(animationSpeedReference.current), forcedToStopAnimationReference.current);
                        }
                        for (let bodyIndex = 0; bodyIndex < bodyData.length; bodyIndex++) {
                            if (!bodyData[bodyIndex].available) {
                                for (let i = 0; i < methodFunctions.Body.KeyNotExist.length; i++) {
                                    await callAsync(async () => await details[methodFunctions.Body.KeyNotExist[i]](animationSpeedReference.current, bodyData[bodyIndex].keyName), forcedToStopAnimationReference.current);
                                }
                            }
                            if (bodyData[bodyIndex].deleteKey) {
                                for (let i = 0; i < methodFunctions.Body.DeleteKey.length; i++) {
                                    await callAsync(async () => await details[methodFunctions.Body.DeleteKey[i]](animationSpeedReference.current, bodyIndex), forcedToStopAnimationReference.current);
                                }
                            }
                            for (let i = 0; i < methodFunctions.Body.AddValue.length; i++) {
                                await callAsync(async () => await details[methodFunctions.Body.AddValue[i]](animationSpeedReference.current, methodFunctions.Body.AddValue[i] === "addBodyKeyValue" ? bodyData[bodyIndex].keyValue : bodyIndex), forcedToStopAnimationReference.current);
                            }
                            if (bodyData[bodyIndex].keyValue === '#') {
                                for (let referenceIndex = 0; referenceIndex < bodyData[bodyIndex].reference.length; referenceIndex++) {
                                    for (let methodIndex = 0; methodIndex < bodyData[bodyIndex].reference[referenceIndex].method.length; methodIndex++) {
                                        try {
                                            if (ref.current.props) {
                                                const currentItemId = ref.current.props.currentTechnicalItem.id;
                                                if (currentItemId) {
                                                    if (methodIndex > 0) {
                                                        await callAsync(async () => await details.displayEditKeyValueButton(animationSpeedReference.current, bodyIndex), forcedToStopAnimationReference.current);
                                                        await callAsync(async () => await details.clickEditKeyValueButton(animationSpeedReference.current, bodyIndex), forcedToStopAnimationReference.current);
                                                    }
                                                    for (let i = 0; i < methodFunctions.Body.SetReference.length; i++) {
                                                        await callAsync(async () => await details[methodFunctions.Body.SetReference[i]](animationSpeedReference.current, bodyData, bodyIndex, referenceIndex, methodIndex, currentItemId), forcedToStopAnimationReference.current);
                                                    }
                                                }
                                            } else {
                                                throw new Error('props is not defined')
                                            }
                                        } catch (e) {
                                        }
                                    }
                                    if (connectorType === 'toConnector' && (bodyData[bodyIndex].reference[referenceIndex].enhancementDescription || bodyData[bodyIndex].reference[referenceIndex].enhancementContent)) {
                                        let bIndex: number;
                                        if (bodyData[bodyIndex - 1]) {
                                            bIndex = bodyData[bodyIndex - 1].deleteKey ? bodyIndex - 1 : bodyIndex;
                                        } else {
                                            bIndex = bodyIndex;
                                        }
                                        await callAsync(async () => await details.clickOnReferenceElements(animationSpeedReference.current, bIndex), forcedToStopAnimationReference.current);
                                        if (bodyData[bodyIndex].reference[referenceIndex].enhancementDescription) {
                                            await callAsync(async () => await details.changeReferenceDescription(animationSpeedReference.current, bodyData, bodyIndex, referenceIndex), forcedToStopAnimationReference.current);
                                        }
                                        if (bodyData[bodyIndex].reference[referenceIndex].enhancementContent) {
                                            await callAsync(async () => await details.changeReferenceContent(animationSpeedReference.current, bodyData, bodyIndex, referenceIndex), forcedToStopAnimationReference.current);
                                        }
                                    }
                                }
                            } else {
                                await callAsync(async () => await details.clickSubmitButtonToAddValue(animationSpeedReference.current, bodyIndex), forcedToStopAnimationReference.current);
                            }
                        }
                    }
                    await callAsync(async () => await details.closeBodyDialog(animationSpeedReference.current), forcedToStopAnimationReference.current);
                }
                if (refs.animationData.response) {
                    await callAsync(async () => await details.showResponse(animationSpeedReference.current), forcedToStopAnimationReference.current);
                }
            }
        } catch(e) {
            console.log(e);
        }
    }

    const animationFunction = async (connectorPanelType: ConnectorPanelType) => {
        try {
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

            if (index <= 0 && !hasInitialConnection) {
                if (!isDetailsOpened) {
                    dispatch(setModalCurrentTechnicalItem(null));
                    dispatch(toggleModalDetails())
                }
                const technicalLayout = document.getElementById('modal_technical_layout_svg');
                technicalLayout.removeAttribute('style')
                await callAsync(async () => await AdditionalFunctions.delay(animationSpeedReference.current), forcedToStopAnimationReference.current)
                await callAsync(async () => await animationSteps.clickOnPanel(connectorPanel, connectorPanelType, animationSpeedReference.current), forcedToStopAnimationReference.current);
            } else {
                if (hasInitialConnection && index === 0) {
                    if (!isDetailsOpened) {
                        dispatch(setModalCurrentTechnicalItem(null));
                        dispatch(toggleModalDetails())
                    }
                    const technicalLayout = document.getElementById('modal_technical_layout_svg');
                    technicalLayout.removeAttribute('style')
                    const fromItems = animationData[videoAnimationName].fromConnector.items;
                    const toItems = animationData[videoAnimationName].toConnector.items;
                    const firstItem = fromItems.length > 0 ? fromItems[0] : toItems.length > 0 ? toItems[0] : null;
                    if (firstItem) {
                        const connector = animationProps.connection.getConnectorByType(fromItems.length ? 'fromConnector' : 'toConnector');
                        await callAsync(async () => await animationSteps.setCurrentItem(connector, firstItem.index, animationSpeedReference.current), forcedToStopAnimationReference.current);
                        await callAsync(async () => await animationSteps.setFocusOnCurrentElement(), forcedToStopAnimationReference.current);
                    }
                }

                if (refs.animationData.after) {
                    const fromItems = animationData[videoAnimationName].fromConnector.items;
                    const connector = animationProps.connection.getConnectorByType(fromItems.length ? 'fromConnector' : 'toConnector');
                    const currentItem = connector.getSvgElementByIndex(refs.animationData.after);
                    const technicalLayout = RefFunctions.getTechnicalLayout(ref);
                    technicalLayout.setCurrentItem(currentItem);
                    await callAsync(async () => await animationSteps.onMouseOver(refs.animationData.afterElementType, animationSpeedReference.current), forcedToStopAnimationReference.current);
                } else {
                    await callAsync(async () => await animationSteps.onMouseOver(prevElementType, animationSpeedReference.current), forcedToStopAnimationReference.current);
                }

            }

            if (index >= 1 || hasInitialConnection && index === 0) {
                await callAsync(async () => await animationSteps.showPopoverForCreateElement(type, animationSpeedReference.current), forcedToStopAnimationReference.current);

                const prevElement = refs.animationData.afterElementType ? refs.animationData.afterElementType : prevElementType;

                await callAsync(async () => await animationSteps.createProcessOrOperator(animationProps, refs.animationData, connectorType, prevElement, animationSpeedReference.current), forcedToStopAnimationReference.current);
            }

            await callAsync(async () => await animationSteps.changeElementNameOrType(type, name, animationSpeedReference.current), forcedToStopAnimationReference.current);

            await callAsync(async () => await animationSteps.changeProcessLabel(type, label, animationSpeedReference.current), forcedToStopAnimationReference.current);

            await callAsync(async () => await animationSteps.create(type), forcedToStopAnimationReference.current);

            await callAsync(async () => await animationSteps.setFocusOnCurrentElement(), forcedToStopAnimationReference.current);

            const currentSvgElementId = `${connectorType}__${connectorType}_${currentElementId}${type === "process" ? "__" + name : ''}`;

            AdditionalFunctions.setSvgViewBox({
                elementId: 'modal_technical_layout_svg',
                currentSvgElementId,
                connectorType
            });

            if (index >= 0 && name !== 'if' && name !== 'loop') {
                await callAsync(async () => await showDetailsForProcess(), forcedToStopAnimationReference.current);
            }
            if (name === 'if') {
                // @ts-ignore
                const condition = animationData[videoAnimationName][connectorType].items[index].conditionForIf;
                await callAsync(async () => await showDetailsForOperatorIf(condition), forcedToStopAnimationReference.current);
            }
            if (name === 'loop') {
                // @ts-ignore
                const condition = animationData[videoAnimationName][connectorType].items[index].conditionForLoop;
                await callAsync(async () => await showDetailsForOperatorLoop(condition), forcedToStopAnimationReference.current);
            }
            if (index === animationData[videoAnimationName].fromConnector.items.length - 1 && animationData[videoAnimationName].toConnector.items.length === 0 || index === animationData[videoAnimationName].toConnector.items.length - 1 && connectorType === 'toConnector') {
                const details = new DetailsForProcess(ref, setPopoverProps, refs.animationData);
                await callAsync(async () => await details.showResult(animationSpeedReference.current, dispatch), forcedToStopAnimationReference.current);
            }
            setIndex(index + 1)
        } catch (e){
            console.log(e);
        }
    }

    const updateEntity = (updatedEntity: any) => {
        setAnimationProps({...animationProps, connection: updatedEntity});
    }
    return (
        <ModalContext.Provider value={{ isModal: true }}>
            {isAnimationForcedToStop ? <div style={{marginTop: '10%'}}><Loading/></div> :
                <FormConnectionSvg
                    ref={ref}
                    data={{readOnly: false}}
                    entity={animationProps.connection}
                    updateEntity={updateEntity}
                />
            }
        </ModalContext.Provider>
    );
};

AnimationEditor.defaultProps = {};

export { AnimationEditor };

export default withTheme(AnimationEditor);
