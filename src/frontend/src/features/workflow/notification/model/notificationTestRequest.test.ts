import { describe, expect, it } from 'vitest';
import { buildPlaceholderValues } from './notificationTestRequest';

describe('buildPlaceholderValues', () => {
	it('fills every reference the backend reports with a readable placeholder', () => {
		expect(buildPlaceholderValues({ connectorReferences: [], staticReferences: [
			{ reference: '{%#C77E7E.(response).body.$.[0].name%}', type: 'WRAPPED_DIRECT' },
			{ reference: '#C77E7E.(response).body.$.customer.email', type: 'DIRECT' },
			{ reference: '{%#C77E7E.(response).status%}', type: 'WRAPPED_DIRECT' },
			{ reference: '${orderId:int}', type: 'WEBHOOK' },
		] })).toEqual({
			'{%#C77E7E.(response).body.$.[0].name%}': '[[0].name]',
			'#C77E7E.(response).body.$.customer.email': '[customer.email]',
			'{%#C77E7E.(response).status%}': '[status]',
			'${orderId:int}': '[orderId]',
		});
	});
});
