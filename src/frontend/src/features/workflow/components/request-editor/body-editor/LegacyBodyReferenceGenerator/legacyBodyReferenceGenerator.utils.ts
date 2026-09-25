import type { Connection, MethodWithId } from '../../../../types/connection';
import { getEligibleReferenceMethods } from '../../../../utils/referenceMethodVisibility';

export const getReferenceMethods = (connection: Connection, currentMethod: MethodWithId) =>
	getEligibleReferenceMethods(connection, currentMethod);
