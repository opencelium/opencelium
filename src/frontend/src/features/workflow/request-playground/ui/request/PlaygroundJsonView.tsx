import type { ComponentType } from 'react';
import ReactJson from 'react-json-view';
import { useTheme } from '@shared/theme/hooks/useTheme';
import { BodyPointer } from '../../../components/request-editor/body-editor/BodyPointer/BodyPointer';
import { BodyWebhookReference } from '../../../components/request-editor/body-editor/BodyWebhookReference/BodyWebhookReference';
import { extractWebhookValue, parseWebhookValue } from '../../../components/request-editor/body-editor/bodyWebhook';
import type { Connection, MethodWithId } from '../../../types/connection';
import { referenceInputKey, webhookInputKey } from '../../model/playgroundValues';
import '../../../components/request-editor/body-editor/bodyLegacy.css';

type Props = {
	data: object;
	connection: Connection;
	currentMethod?: MethodWithId;
	missingKeys: string[];
	testId: string;
	onSelect: (key: string) => void;
};

// The vendored react-json-view takes these extension props, which its typings don't declare.
const PatchedReactJson = ReactJson as unknown as ComponentType<Record<string, unknown>>;

const asStrings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

// Read-only twin of the Body dialog's request data: references render as the same colored
// pointers and webhook parameters as the same badges. Clicking one opens its test value.
export function PlaygroundJsonView({ data, connection, currentMethod, missingKeys, testId, onSelect }: Props) {
	const { themeMode } = useTheme();
	const pointerComponent = {
		id: `${testId}_pointer`,
		getComponent: (params: Record<string, unknown>) => {
			const pointer = String(params.pointer || '');
			const key = referenceInputKey({ reference: pointer });
			return <BodyPointer pointer={pointer} pointers={asStrings(params.pointers)}
				connection={connection} currentMethod={currentMethod} isSelected={false}
				isWarning={missingKeys.includes(key)} onClick={() => onSelect(key)} />;
		},
	};
	const webhookComponent = {
		id: `${testId}_webhook`,
		getComponent: (params: Record<string, unknown>) => {
			const webhook = extractWebhookValue(String(params.webhook || ''));
			const key = webhookInputKey({ name: parseWebhookValue(webhook).name });
			return (
				<span className={`rpWebhook${missingKeys.includes(key) ? ' rpWebhook--missing' : ''}`}
					onClick={() => onSelect(key)}>
					<BodyWebhookReference webhook={webhook} />
				</span>
			);
		},
	};
	const referenceComponent = { id: `${testId}_reference`, self: { current: {} }, getComponent: () => null };

	return (
		<div className='bodyLegacyJsonWrap rpJsonView' data-testid={testId}>
			<PatchedReactJson name={false} collapsed={false} src={data} onEdit={false} onDelete={false} onAdd={false}
				PointerComponent={pointerComponent} WebhookComponent={webhookComponent}
				ReferenceComponent={referenceComponent}
				theme={themeMode === 'dark' ? 'twilight' : 'rjv-default'}
				style={{ wordBreak: 'break-word', padding: '8px 0', background: 'transparent', fontSize: 13 }} />
		</div>
	);
}
