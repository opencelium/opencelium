import type { Connection, MethodWithId } from '@features/workflow/types/connection';
import { useAiFieldMapping } from '../../mapping/useAiFieldMapping';
import { AiFieldMappingPanel } from './AiFieldMappingPanel';

type Props = { connection: Connection | null; method: MethodWithId; body: unknown };

/** The body editor's "AI mapping" section; mounted only when the AI gateway can answer. */
export function AiFieldMappingSection({ connection, method, body }: Props) {
	const mapping = useAiFieldMapping({ connection, method, body });
	return <AiFieldMappingPanel mapping={mapping} />;
}
