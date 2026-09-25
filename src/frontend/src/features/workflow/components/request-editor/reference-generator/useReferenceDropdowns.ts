import { useCallback, useEffect, useRef, useState, type Dispatch,
	type SetStateAction } from 'react';
import type { DropdownPosition } from './ReferenceGenerator.types';

type Params = { fieldOpen: boolean; connectorOpen: boolean;
	setConnectorOpen: Dispatch<SetStateAction<boolean>> };

export function useReferenceDropdowns({ fieldOpen, connectorOpen, setConnectorOpen }: Params) {
	const fieldContainerRef = useRef<HTMLDivElement | null>(null);
	const fieldDropdownRef = useRef<HTMLDivElement | null>(null);
	const fieldInputRef = useRef<HTMLInputElement | null>(null);
	const connectorSelectRef = useRef<HTMLDivElement | null>(null);
	const connectorDropdownRef = useRef<HTMLDivElement | null>(null);
	const [fieldPosition, setFieldPosition] = useState<DropdownPosition | null>(null);
	const [connectorPosition, setConnectorPosition] = useState<DropdownPosition | null>(null);
	const updateFieldPosition = useCallback(() => {
		const rect = fieldInputRef.current?.getBoundingClientRect();
		if (rect) setFieldPosition({ top: rect.bottom + window.scrollY,
			left: rect.left + window.scrollX, width: rect.width });
	}, []);
	const updateConnectorPosition = useCallback(() => {
		const rect = connectorSelectRef.current?.getBoundingClientRect();
		if (rect) setConnectorPosition({ top: rect.bottom + window.scrollY,
			left: rect.left + window.scrollX, width: rect.width });
	}, []);
	useEffect(() => {
		if (!fieldOpen) return void setFieldPosition(null);
		updateFieldPosition();
		window.addEventListener('scroll', updateFieldPosition, true);
		window.addEventListener('resize', updateFieldPosition);
		return () => { window.removeEventListener('scroll', updateFieldPosition, true);
			window.removeEventListener('resize', updateFieldPosition); };
	}, [fieldOpen, updateFieldPosition]);
	useEffect(() => {
		if (!connectorOpen) return void setConnectorPosition(null);
		updateConnectorPosition();
		window.addEventListener('scroll', updateConnectorPosition, true);
		window.addEventListener('resize', updateConnectorPosition);
		return () => { window.removeEventListener('scroll', updateConnectorPosition, true);
			window.removeEventListener('resize', updateConnectorPosition); };
	}, [connectorOpen, updateConnectorPosition]);
	useEffect(() => {
		if (!connectorOpen) return;
		const closeOutside = (event: MouseEvent) => {
			const target = event.target as Node;
			if (!connectorSelectRef.current?.contains(target)
				&& !connectorDropdownRef.current?.contains(target)) setConnectorOpen(false);
		};
		document.addEventListener('mousedown', closeOutside);
		return () => document.removeEventListener('mousedown', closeOutside);
	}, [connectorOpen, setConnectorOpen]);
	return { fieldContainerRef, fieldDropdownRef, fieldInputRef, connectorSelectRef,
		connectorDropdownRef, fieldPosition, connectorPosition, setFieldPosition,
		setConnectorPosition, updateFieldPosition };
}
