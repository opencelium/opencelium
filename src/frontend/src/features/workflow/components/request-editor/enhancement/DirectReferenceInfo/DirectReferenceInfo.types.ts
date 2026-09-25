import type { DirectReferenceInfo as DirectReferenceInfoData } from '../../body-editor/bodyBinding';

export type DirectReferenceInfoProps = {
	directReference: DirectReferenceInfoData;
	readOnly?: boolean;
	onCreate: () => void;
};
