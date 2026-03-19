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

import { isNumber, unwrapField } from '@application/utils/utils';
import { markFieldNameAsArray } from '@change_component//form_elements/form_connection/form_methods/help';
import Enhancement from '@change_component/form_elements/form_connection/form_methods/mapping/enhancement/Enhancement';
import GraphQLBody from '@change_component/form_elements/form_connection/form_methods/method/GraphQLBody';
import JsonBody from '@change_component/form_elements/form_connection/form_methods/method/JsonBody';
import XmlBody from '@change_component/form_elements/form_connection/form_methods/method/XmlBody';
import ReferenceInformation from '@change_component/form_elements/form_connection/form_svg/details/description/technical_process/reference_information/ReferenceInformation';
import CEnhancement from '@entity/connection/components/classes/components/content/connection/field_binding/CEnhancement';
import { BODY_FORMAT } from '@entity/connection/components/classes/components/content/invoker/CBody';
import Button from '@entity/connection/components/components/general/basic_components/buttons/Button';
import Dialog from '@entity/connection/components/components/general/basic_components/Dialog';
import TooltipFontIcon from '@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon';
import styles from '@entity/connection/components/themes/default/content/connections/connection_overview_2';
import React from 'react';
import ReactDOM from 'react-dom';
import { Col, Row } from 'react-grid-system';
import { withTheme } from 'styled-components';
import HelpIcon from "@app_component/base/tour/HelpIcon";
import {EnhancementSteps} from "@root/utils/tourSteps";

