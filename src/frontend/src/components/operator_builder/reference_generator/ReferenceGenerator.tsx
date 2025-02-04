import React, {useEffect, useState} from 'react';
import DeepSelect from "./DeepSelect";
import MethodSelect from "./MethodSelect";
import {ReferenceGeneratorContainer} from "./styles";
import {ReferenceGeneratorProps} from './props';
import DirectReference from "../classes/references/DirectReference";

const ReferenceGenerator = ({reference, setValue, builderProps}: ReferenceGeneratorProps) => {
    const [color, setColor] = useState<string>('');
    const [currentField, setCurrentField] = useState<string>('');
    const [deepSelectOptions, setDeepSelectOptions] = useState<any>([]);
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
        let reference = '';
        if (currentField !== '') {
            reference = new DirectReference(color, 'response', currentField).reference;
        }
        if (currentField !== reference) {
            setValue(reference);
        }
    }
    useEffect(() => {
        if (reference) {
            const referenceData = (new DirectReference(reference)).extractData();
            if (referenceData) {
                setColor(referenceData.color);
                setCurrentField(referenceData.field);
            }
        }
    }, [reference]);
    useEffect(() => {
        if (color) {
            setDeepSelectOptions(Object.keys(builderProps.connection.getMethodByColor(color).response.success.body.fields || {}).map((key) => ({
                label: key,
                value: key,
            })));
        }
    }, [color]);
    return (
        <ReferenceGeneratorContainer>
            <MethodSelect builderProps={builderProps} methodColor={color} onMethodSelect={onColorSelect}/>
            <DeepSelect options={deepSelectOptions} hasColor={!!color} field={currentField} onValueSelect={onFieldSelect}/>
        </ReferenceGeneratorContainer>
    )
}

export default ReferenceGenerator;
