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
import CConnection from "@entity/connection/components/classes/components/content/connection/CConnection";
import { CTechnicalOperator } from "@entity/connection/components/classes/components/content/connection_overview_2/operator/CTechnicalOperator";
import { CTechnicalProcess } from "@entity/connection/components/classes/components/content/connection_overview_2/process/CTechnicalProcess";

export function mapItemsToClasses(state, isModal = false){
    const connectionOverview = isModal ? state.modalConnectionReducer : state.connectionReducer;

    let connection = CConnection.createConnection(Object.assign({}, connectionOverview.connection));
    const updateConnection = connectionOverview.updateConnection;
    let currentTechnicalItem = connectionOverview.currentTechnicalItem;
    if(currentTechnicalItem !== null && (!(currentTechnicalItem instanceof CTechnicalProcess) || !(currentTechnicalItem instanceof CTechnicalOperator))){
        if(currentTechnicalItem.hasOwnProperty('type')){
            currentTechnicalItem = CTechnicalOperator.createTechnicalOperator(currentTechnicalItem);
        } else{
            currentTechnicalItem = CTechnicalProcess.createTechnicalProcess(currentTechnicalItem);
        }
    }
    return {
        connectionOverview,
        currentTechnicalItem,
        connection,
        updateConnection,
    }
}
export function putAsterixInEmptyBrackets(data){
    if(data){
        try {
            data = JSON.stringify(data);
            data = data.split('[]').join('[*]');
            data = data.split(':[*]').join(':[]');
            return JSON.parse(data);
        } catch(e){
            console.log(data);
        }
    }
    return data;
}




function isDirectReference(str) {
	if (typeof str !== 'string') return false;
	const regex = /^#[0-9a-fA-F]{6}\.\((?:response|request)\)\./;
	return regex.test(str);
}

export function transformFieldFormat(field, from = 'body') {
	if (typeof field !== 'string' || field.trim() === '') return field;

	if (!from) {
		if (field.includes('.header.')) {
			from = 'header';
		} else {
			from = 'body';
		}
	}

	if (field.includes('body.$') || field.includes('header.$')) {
		return field;
	}

	field = field.replace(/\b(success|fail)\b/g, from === 'header' ? 'header.$' : 'body.$');

	return field;
}

export function transformExpertVar(expertVar, from = 'body') {
	if (typeof expertVar !== 'string' || expertVar.trim() === '') return expertVar;

	const regex = /(#[0-9a-fA-F]{6}\.\((?:response|request)\)\.)((?:success|fail)\.[\w\[\]\.\-]+)/g;

	return expertVar.replace(regex, (match, prefix, fieldPart) => {
		let newFieldPart = fieldPart.replace(/\b(success|fail)\b/g, from === 'header' ? 'header.$' : 'body.$');
		return `${prefix}${newFieldPart}`;
	});
}

export function transformEndpointReferences(endpoint, from = 'body') {
	if (typeof endpoint !== 'string' || endpoint.trim() === '') return endpoint;

	return endpoint.replace(/{%([^%]+)%}/g, (match, content) => {
		const transformedContent = transformFieldFormat(content.trim(), from);
		return `{%${transformedContent}%}`;
	});
}

export function deepTransformFields(obj, from = 'body') {
	if (typeof obj === 'string') {
		if (isDirectReference(obj)) {
			return transformFieldFormat(obj, from);
		}
		return obj;
	}

	if (Array.isArray(obj)) {
		return obj.map((item) => deepTransformFields(item, from));
	}

	if (obj !== null && typeof obj === 'object') {
		const newObj = {};
		for (const key in obj) {
			if (Object.prototype.hasOwnProperty.call(obj, key)) {
				let newFrom = from;

				if (key === 'header') {
					newFrom = 'header';
				} else if (key === 'body' || key === 'fields') {
					newFrom = 'body';
				}

				if (typeof obj[key] === 'string') {
					if (key === 'endpoint') {
						newObj[key] = transformEndpointReferences(obj[key], newFrom);
					} else if (key === 'expertVar') {
						newObj[key] = transformExpertVar(obj[key], newFrom);
					} else {
						newObj[key] = transformFieldFormat(obj[key], newFrom);
					}
				} else if (
					(key === 'header' || key === 'fields') &&
					obj[key] !== null &&
					typeof obj[key] === 'object'
				) {
					const transformedObj = {};
					for (const subKey in obj[key]) {
						if (Object.prototype.hasOwnProperty.call(obj[key], subKey)) {
							if (typeof obj[key][subKey] === 'string') {
								transformedObj[subKey] = transformFieldFormat(
									obj[key][subKey],
									newFrom
								);
							} else {
								transformedObj[subKey] = deepTransformFields(
									obj[key][subKey],
									newFrom
								);
							}
						}
					}
					newObj[key] = transformedObj;
				} else {
					newObj[key] = deepTransformFields(obj[key], newFrom);
				}
			}
		}
		return newObj;
	}
	return obj;
}