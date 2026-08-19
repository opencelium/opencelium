import { useEffect, useRef, useState } from 'react';
import type { ConnectorStatus } from './ConnectorStatusDot.types';

const PULSE_MS = 1000;

export function useConnectorStatusPulse(status: ConnectorStatus) {
	const previousStatusRef = useRef(status);
	const [isChanged, setIsChanged] = useState(false);

	useEffect(() => {
		if (previousStatusRef.current === status) return;
		previousStatusRef.current = status;
		setIsChanged(true);
		const timeout = setTimeout(() => setIsChanged(false), PULSE_MS);
		return () => clearTimeout(timeout);
	}, [status]);

	return isChanged;
}
