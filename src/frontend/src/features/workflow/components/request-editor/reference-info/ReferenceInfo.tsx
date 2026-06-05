import React from 'react';
import { useSelector } from 'react-redux';
import { parseEnhancementArg } from '../utils/parseEnhancementArg';
import type { MessageProperty } from '../shared/messageProperty';
import type { RootState } from '../../../store';
import type { Method } from '../../../types/connection';
import { useMethodContext } from '../../../providers/MethodContext';

interface ReferenceInfoProps {
	messageProperty: MessageProperty;
	data: any;
	onReferenceClick?: (enhanceId: string) => void;
}

export const ReferenceInfo: React.FC<ReferenceInfoProps> = ({
	messageProperty,
	data,
	onReferenceClick,
}) => {
	const connection = useSelector(
		(state: RootState) => state.connection.connection,
	);
	const { method: currentMethod } = useMethodContext();

	if (!connection || !currentMethod) {
		return null;
	}

	const paramKey: string = (data?.param?.key || '').trim();

	const fieldBindings = connection.fieldBindings || [];
	const methods = connection.fromConnector.method;

	const fieldReferences: Record<
		string,
		{
			target: string;
			method: Method | null;
			color: string;
			enhanceId: string;
			sourceMessageProperty: string;
		}[]
	> = {};

	fieldBindings.forEach((binding) => {
		const { enhancement } = binding;
		if (!enhancement) return;

		const { args, enhanceId } = enhancement;
		const resultVar = parseEnhancementArg(args['RESULT_VAR']);
		if (!resultVar) return;

		if (resultVar.messageProperty !== messageProperty) return;

		const resultColor = (resultVar.color || '').toLowerCase();
		const currentColor = (currentMethod.color || '').toLowerCase();
		if (!resultColor || resultColor !== currentColor) return;

		Object.entries(args)
			.filter(([key]) => key.startsWith('VAR_'))
			.forEach(([_, value]) => {
				if (typeof value !== 'string') return;

				const parsed = parseEnhancementArg(value);
				if (!parsed) return;

				const method =
					methods.find(
						(m) => m.color.toLowerCase() === parsed.color.toLowerCase(),
					) || null;

				const keyPath = (resultVar.path || '').trim();
				const arr = fieldReferences[keyPath] ?? [];
				arr.push({
					target: parsed.path,
					method,
					color: parsed.color,
					enhanceId,
					sourceMessageProperty: parsed.messageProperty,
				});
				fieldReferences[keyPath] = arr;
			});
	});

	const hasRefs = Object.keys(fieldReferences).length > 0;

	const formatLeftField = (field: string) => {
		const base = `${messageProperty}.$.`;
		const f = (field || '').trim();

		if (!f) {
			return paramKey ? `${base}${paramKey}` : base;
		}

		if (f.startsWith('.')) {
			return `${messageProperty}.$${f}`;
		}

		return `${base}${f}`;
	};

	const formatSourceField = (messagePropertyName: string, field: string) => {
		const f = (field || '').trim();
		return f ? `${messagePropertyName}.$.${f}` : `${messagePropertyName}.$`;
	};

	return (
		<div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14 }}>
			{Object.entries(fieldReferences).map(([field, refs]) => {
				if (!refs.length) return null;
				const enhanceId = refs[0].enhanceId;

				return (
					<div
						key={field || '__empty_field__'}
						onClick={() => {
							if (enhanceId && onReferenceClick) {
								onReferenceClick(enhanceId);
							}
						}}
						style={{
							marginBottom: 8,
							cursor: 'pointer',
							padding: '6px 4px',
							borderRadius: 6,
							transition: 'box-shadow 0.15s ease, background 0.15s ease',
						}}
						onMouseEnter={(e) => {
							const el = e.currentTarget as HTMLDivElement;
							el.style.boxShadow = 'var(--shadow-md)';
							el.style.background = 'var(--color-background-hover)';
						}}
						onMouseLeave={(e) => {
							const el = e.currentTarget as HTMLDivElement;
							el.style.boxShadow = 'none';
							el.style.background = 'transparent';
						}}
					>
						<div style={{ marginBottom: 4 }}>
							<span
								style={{
									color: 'var(--color-action-primary)',
									fontFamily: 'monospace',
									fontWeight: 600,
								}}
							>
								{formatLeftField(field)}
							</span>{' '}
							has {refs.length > 1 ? 'next references:' : 'one reference:'}
						</div>

						<div
							style={{
								margin: '4px 0 0 0',
								display: 'grid',
								gap: '8px',
							}}
						>
							{refs.map((r, i) => (
								<div
									key={i}
									style={{
										display: 'inline-flex',
										flexWrap: 'wrap',
										alignItems: 'center',
										gap: 4,
										padding: '4px 6px',
										borderRadius: 6,
										border: '1px solid var(--color-border-subtle)',
										background: 'var(--color-background-hover)',
									}}
								>
									<span
										style={{
											backgroundColor: r.method?.color || r.color,
											color: 'var(--color-text-on-action)',
											padding: '2px 6px',
											borderRadius: 4,
											fontWeight: 600,
											fontSize: 12,
										}}
									>
										{r.method?.name || 'UnknownMethod'}
									</span>
									<span> bound with </span>
									<span
										style={{
											color: r.color,
											fontFamily: 'monospace',
											fontWeight: 500,
										}}
									>
										{formatSourceField(r.sourceMessageProperty, r.target)}
									</span>
									<span>{i === refs.length - 1 ? ' field.' : ' field; '}</span>
								</div>
							))}
						</div>
					</div>
				);
			})}

			{!hasRefs && (
				<div style={{ opacity: 0.6 }}>
					No references found in {messageProperty}.
				</div>
			)}
		</div>
	);
};
