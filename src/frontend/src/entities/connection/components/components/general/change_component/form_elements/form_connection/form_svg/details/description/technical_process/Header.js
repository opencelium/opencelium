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
import Table from '@entity/connection/components/components/general/basic_components/table/Table';
import TooltipFontIcon from '@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon';
import styles from '@entity/connection/components/themes/default/content/connections/connection_overview_2';
import React from 'react';
import ReactDOM from 'react-dom';
import { Col, Row } from 'react-grid-system';
import Enhancement from '../../../../form_methods/mapping/enhancement/Enhancement';
import JsonBody from '../../../../form_methods/method/JsonBody';
import ReferenceInformation from './reference_information/ReferenceInformation';

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
		this.JsonBodyRef = React.createRef();
		this.enhancementRef = React.createRef();
	}

	toggleHeaderVisible() {
		const { setCurrentInfo, nameOfCurrentInfo } = this.props;
		if (setCurrentInfo) setCurrentInfo(nameOfCurrentInfo);
		this.setState({
			isHeaderVisible: !this.state.isHeaderVisible,
		});
	}

	toggleReferenceIcon(isToggledReferenceIcon) {
		this.setState({ isToggledReferenceIcon });
	}

	addParam(param) {}

	getCurrentBindingItem(fieldName) {
		const { connection, method } = this.props;

		return connection.fieldBinding.find((item) => {
			return (
				item.to.findIndex((elem) => {
					let name = elem.field
						.replace(/^body\.\$\./, '')
						.replace(/^header\.\$\./, '');
					let normalizedFieldName = fieldName
						.replace(/^body\.\$\./, '')
						.replace(/^header\.\$\./, '');

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
		this.setCurrentEnhancement(connection.getEnhancementByTo());
		this.setState({
			currentFieldName: fieldName,
		});
	}

	setCurrentEnhancement(currentEnhancement) {
		const { connection } = this.props;
		if (currentEnhancement !== null) {
			connection.updateEnhancement(currentEnhancement);
		}
		this.setState({
			currentEnhancement:
				currentEnhancement instanceof CEnhancement
					? currentEnhancement.getObject()
					: currentEnhancement,
		});
	}

	updateEntity(entity = null) {
		const { currentFieldName } = this.state;
		const { connection, updateConnection } = this.props;
		let currentEntity = entity === null ? connection : entity;
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

	renderHeader() {
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
		} = this.props;
		let gridStyles = {};
		if (isToggledReferenceIcon && !isToggledIcon) {
			gridStyles.gridTemplateRows = 'calc(100% - 40px) 40px';
		}
		if (!isToggledReferenceIcon && isToggledIcon) {
			gridStyles.gridTemplateRows = '40px calc(100% - 40px)';
		}
		if (!isToggledReferenceIcon && !isToggledIcon) {
			gridStyles.gridTemplateRows = '40px 40px';
		}
		if (isToggledReferenceIcon && isToggledIcon) {
			gridStyles.gridTemplateRows = '25% calc(100%)';
		}
		if (!hasEnhancement) {
			gridStyles.gridTemplateRows = 'unset';
		}
		return (
			<React.Fragment>
				<div
					className={
						hasEnhancement
							? styles.body_data_with_enhancement
							: styles.body_data_without_enhancement
					}
					style={gridStyles}
				>
					{hasEnhancement && (
						<ReferenceInformation
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
						/>
					)}
					<div>
						<div>
							<b>{'Request Data'}</b>
							<TooltipFontIcon
								tooltipPosition={'right'}
								style={{ verticalAlign: 'middle', cursor: 'pointer' }}
								onClick={() => this.setState({ isToggledIcon: !isToggledIcon })}
								tooltip={isToggledIcon ? 'Hide' : 'Show'}
								value={isToggledIcon ? 'expand_less' : 'chevron_right'}
							/>
						</div>
						{isToggledIcon && this.renderHeader()}
					</div>
				</div>
				{hasEnhancement && (
					<div className={styles.body_enhancement}>
						<div className={styles.body_enhancement_title}>
							<b>{'Enhancement'}</b>
							{currentEnhancement && (
								<Button
									icon={'open_in_new'}
									onClick={() => this.toggleEnhancement()}
									iconSize={'13px'}
									label={'Open script in new window'}
									style={{ marginBottom: '10px' }}
								/>
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
		this.setState({ isOpenedEnhancement: !this.state.isOpenedEnhancement });
	}

	renderEnhancement() {
		const { currentEnhancement, isOpenedEnhancement } = this.state;
		const { readOnly, connection, method } = this.props;
		const enhancementElement = (
			<Enhancement
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
		const { isExtended, isCurrentInfo } = this.props;
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
				{isExtended &&
					isCurrentInfo &&
					ReactDOM.createPortal(
						this.renderItems(),
						document.getElementById('extended_details_information')
					)}

				<Dialog
					actions={[
						{
							label: 'Ok',
							onClick: () => this.toggleHeaderVisible(),
							id: 'header_ok',
						},
					]}
					active={isHeaderVisible && !isExtended}
					toggle={() => this.toggleHeaderVisible()}
					title={'Header'}
					theme={{
						dialog: styles.body_dialog_with_enhancement,
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
};

export default Header;
