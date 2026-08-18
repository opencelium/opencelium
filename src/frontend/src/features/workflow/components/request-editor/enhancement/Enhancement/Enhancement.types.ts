import type { Enhancement } from '../../../../types/connection';
import type { DirectReferenceInfo } from '../../body-editor/bodyBinding';

export type EnhancementProps = {
	enhancement?: Enhancement;
	readOnly?: boolean;
	directReference?: DirectReferenceInfo | null;
	onCreateEnhancement?: () => void;
	onDeleteEnhancement?: () => void;
};
