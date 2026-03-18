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

import CConnection from '@entity/connection/components/classes/components/content/connection/CConnection';
import CConnectorItem from '@entity/connection/components/classes/components/content/connection/CConnectorItem';
import { CJsonEditor } from '@entity/connection/components/classes/components/general/basic_components/json_editor/CJsonEditor';
import { RequestBody } from '@entity/connection/components/decorators/RequestBody';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import ReactJson from 'react-json-view';

const JSON_BODY_BASE_STYLE = {
	wordBreak: 'break-word',
	padding: '8px 0',
	width: '80%',
	display: 'inline-block',
	position: 'relative',
};

@withTranslation('basic_components')
@RequestBody(CJsonEditor)
class JsonBody extends Component {
	getSource() {
		const { source, target, method } = this.props;

		if (source !== null) {
			return source;
		}

		return target === 'header'
			? method.request.getHeaderFields()
			: method.request.getBodyFields();
	}

	render() {
		const {
			readOnly,
			method,
			updateBody,
			ReferenceComponent,
			PointerComponent,
			WebhookComponent,
			onReferenceClick,
			style,
		} = this.props;

		const src = this.getSource();

		return (
			<ReactJson
				ref={this.props.reactJsonRef}
				name={false}
				collapsed={false}
				src={src}
				onEdit={readOnly ? false : updateBody}
				onDelete={readOnly ? false : updateBody}
				onAdd={readOnly ? false : updateBody}
				style={{
					...JSON_BODY_BASE_STYLE,
					...style,
				}}
				ReferenceComponent={ReferenceComponent}
				PointerComponent={PointerComponent}
				WebhookComponent={WebhookComponent}
				onReferenceClick={onReferenceClick}
			/>
		);
	}
}

JsonBody.propTypes = {
	id: PropTypes.string.isRequired,
	readOnly: PropTypes.bool,
	connection: PropTypes.instanceOf(CConnection),
	connector: PropTypes.instanceOf(CConnectorItem),
	updateBody: PropTypes.func,
	style: PropTypes.any,
};

JsonBody.defaultProps = {
	readOnly: false,
	bodyStyles: {},
	isDraft: false,
	source: null,
	noPlaceholder: false,
	style: {},
};

export default React.forwardRef((props, ref) => (
	<JsonBody reactJsonRef={ref} {...props} />
));