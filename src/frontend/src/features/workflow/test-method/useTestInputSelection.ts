import { useCallback, useMemo, useState } from 'react';
import type { MethodTestInputs } from './collectMethodReferences';
import type { TestInputSelection } from './TestMethodJsonView';
import { referenceInputKey, webhookInputKey } from './testMethodInputValue';

// Which input the left pane shows: the first one until the user clicks another in the request.
// A click on something that is not an input (e.g. a reference to this method's own request) is ignored.
export function useTestInputSelection(inputs: MethodTestInputs): TestInputSelection {
	const keys = useMemo(() => [
		...inputs.references.map(referenceInputKey),
		...inputs.webhooks.map(webhookInputKey),
	], [inputs]);
	const [selectedKey, setSelectedKey] = useState<string | null>(keys[0] ?? null);
	const onSelect = useCallback((key: string) => {
		if (keys.includes(key)) setSelectedKey(key);
	}, [keys]);
	return { selectedKey, onSelect };
}
