import type { PreviewValue } from '../../utils/dslPreview.utils';

export function AiValue({ value }: { value: PreviewValue }) {
	if (value.kind === 'literal') return <code className="aiLiteral">"{value.text}"</code>;
	return (
		<span className="aiRefChip">
			<span className="aiRefSource">{value.source}</span>
			{value.path && (
				<>
					<span className="aiRefSeparator" aria-hidden>›</span>
					<code className="aiRefPath">{value.path}</code>
				</>
			)}
		</span>
	);
}
