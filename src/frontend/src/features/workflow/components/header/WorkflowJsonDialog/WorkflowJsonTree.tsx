import React from 'react';
import ReactJson from 'react-json-view';
import { useTheme } from '@shared/theme/hooks/useTheme';

type Props = {
	value: Record<string, unknown>;
	readOnly: boolean;
	onChange: (value: Record<string, unknown>) => void;
};

type JsonEdit = { updated_src?: unknown };
const Json = ReactJson as unknown as React.ComponentType<Record<string, unknown>>;

export function WorkflowJsonTree({ value, readOnly, onChange }: Props) {
	const { themeMode } = useTheme();
	const handleChange = (edit: JsonEdit) => {
		if (edit.updated_src && typeof edit.updated_src === 'object' && !Array.isArray(edit.updated_src)) {
			onChange(edit.updated_src as Record<string, unknown>);
		}
	};

	return <div data-testid="workflow-json-tree" style={{ height: 'calc(100vh - 240px)', overflow: 'auto' }}>
		<Json name={false} src={value} collapsed={2} enableClipboard
			onEdit={readOnly ? false : handleChange} onAdd={readOnly ? false : handleChange}
			onDelete={readOnly ? false : handleChange}
			theme={themeMode === 'dark' ? 'twilight' : 'rjv-default'}
			style={{ minHeight: '100%', padding: 12, background: 'transparent', fontSize: 13 }} />
	</div>;
}