class Body extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			currentFieldName: '',
			currentEnhancement: null,
			isToggledIcon: true,
			isToggledReferenceIcon: false,
			isOpenedEnhancement: false,
		};
		this.JsonBodyRef = React.createRef();
		this.EnhancementRef = React.createRef();
		this.BodyRef = React.createRef();
		this.enhancementRef = React.createRef();
		this._isDirty = false;
		this._openSnapshot = null;
		this._isEnhancementInitializing = false;
		this._hasUserTouchedEnhancement = false;
	}

	_markDirty() {
		this._isDirty = true;
	}

	_takeSnapshot(connection) {
		try {
			const obj =
				typeof connection.getObject === 'function'
					? connection.getObject()
					: connection;
			return JSON.stringify(obj);
		} catch (e) {
			return null;
		}
	}

	getBodyDialogState() {}

	toggleReferenceIcon(isToggledReferenceIcon) {
		this.setState({ isToggledReferenceIcon });
	}

	toggleBodyVisible() {
		const {
			connection,
			updateConnection,
			setCurrentInfo,
			nameOfCurrentInfo,
			isBodyDialogOpened,
			toggleBodyDialog,
		} = this.props;

		const willOpen = !isBodyDialogOpened;

		if (willOpen) {
			if (setCurrentInfo) setCurrentInfo(nameOfCurrentInfo);

			if (connection) {
				connection.currentEnhancemnet = null;
			}

			this._isDirty = false;
			this._openSnapshot = this._takeSnapshot(connection);

			toggleBodyDialog();

			this.setState({
				currentEnhancement: null,
				currentFieldName: '',
				isToggledIcon: true,
				isToggledReferenceIcon: false,
			});

			return;
		}

		let hasChanges = this._isDirty;

		if (!hasChanges && this._openSnapshot) {
			const now = this._takeSnapshot(connection);
			hasChanges = now !== this._openSnapshot;
		}

		if (hasChanges) {
			updateConnection(connection);
		}

		this._openSnapshot = null;

		toggleBodyDialog();

		this.setState({
			currentEnhancement: null,
			currentFieldName: '',
			isToggledIcon: true,
			isToggledReferenceIcon: false,
		});
	}

	getCurrentBindingItem(fieldName) {
		const { connection, method } = this.props;
		const normalizeField = (value = '') => {
			return unwrapField(String(value))
				.replace(/\.([0-9]+)/g, '[$1]')
				.trim();
		};
		const removeLocationPrefix = (value = '') => {
			return normalizeField(value)
				.replace(/^body\.\$\./, '')
				.replace(/^header\.\$\./, '')
				.replace(/^status\./, '');
		};
		const normalizedFullFieldName = normalizeField(fieldName);
		const normalizedShortFieldName = removeLocationPrefix(fieldName);

		return connection.fieldBinding.find((item) => {
			return (
				item.to.findIndex((elem) => {
					if (elem.color !== method.color) {
						return false;
					}
					const elemFullField = normalizeField(elem.field);
					const elemShortField = removeLocationPrefix(elem.field);

					return (
						elemFullField === normalizedFullFieldName ||
						elemShortField === normalizedFullFieldName ||
						elemFullField === normalizedShortFieldName ||
						elemShortField === normalizedShortFieldName
					);
				}) !== -1
			);
		});
	}


	setCurrentEnhancementClickingOnPointer(e, value, fieldName = '') {
		const { connection } = this.props;
		let nextFieldName = fieldName;
		let bindingItem = null;
		if (nextFieldName === '') {
			if (value.namespace.length > 1) {
				for (let i = 1; i < value.namespace.length; i++) {
					if (
						i + 1 < value.namespace.length &&
						isNumber(value.namespace[i + 1])
					) {
						nextFieldName += markFieldNameAsArray(
							value.namespace[i],
							value.namespace[i + 1]
						);
						i++;
					} else {
						nextFieldName += value.namespace[i];
					}
					nextFieldName += '.';
				}
			}
			const lastNamespace = value.namespace[value.namespace.length - 1];
			if (value.variable.name !== lastNamespace) {
				nextFieldName += value.variable.name;
			} else {
				nextFieldName = nextFieldName.slice(0, -1);
			}
			bindingItem = this.getCurrentBindingItem(nextFieldName);
		} else {
			bindingItem = this.getCurrentBindingItem(nextFieldName);
		}

		if (bindingItem && bindingItem.to && bindingItem.to[0]) {
			connection.setCurrentFieldBindingTo(bindingItem.to[0]);
			const enhancement = connection.getEnhancementByTo();
			this.setState({
				currentFieldName: nextFieldName,
				currentEnhancement:
					enhancement instanceof CEnhancement
						? enhancement.getObject()
						: enhancement,
			});
			return;
		}
		this.setState({
			currentFieldName: nextFieldName,
			currentEnhancement: null,
		});
	}

	setCurrentEnhancement(currentEnhancement, options = {}) {
		const { connection } = this.props;
		const { currentFieldName } = this.state;

		const next =
			currentEnhancement instanceof CEnhancement
				? currentEnhancement.getObject()
				: currentEnhancement;

		if (!next) return;

		const stable = (v) => {
			try { return JSON.stringify(v ?? null); }
			catch { return String(v); }
		};

		const prev = this.state.currentEnhancement;

		if (stable(prev) === stable(next)) {
			return;
		}

		if (currentFieldName) {
			const bindingItem = this.getCurrentBindingItem(currentFieldName);
			if (bindingItem && bindingItem.to && bindingItem.to[0]) {
				connection.setCurrentFieldBindingTo(bindingItem.to[0]);
			}
		}

		if (!(options && options.silent)) {
			connection.updateEnhancement(next);
			this._markDirty();
		}

		this.setState({ currentEnhancement: next });
	}


	updateEntity(entity = null) {
		const { currentFieldName } = this.state;
		const { connection, updateConnection } = this.props;
		let currentEntity = entity === null ? connection : entity;
		this._markDirty('updateEntity');
		updateConnection(currentEntity);
		if (currentFieldName !== '') {
			let bindingItem = this.getCurrentBindingItem(currentFieldName);
			if (bindingItem) {
				bindingItem = bindingItem.to[0];
				currentEntity.setCurrentFieldBindingTo(bindingItem);
			}
			this.setCurrentEnhancement(currentEntity.getEnhancementByTo());
		}
	}

	renderBody(style = {}) {
		const { isToggledReferenceIcon } = this.state;
		const {
			readOnly,
			method,
			connection,
			isDraft,
			source,
			connector,
		} = this.props;
		if (method.isGraphQLData()) {
			return (
				<GraphQLBody
					id={'description_body'}
					isDraft={isDraft}
					readOnly={readOnly}
					method={connector.getMethodByIndex(method.index)}
					connection={connection}
					connector={connector}
					updateEntity={(a) => this.updateEntity(a)}
					noPlaceholder={true}
					source={source}
					openEnhancement={(a, b) =>
						this.setCurrentEnhancementClickingOnPointer(a, b)
					}
				/>
			);
		}
		switch (method.bodyFormat) {
			case BODY_FORMAT.X_WWW_URL_ENCODED:
			case BODY_FORMAT.JSON:
				return (
					<JsonBody
						target='body'
						ref={this.JsonBodyRef}
						id={'description_body'}
						isDraft={isDraft}
						isFullHeight={!isToggledReferenceIcon}
						readOnly={readOnly}
						method={connector.getMethodByIndex(method.index)}
						connection={connection}
						connector={connector}
						updateEntity={(a) => this.updateEntity(a)}
						noPlaceholder={true}
						source={source}
						openEnhancement={(a, b) =>
							this.setCurrentEnhancementClickingOnPointer(a, b)
						}
						style={style}
					/>
				);
			case BODY_FORMAT.XML:
				return (
					<XmlBody
						id={'description_body'}
						requestBodyClassName={styles.svg_description_xml_body}
						isDraft={isDraft}
						readOnly={readOnly}
						method={connector.getMethodByIndex(method.index)}
						connection={connection}
						connector={connector}
						updateEntity={(a) => this.updateEntity(a)}
						noPlaceholder={true}
						source={source}
						openEnhancement={(a, b) =>
							this.setCurrentEnhancementClickingOnPointer(a, b)
						}
					/>
				);
		}
	}

	toggleEnhancement() {
		const willOpen = !this.state.isOpenedEnhancement;

		if (willOpen) {
			this._isEnhancementInitializing = true;
			this._hasUserTouchedEnhancement = false;
		}

		this.setState({ isOpenedEnhancement: willOpen });
	}


	renderEnhancement() {
		const { currentEnhancement, isOpenedEnhancement, currentFieldName } = this.state;
		const { readOnly, connection, method, theme } = this.props;

		let bindingItem = null;
		if (currentFieldName) {
			bindingItem = this.getCurrentBindingItem(currentFieldName);
		}
		if (bindingItem) {
			bindingItem = bindingItem.getObject();
		}
		const enhancementElement = (
			<Enhancement
				key={`enhancement-${currentFieldName || 'empty'}`}
				binding={bindingItem}
				method={method}
				connection={connection}
				ref={this.enhancementRef}
				readOnly={readOnly}
				enhancement={currentEnhancement ? { ...currentEnhancement } : null}
				setEnhancement={(a) => this.setCurrentEnhancement(a)}
				isOpenedEnhancement={isOpenedEnhancement}
				theme={theme}
			/>
		);
		if (!currentEnhancement) {
			return (
				<div className={styles.body_reference_not_selected_message}>
					Please, click on the reference
				</div>
			);
		}
		return (
			<div className={styles.data}>
				{!isOpenedEnhancement && enhancementElement}
				<Dialog
					id={'open_enhancement_in_new_window'}
					actions={[{ label: 'Ok', onClick: () => this.toggleEnhancement() }]}
					active={isOpenedEnhancement}
					toggle={() => this.toggleEnhancement()}
					title={'Enhancement'}
					theme={{
						dialog: styles.enhancement_dialog,
						content: styles.enhancement_dialog_content,
					}}
				>
					{isOpenedEnhancement && enhancementElement}
				</Dialog>
			</div>
		);
	}

	renderInfo() {
		const {
			isToggledIcon,
			isToggledReferenceIcon,
			currentEnhancement,
		} = this.state;
		const {
			bodyTitle,
			isExtended,
			readOnly,
			source,
			method,
			connector,
			connection,
			tourSteps,
		} = this.props;
		const isGraphQLData = method.isGraphQLData();
		const hasEnhancement = this.props.hasEnhancement && !isGraphQLData;
		return (
			<React.Fragment>
				<div
					className={
						hasEnhancement
							? styles.body_data_with_enhancement
							: styles.body_data_without_enhancement
					}
				>
					{hasEnhancement && (
						<ReferenceInformation
							style={{maxHeight: !isToggledReferenceIcon ? '40px' : isToggledIcon ? '50%' : 'calc(100% - 40px)',}}
							body={source}
							method={method}
							connection={connection}
							toggleIcon={(a) => this.toggleReferenceIcon(a)}
							isToggledIcon={isToggledReferenceIcon}
							onReferenceClick={(fieldName) =>
								this.setCurrentEnhancementClickingOnPointer(
									null,
									null,
									fieldName
								)
							}
							location='body'
						/>
					)}
					<div ref={this.BodyRef} style={{
						position: 'relative',
						flex: 1,
						display: 'flex',
						flexDirection: 'column',
						maxHeight: !isToggledIcon ? '40px' : isToggledReferenceIcon ? '50%' : 'calc(100% - 40px)',
						minHeight: !hasEnhancement ? 0 : 'auto'
					}}>
						<div style={{position: 'relative', minHeight: '36px', display: 'flex'}}>
							<b ref={this.BodyRef}>{bodyTitle}</b>
							<div style={{marginTop: '-6px'}}>
								<HelpIcon steps={tourSteps} inputRef={this.BodyRef}/>
							</div>
							<TooltipFontIcon
								tooltipPosition={'right'}
								style={{cursor: 'pointer'}}
								onClick={() => this.setState({isToggledIcon: !isToggledIcon})}
								tooltip={isToggledIcon ? 'Hide' : 'Show'}
								value={isToggledIcon ? 'expand_less' : 'chevron_right'}
							/>
						</div>
						{isToggledIcon && this.renderBody({
							flex: 1,
							overflowY: 'auto',
						})}
					</div>
				</div>
				{hasEnhancement && (
					<div className={styles.body_enhancement} ref={this.EnhancementRef}>
						<div className={styles.body_enhancement_title}
							 style={{position: 'relative', minHeight: '36px', display: 'flex'}}>
							<b>{'Enhancement'}</b>
							<div style={{marginTop: '-6px'}}>
								<HelpIcon steps={EnhancementSteps} inputRef={this.EnhancementRef}/>
							</div>
							{currentEnhancement && (
								<div className={styles.body_enhancement_button}>
									<Button
										icon={'open_in_new'}
										onClick={() => this.toggleEnhancement()}
										iconSize={'13px'}
										label={'Open script in new window'}
										style={{marginBottom: '10px'}}
									/>
								</div>
							)}
						</div>
						{this.renderEnhancement()}
					</div>
				)}
				{isExtended && !readOnly && (
					<Button
						className={styles.extended_details_button_save_body}
						title={'Save'}
						onClick={(a) => this.toggleBodyVisible(a)}
					/>
				)}
			</React.Fragment>
		);
	}

	render() {
		const {
			connector,
			isExtended,
			isCurrentInfo,
			method,
			isBodyDialogOpened,
			hasError,
			theme,
		} = this.props;
		const errorColor = hasError
			? theme?.input?.error?.color || '#9b2e2e'
			: 'unset';
		const isGraphQLData = method.isGraphQLData();
		const hasEnhancement = this.props.hasEnhancement && !isGraphQLData;
		return (
			<React.Fragment>
				<Col
					id='body_label'
					xs={4}
					className={`${styles.col} ${styles.entry_padding}`}
				>{`Body`}</Col>
				<Col id='body_option' xs={8} className={`${styles.col}`}>
					<TooltipFontIcon
						tooltipPosition={'right'}
						onClick={(a) => this.toggleBodyVisible(a)}
						size={14}
						value={<span className={styles.more_details}>{`...`}</span>}
						tooltip={'Show'}
					/>
				</Col>
				{isExtended &&
					isCurrentInfo &&
					ReactDOM.createPortal(
						this.renderInfo(),
						document.getElementById('extended_details_information')
					)}
				<Dialog
					actions={[
						{
							label: 'Close',
							onClick: (a) => this.toggleBodyVisible(a),
							id: 'header_ok',
						},
					]}
					active={isBodyDialogOpened && !isExtended}
					toggle={(a) => this.toggleBodyVisible(a)}
					title={'Body'}
					theme={{
						dialog: isGraphQLData
							? styles.body_dialog_graphql
							: hasEnhancement
							? styles.body_dialog_with_enhancement
							: styles.body_dialog,
						content: styles.body_content,
						body: styles.enhancement_dialog_body,
					}}
				>
					{this.renderInfo()}
				</Dialog>
			</React.Fragment>
		);
	}
}

Body.defaultProps = {
	isDraft: false,
	hasEnhancement: true,
	hasError: false,
	tourSteps: [],
};

export default withTheme(Body);
