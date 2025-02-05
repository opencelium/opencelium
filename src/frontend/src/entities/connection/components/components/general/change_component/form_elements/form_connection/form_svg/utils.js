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

export function transformFieldFormat(field) {
  if (typeof field !== 'string' || field.trim() === '') return field;
  
  if (field.includes(';')) {
    return field
      .split(';')
      .map(ref => transformFieldFormat(ref.trim()))
      .join(';');
  }
  
  if (field.includes('body.$')) return field;
  
  if (/\b(success|fail)\b/.test(field)) {
    field = field.replace(/\b(success|fail)\.?/g, 'body.$.');
    return field;
  }
  
  if (field.startsWith('#')) {
    const match = field.match(/^(#[0-9a-fA-F]{6}\.\((?:response|request)\)\.)/);
    if (match) {
      return field.replace(match[1], `${match[1]}body.$.`);
    }
  }
  
  return `body.$.${field}`;
}

export function transformExpertVar(expertVar) {
  if (typeof expertVar !== 'string' || expertVar.trim() === '') return expertVar;
  const regex = /(#[0-9a-fA-F]{6}\.\((?:response|request)\)\.)(?!body\.\$\.)([\w\[\]\.\-]+)/g;
  return expertVar.replace(regex, (match, prefix, fieldPart) => {
    let newFieldPart = fieldPart;
    if (newFieldPart.startsWith('success.')) {
      newFieldPart = newFieldPart.substring('success.'.length);
    } else if (newFieldPart.startsWith('fail.')) {
      newFieldPart = newFieldPart.substring('fail.'.length);
    }
    return `${prefix}body.$.${newFieldPart}`;
  });
}

export function transformEndpointReferences(endpoint) {
  if (typeof endpoint !== 'string' || endpoint.trim() === '') return endpoint;
  return endpoint.replace(/{%([^%]+)%}/g, (match, content) => {
    return `{%${transformFieldFormat(content.trim())}%}`;
  });
}

export function deepTransformFields(obj, keysToTransform = ['endpoint', 'expertVar', 'field', 'fields']) {
  if (typeof obj === 'string') {
    if (isDirectReference(obj)) {
      return transformFieldFormat(obj);
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => deepTransformFields(item, keysToTransform));
  }
  if (obj !== null && typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (keysToTransform.includes(key) && typeof obj[key] === 'string') {
          if (key === 'endpoint') {
            newObj[key] = transformEndpointReferences(obj[key]);
          } else if (key === 'expertVar') {
            newObj[key] = transformExpertVar(obj[key]);
          } else {
            newObj[key] = transformFieldFormat(obj[key]);
          }
        } else if (key === 'fields' && obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          const newFields = {};
          for (const subKey in obj[key]) {
            if (Object.prototype.hasOwnProperty.call(obj[key], subKey)) {
              if (typeof obj[key][subKey] === 'string') {
                newFields[subKey] = transformFieldFormat(obj[key][subKey]);
              } else {
                newFields[subKey] = deepTransformFields(obj[key][subKey], keysToTransform);
              }
            }
          }
          newObj[key] = newFields;
        } else {
          newObj[key] = deepTransformFields(obj[key], keysToTransform);
        }
      }
    }
    return newObj;
  }
  return obj;
}

