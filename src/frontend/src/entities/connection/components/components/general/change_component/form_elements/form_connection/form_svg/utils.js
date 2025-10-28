/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import { isArray, isObject, isString } from '@application/utils/utils';
import CConnection from '@entity/connection/components/classes/components/content/connection/CConnection';
import { CTechnicalOperator } from '@entity/connection/components/classes/components/content/connection_overview_2/operator/CTechnicalOperator';
import { CTechnicalProcess } from '@entity/connection/components/classes/components/content/connection_overview_2/process/CTechnicalProcess';

export function mapItemsToClasses(state, isModal = false) {
	const connectionOverview = isModal
		? state.modalConnectionReducer
		: state.connectionReducer;

	let connection = CConnection.createConnection(
		Object.assign({}, connectionOverview.connection)
	);
	const updateConnection = connectionOverview.updateConnection;
	let currentTechnicalItem = connectionOverview.currentTechnicalItem;
	if (
		currentTechnicalItem !== null &&
		(!(currentTechnicalItem instanceof CTechnicalProcess) ||
			!(currentTechnicalItem instanceof CTechnicalOperator))
	) {
		if (currentTechnicalItem.hasOwnProperty('type')) {
			currentTechnicalItem = CTechnicalOperator.createTechnicalOperator(
				currentTechnicalItem
			);
		} else {
			currentTechnicalItem = CTechnicalProcess.createTechnicalProcess(
				currentTechnicalItem
			);
		}
	}
	return {
		connectionOverview,
		currentTechnicalItem,
		connection,
		updateConnection,
	};
}
export function putAsterixInEmptyBrackets(data) {
	if (data) {
		try {
			data = JSON.stringify(data);
			data = data.split('[]').join('[*]');
			data = data.split(':[*]').join(':[]');
			return JSON.parse(data);
		} catch (e) {
		}
	}
	return data;
}

export function transformExpertVar(expertVar, from = 'body') {
	if (expertVar.includes('header.$') || expertVar.includes('body.$')) {
		return expertVar;
	}

	if (!expertVar.match(/#[0-9a-fA-F]{6}\.\((?:response|request)\)\./)) {
		return `${from === 'header' ? 'header.$' : 'body.$'}.${expertVar}`;
	}

	return expertVar.replace(
		/(#[0-9a-fA-F]{6}\.\((?:response|request)\)\.)(success|fail)?\.?([\w\[\]\.\-]+)/g,
		(match, prefix, status, fieldPart) => {
			if (fieldPart.startsWith('body.$') || fieldPart.startsWith('header.$')) {
				return `${prefix}${fieldPart}`;
			}

			if (status) {
				fieldPart = fieldPart.replace(/\b(success|fail)\b\./, '');
			}

			return `${prefix}${
				from === 'header' ? 'header.$' : 'body.$'
			}.${fieldPart}`;
		}
	);
}

export function transformEndpointReferences(endpoint, from = 'body') {
	if (typeof endpoint !== 'string' || endpoint.trim() === '') return endpoint;

	return endpoint.replace(/{%([^%]+)%}/g, (match, content) => {
		const transformedContent = transformDataFields(content.trim(), from);
		return `{%${transformedContent}%}`;
	});
}

function transformStringField(field, from, key = '') {
	if (typeof field !== 'string' || field.trim() === '') return field;

	if (key === 'endpoint') {
		return transformEndpointReferences(field, from);
	}

	if (key === 'expertVar') {
		return transformExpertVar(field, from);
	}

	field = field.replace(
		/\b(success|fail)\b/g,
		from === 'header' ? 'header.$' : 'body.$'
	);

	field = field.replace(
		/\b(body\.\$|header\.\$)\.(body\.\$|header\.\$)\b/g,
		'$1'
	);

	return field;
}

export function transformDataFields(data, from = 'body') {
	if (typeof data === 'string') {
		return transformStringField(data, from);
	}

	if (Array.isArray(data)) {
		return data.map((item) => transformDataFields(item, from));
	}

	if (data !== null && typeof data === 'object') {
		const newObj = {};
		for (const key in data) {
			if (Object.prototype.hasOwnProperty.call(data, key)) {
				if (typeof data[key] === 'string') {
					newObj[key] = transformStringField(data[key], from, key);
				} else {
					newObj[key] = transformDataFields(data[key], from);
				}
			}
		}
		return newObj;
	}

	return data;
}
