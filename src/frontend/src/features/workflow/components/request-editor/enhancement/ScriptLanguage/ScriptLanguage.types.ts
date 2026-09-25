import type { Language } from '../../../../types/connection';

export type ScriptLanguageProps = {
	language: Language;
	onChangeLanguage: (newLanguage: Language) => void;
	readOnly?: boolean;
};
