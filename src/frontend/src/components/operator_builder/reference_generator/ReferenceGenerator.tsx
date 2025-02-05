import React, {useEffect, useState} from 'react';
import DeepSelect from "./DeepSelect";
import MethodSelect from "./MethodSelect";
import {ReferenceGeneratorContainer} from "./styles";
import {ReferenceGeneratorProps, ReferenceType} from './props';
import DirectReference from "../classes/references/DirectReference";
import Webhook from "@root/classes/Webhook";
import WebhookGenerator from "@change_component/form_elements/form_connection/form_methods/method/WebhookGenerator";
import ReferenceSwitcher from "@app_component/operator_builder/reference_generator/ReferenceSwitcher";
import ReferenceFactory from "@app_component/operator_builder/classes/references/ReferenceFactory";
import WebhookReference from "@app_component/operator_builder/classes/references/WebhookReference";

const ReferenceGenerator = ({reference, setValue, builderProps}: ReferenceGeneratorProps) => {
    const [color, setColor] = useState<string>('');
    const [currentField, setCurrentField] = useState<string>('');
    const [referenceType, updateReferenceType] = useState<ReferenceType>('direct');
    const changeReferenceType = (newReferenceType: ReferenceType) => {
        updateReferenceType(newReferenceType);
        setColor('');
        setCurrentField('');
    }
    const onColorSelect = (newColor: string) => {
        setColor(newColor);
        setCurrentField('');
    }
    const onFieldSelect = (newField: string) => {
        setCurrentField(newField);
    }
    useEffect(() => {
        applyReference();
    }, [currentField])
    const applyReference = () => {
        let newReference = '';
        if (currentField !== '') {
            newReference = ReferenceFactory.getReference(referenceType, currentField, color, 'response');
            if (newReference !== reference) {
                setValue(newReference);
            }
        }
    }
    useEffect(() => {
        if (reference) {
            const referenceInstance = ReferenceFactory.createReferenceInstance(reference);
            const referenceData = referenceInstance.extractData();
            if (referenceInstance instanceof DirectReference) {
                setColor(prevState => referenceData.color);
                setCurrentField(prevState => referenceData.field);
                if (referenceType !== 'direct') {
                    changeReferenceType('direct');
                }
            }
            if (referenceInstance instanceof WebhookReference) {
                setColor('');
                setCurrentField(referenceInstance.reference)
                if (referenceType !== 'webhook') {
                    changeReferenceType('webhook');
                }
            }
        }
    }, [reference]);
    return (
        <ReferenceGeneratorContainer referenceType={referenceType}>
            <ReferenceSwitcher referenceType={referenceType} changeReferenceType={changeReferenceType}/>
            {referenceType === 'direct' &&
                <React.Fragment>
                    <MethodSelect builderProps={builderProps} methodColor={color} onMethodSelect={onColorSelect}/>
                    <DeepSelect color={color} builderProps={builderProps} field={currentField} onValueSelect={onFieldSelect}/>
                </React.Fragment>
            }
            {referenceType === 'webhook' && <WebhookGenerator value={Webhook.extractFromSnippet(currentField)} style={{float: 'left'}} onSelect={(webhookValue) => {
                onFieldSelect(Webhook.embraceWithSnippet(webhookValue))
            }}/>}
        </ReferenceGeneratorContainer>
    )
}

export default ReferenceGenerator;
