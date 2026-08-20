import { Select } from '@shared/ui/primitives/Select';
import { Language } from '../../../../types/connection';
import type { ScriptLanguageProps } from './ScriptLanguage.types';

const languageOptions = [
    { label: 'JavaScript', value: Language.JavaScript },
    { label: 'Python3', value: Language.Python3 },
    { label: 'Ruby', value: Language.Ruby },
];

const ScriptLanguage = ({ language, onChangeLanguage, readOnly }: ScriptLanguageProps) => {
    return (
        <Select<Language>
            value={language}
            onChange={(value) => onChangeLanguage(value)}
            readOnly={readOnly}
            sortOptions={false}
            options={languageOptions}
        />
    );
};

export default ScriptLanguage;
