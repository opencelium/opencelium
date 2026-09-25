import type { Enhancement } from '../../../../types/connection';

export type EnhancementScriptProps = {
	enhancement: Enhancement;
	onChangeScript: (newScript: string) => void;
	readOnly?: boolean;
};
