import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createMethodLabelByColor, ReferenceSourceContext } from '../../reference-chip/ReferenceSourceContext';
import { MethodProvider } from '../../../providers/MethodContext';
import type { RootState } from '../../../store';
import LegacyUrlEditor from '../url-editor/UrlEditor/UrlEditor';
import { BodyEditor } from '../body-editor/BodyEditor/BodyEditor';
import { HeaderEditor } from '../header-editor/HeaderEditor';
import type { MethodConfigMode } from './MethodConfigDialog.types';

function useLegacyMethod(nodeId: string) {
	return useSelector((state: RootState) =>
		state.connection.connection?.fromConnector.method
			.find((item) => item.id === nodeId) ?? null,
	);
}

function LegacyUrlEditorContent({ nodeId }: { nodeId: string }) {
	const method = useLegacyMethod(nodeId);
	if (!method) return null;
	return <MethodProvider value={{ method }}><LegacyUrlEditor /></MethodProvider>;
}

function LegacyBodyEditorContent({ nodeId }: { nodeId: string }) {
	const method = useLegacyMethod(nodeId);
	if (!method) return null;
	return <MethodProvider value={{ method }}><BodyEditor /></MethodProvider>;
}

function LegacyHeaderEditorContent({ nodeId }: { nodeId: string }) {
	const method = useLegacyMethod(nodeId);
	if (!method) return null;
	return <MethodProvider value={{ method }}><HeaderEditor /></MethodProvider>;
}

function MethodConfigDialogEditorContent({ mode, nodeId }: { mode: MethodConfigMode; nodeId: string }) {
	if (mode === 'body') return <LegacyBodyEditorContent nodeId={nodeId} />;
	if (mode === 'header') return <LegacyHeaderEditorContent nodeId={nodeId} />;
	return <LegacyUrlEditorContent nodeId={nodeId} />;
}

const EMPTY_METHODS: never[] = [];

export function MethodConfigDialogEditor({ mode, nodeId }: { mode: MethodConfigMode; nodeId: string }) {
	const methods = useSelector((state: RootState) => state.connection.connection?.fromConnector.method ?? EMPTY_METHODS);
	const methodLabel = useMemo(() => createMethodLabelByColor(methods), [methods]);
	return (
		<ReferenceSourceContext.Provider value={methodLabel}>
			<MethodConfigDialogEditorContent mode={mode} nodeId={nodeId} />
		</ReferenceSourceContext.Provider>
	);
}
