import type { ScriptDebugStatus } from './useScriptDebugValue';
import type { ScriptDebugResult } from './scriptDebugValue.utils';

export type ScriptDebugValueProps = {
	isOpen: boolean;
	status: ScriptDebugStatus;
	snapshot: ScriptDebugResult | null;
};
