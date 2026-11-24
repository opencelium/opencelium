import { createContext, useContext, useRef, useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { PAYLOAD_REFERENCE_RE } from '../api/connectionPayload.references';
import ReferenceGenerator from '../components/request-editor/reference-generator/ReferenceGenerator';
import { JsonValueEditor } from '../request-playground/ui/request/JsonValueEditor';
import type { Connection, MethodWithId } from '../types/connection';

export const NotificationReferenceContext = createContext<{
	connection: Connection;
	method: MethodWithId;
} | null>(null);

type Props = {
	label: string;
	placeholder?: string;
	testId: string;
	value: string;
	area?: boolean;
	json?: boolean;
	invalid?: boolean;
	disabled?: boolean;
	onChange: (value: string) => void;
};

export function NotificationReferenceField({ label, placeholder, testId, value, area, json, invalid, disabled, onChange }: Props) {
	const { t } = useI18n('workflow');
	const source = useContext(NotificationReferenceContext);
	const input = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
	const selection = useRef<{ start: number; end: number } | null>(null);
	const [open, setOpen] = useState(false);
	const tokens = [...value.matchAll(PAYLOAD_REFERENCE_RE)];
	const insert = (reference: string) => {
		const token = reference.startsWith('{%') ? reference : '{%' + reference + '%}';
		const { start, end } = selection.current ?? { start: value.length, end: value.length };
		const before = value.slice(0, start);
		const after = value.slice(end);
		const insideString = [...before.matchAll(/\\[\s\S]|"/g)].filter(([part]) => part === '"').length % 2 === 1;
		const quoted = JSON.stringify(token);
		onChange(before + (json ? insideString ? quoted.slice(1, -1) : quoted : token) + after);
		setOpen(false);
	};
	const props = { 'aria-label': label, 'data-testid': testId, placeholder, value, disabled,
		onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value) };
	const readSelection = () => {
		selection.current = { start: input.current?.selectionStart ?? value.length, end: input.current?.selectionEnd ?? value.length };
	};
	return <div className="notificationReferenceField">
		{json ? <div className="notificationJson">
			<JsonValueEditor name={testId + '-ace'} testId={testId} label={label} value={value} isError={!!invalid}
				placeholder={placeholder ?? ''} onChange={onChange}
				onSelectionChange={(start, end) => { selection.current = { start, end }; }} />
		</div> : area ? <textarea {...props} ref={(node) => { input.current = node; }} onSelect={readSelection} />
			: <input {...props} ref={(node) => { input.current = node; }} onSelect={readSelection} />}
		{!disabled && source && <button type="button" data-testid={testId + '-insert-reference'}
			onClick={() => setOpen(true)}>{t('actions.insertReference')}</button>}
		{tokens.length > 0 && <div className="notificationReferenceChips">
			{tokens.map((token) => <span key={token.index}>
				<code>{token[0]}</code>
				{!disabled && <button type="button" data-testid={testId + '-remove-reference'}
					aria-label={t('notification.remove') + ' ' + token[0]}
					onClick={() => onChange(value.slice(0, token.index) + value.slice(token.index + token[0].length))}>×</button>}
			</span>)}
		</div>}
		{source && open && <ReferenceGenerator open connection={source.connection} currentMethod={source.method}
			onClose={() => setOpen(false)} onApply={insert} />}
	</div>;
}
