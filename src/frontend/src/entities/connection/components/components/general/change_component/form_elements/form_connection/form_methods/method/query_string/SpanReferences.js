/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';
import styles from '@entity/connection/components/themes/default/general/form_methods.scss';

export const InvokerReferenceFromRequiredData = (props) => {
    return <span className={`${styles.span_reference_invoker_from_required_data} ${props.isSelected ? styles.span_reference_selected : ''}`} data-value="invoker_reference" data-main={`${props.value}`}>{props.value}</span>
};

export const LocalReference = (props) => {
    return <span className={`${styles.span_reference_local} ${props.isSelected ? styles.span_reference_selected : ''}`} style={{background: props.color}} data-value="param" data-main={`${props.value}`}>{props.fieldName}</span>;
};