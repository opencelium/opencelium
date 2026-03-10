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

import CEnhancement from '@entity/connection/components/classes/components/content/connection/field_binding/CEnhancement';
import Button from '@entity/connection/components/components/general/basic_components/buttons/Button';
import Dialog from '@entity/connection/components/components/general/basic_components/Dialog';
import TooltipFontIcon from '@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon';
import styles from '@entity/connection/components/themes/default/content/connections/connection_overview_2';
import React from 'react';
import ReactDOM from 'react-dom';
import { Col, Row } from 'react-grid-system';
import Enhancement from '../../../../form_methods/mapping/enhancement/Enhancement';
import JsonBody from '../../../../form_methods/method/JsonBody';
import ReferenceInformation from './reference_information/ReferenceInformation';
import HelpIcon from "@app_component/base/tour/HelpIcon";
import {EnhancementSteps} from "@root/utils/tourSteps";

class Header extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isHeaderVisible: false,
			isToggledReferenceIcon: false,
			currentFieldName: '',
			currentEnhancement: null,
			isOpenedEnhancement: false,
			isToggledIcon: true,
		};
		this.EnhancementRef = React.createRef();
		this.HeaderRef = React.createRef();
		this.JsonBodyRef = React.createRef();
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

	toggleHeaderVisible() {
		const {
			setCurrentInfo,
			nameOfCurrentInfo,
			updateConnection,
			connection,
		} = this.props;
		const willOpen = !this.state.isHeaderVisible;

		if (willOpen) {
			if (setCurrentInfo) setCurrentInfo(nameOfCurrentInfo);

			this._isDirty = false;
			this._openSnapshot = this._takeSnapshot(connection);

			this.setState({
				currentEnhancement: null,
				currentFieldName: '',
				isToggledIcon: true,
				isToggledReferenceIcon: false,
				isHeaderVisible: true,
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

		this.setState({
			currentEnhancement: null,
			currentFieldName: '',
			isToggledIcon: true,
			isToggledReferenceIcon: false,
			isHeaderVisible: false,
		});
	}

	toggleReferenceIcon(isToggledReferenceIcon) {
		this.setState({ isToggledReferenceIcon });
	}

	addParam(param) {}

	getCurrentBindingItem(fieldName) {
		const { connection, method } = this.props;
		let normalizedFieldName = fieldName
			.replace(/^body\.\$\./, '')
			.replace(/^header\.\$\./, '')
			.replace(/\.([0-9]+)/g, '[$1]');

		return connection.fieldBinding.find((item) => {
			return (
				item.to.findIndex((elem) => {
					let name = elem.field
						.replace(/^body\.\$\./, '')
						.replace(/^header\.\$\./, '')
						.replace(/\.([0-9]+)/g, '[$1]');
					return elem.color === method.color && name === normalizedFieldName;
				}) !== -1
			);
		});
	}

	setCurrentEnhancementClickingOnPointer(e, value, fieldName = '') {
		const { connection, connector, method } = this.props;
		/*if(connector.getConnectorType() === CONNECTOR_FROM){
              return;
          }*/
		let bindingItem = null;
		if (fieldName === '') {
			if (value.namespace.length > 1) {
				for (let i = 1; i < value.namespace.length; i++) {
					if (
						i + 1 < value.namespace.length &&
						isNumber(value.namespace[i + 1])
					) {
						fieldName += markFieldNameAsArray(
							value.namespace[i],
							value.namespace[i + 1]
						);
						i++;
					} else {
						fieldName += value.namespace[i];
					}
					fieldName += '.';
				}
			}
			fieldName += value.variable.name;
			bindingItem = this.getCurrentBindingItem(fieldName);
		} else {
			bindingItem = connection.fieldBinding.find((item) => {
				return (
					item.to.findIndex((elem) => {
						return elem.color === method.color && elem.field === fieldName;
					}) !== -1
				);
			});
		}
		if (bindingItem) {
			bindingItem = bindingItem.to[0];
			connection.setCurrentFieldBindingTo(bindingItem);
		}
		this.setCurrentEnhancement(connection.getEnhancementByTo(), {
			silent: true,
		});
		this.setState({
			currentFieldName: fieldName,
		});
	}

	setCurrentEnhancement(currentEnhancement, options = {}) {
		const { connection } = this.props;

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

		if (options && options.silent) {
			this.setState({ currentEnhancement: next });
			return;
		}

		connection.updateEnhancement(next);
		this._isDirty = true;

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

	renderHeader(style = {}) {
		const { isToggledReferenceIcon } = this.state;
		const {
			isDraft,
			readOnly,
			connection,
			connector,
			source,
			method,
		} = this.props;
		return (
			<JsonBody
				target='header'
				ref={this.JsonBodyRef}
				id={'description_header'}
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
	}

	renderInfo() {
		const {
			isToggledIcon,
			isToggledReferenceIcon,
			currentEnhancement,
		} = this.state;
		const {
			isExtended,
			readOnly,
			source,
			method,
			connector,
			connection,
			hasEnhancement,
			headerTitle,
			tourSteps,
		} = this.props;
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
							location='header'
						/>
					)}
					<div style={{
						position: 'relative',
						flex: 1,
						display: 'flex',
						flexDirection: 'column',
						maxHeight: !isToggledIcon ? '40px' : isToggledReferenceIcon ? '50%' : 'calc(100% - 40px)',
					}}>
						<div style={{position: 'relative', minHeight: '36px', display: 'flex'}}>
							<b ref={this.HeaderRef}>{headerTitle || 'Request Data'}</b>
							<div style={{marginTop: '-6px'}}>
								<HelpIcon steps={tourSteps} inputRef={this.HeaderRef}/>
							</div>
							<TooltipFontIcon
								tooltipPosition={'right'}
								style={{cursor: 'pointer'}}
								onClick={() => this.setState({isToggledIcon: !isToggledIcon})}
								tooltip={isToggledIcon ? 'Hide' : 'Show'}
								value={isToggledIcon ? 'expand_less' : 'chevron_right'}
							/>
						</div>
						{isToggledIcon && this.renderHeader({
							flex: 1,
							overflowY: 'auto',
						})}
					</div>
				</div>
				{hasEnhancement && (
					<div className={styles.body_enhancement} ref={this.EnhancementRef}>
						<div className={styles.body_enhancement_title} style={{position: 'relative', minHeight: '36px', display: 'flex'}}>
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

	toggleEnhancement() {
		const willOpen = !this.state.isOpenedEnhancement;

		if (willOpen) {
			this._isEnhancementInitializing = true;
			this._hasUserTouchedEnhancement = false;
		}

		this.setState({ isOpenedEnhancement: willOpen });
	}



	renderEnhancement() {
		const { currentEnhancement, isOpenedEnhancement } = this.state;
		const { readOnly, connection, method } = this.props;
		let bindingItem = connection.fieldBinding.find(
			(item) =>
				item.to.findIndex((elem) => elem.color === method.color) !== -1
		);
		if (bindingItem) {
			bindingItem = bindingItem.getObject();
		}
		const enhancementElement = (
			<Enhancement
				binding={bindingItem}
				method={method}
				connection={connection}
				ref={this.enhancementRef}
				readOnly={readOnly}
				enhancement={{ ...currentEnhancement }}
				setEnhancement={(a) => this.setCurrentEnhancement(a)}
				isOpenedEnhancement={isOpenedEnhancement}
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

	render() {
		const { isHeaderVisible } = this.state;
		const { isExtended, hasEnhancement } = this.props;
		return (
			<React.Fragment>
				<Col
					id='header_label'
					xs={4}
					className={`${styles.col} ${styles.entry_padding}`}
				>{`Header`}</Col>
				<Col id='header_option' xs={8} className={`${styles.col}`}>
					<TooltipFontIcon
						tooltipPosition={'right'}
						onClick={() => this.toggleHeaderVisible()}
						size={14}
						value={<span className={styles.more_details}>{`H`}</span>}
						tooltip={'Show'}
					/>
				</Col>
				<Dialog
					actions={[
						{
							label: 'Close',
							onClick: () => this.toggleHeaderVisible(),
							id: 'header_ok',
						},
					]}
					active={isHeaderVisible && !isExtended}
					toggle={() => this.toggleHeaderVisible()}
					title={'Header'}
					theme={{
						dialog: hasEnhancement
								? styles.body_dialog_with_enhancement
								: styles.body_dialog,
						body: styles.enhancement_dialog_body,
						content: styles.body_content,
					}}
				>
					{this.renderInfo()}
				</Dialog>
			</React.Fragment>
		);
	}
}

Header.defaultProps = {
	hasEnhancement: true,
	isDraft: false,
	hasError: false,
	tourSteps: [],
};

export default Header;
