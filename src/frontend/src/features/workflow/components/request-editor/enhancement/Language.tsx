import React from 'react';
import { Select } from '@shared/ui/primitives/Select';
import {Language} from "../../../types/connection";


const languageOptions = [
    {label: 'JavaScript', value: Language.JavaScript},
    {label: 'Python3', value: Language.Python3},
    {label: 'Ruby', value: Language.Ruby},
];
interface ScriptLanguageProps {
    language: Language,
    onChangeLanguage: (newLanguage: Language) => void,
    readOnly?: boolean,
}
const ScriptLanguage = ({language, onChangeLanguage, readOnly}: ScriptLanguageProps) => {
    return (
        <Select<Language>
            value={language}
            onChange={(value) => onChangeLanguage(value)}
            readOnly={readOnly}
            sortOptions={false}
            options={languageOptions}
        />
    )
}

export default ScriptLanguage;
