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

import Input from '@app_component/base/input/Input';
import InputTextarea from '@app_component/base/input/textarea/InputTextarea';
import { getReactXmlStyles } from '@app_component/base/input/xml_view/styles';
import LimitedAceEditor from '@app_component/limited_ace_editor/LimitedAceEditor';
import Validation from "@application/classes/Validation";
import { getMarker, setFocusById } from '@application/utils/utils';
import CEnhancement from '@classes/content/connection/field_binding/CEnhancement';
import TooltipFontIcon from '@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon';
import PropTypes from 'prop-types';
import styles from '@entity/connection/components/themes/default/content/connections/connection_overview_2';
import React, {Component, useState} from 'react';
import { Col, Row } from 'react-grid-system';
import {
	FieldBindingsBlockStyled,
	ReferenceBlockStyled,
	SourceFieldStyled,
	SourceMethodNameStyled,
} from '../../../form_svg/details/description/technical_process/reference_information/styles';
import InputSelect from "@app_component/base/input/select/InputSelect";
import {codeGeneratorRegistry} from "@classes/content/connection/field_binding/code_generators/registry";
import Languages from "@change_component/form_elements/form_connection/form_methods/mapping/enhancement/Languages";
import {connect} from "react-redux";
import {checkPolyglot} from "@entity/external_application/redux_toolkit/action_creators/ExternalApplicationCreators";
import {ExternalApplicationStatus} from "@entity/external_application/requests/interfaces/IExternalApplication";
import DefaultText from "@app_component/base/text/DefaultText";

const languageOptions = [
	{label: 'JavaScript', value: 'js'},
	//{label: 'Python2', value: 'python2'},
	{label: 'Python3', value: 'python3'},
	{label: 'Ruby', value: 'ruby'},
];
const modeMap = {
	'js': 'javascript',
	'python2': 'python',
	'python3': 'python',
	'ruby': 'ruby',
}
const mapStateToProps = (state) => ({
	polyglotStatus: state.externalApplicationReducer.polyglotStatus,
});

/**
 * Enhancement Component
 */
@connect(mapStateToProps, {checkPolyglot})
class Enhancement extends Component {
	constructor(props) {
		super(props);
		let { enhancement } = props;
		let expertVar = enhancement ? enhancement.expertVar : '';
		let expertCode = enhancement ? enhancement.expertCode : '';
		this.state = {
			expertVar,
			expertCode,
			currentLanguage: enhancement?.language || 'javascript',
			name: enhancement ? enhancement.name : '',
			description: enhancement ? enhancement.description : '',
			markers: [],
			isDescriptionToggled: false,
		};
	}

	componentDidMount() {
		setFocusById('enhancement_description');
	}

	componentDidUpdate(prevProps, prevState, snapshot) {
		const { enhancementRef } = this.props;
		if (
			prevProps.enhancement &&
			(prevProps.enhancement.expertVar !== this.props.enhancement.expertVar ||
				prevProps.enhancement.expertCode !==
					this.props.enhancement.expertCode ||
				prevProps.enhancement.name !== this.props.enhancement.name ||
				prevProps.enhancement.description !==
					this.props.enhancement.description)
		) {
			this.setState({
				expertVar: this.props.enhancement.expertVar,
				expertCode: this.props.enhancement.expertCode,
				name: this.props.enhancement.name,
				description: this.props.enhancement.description,
			});
		}
		if (this.state.expertCode !== prevState.expertCode) {
			const newMarkers = getMarker(
				enhancementRef.current.editor,
				this.state.expertCode,
				CEnhancement.generateNotExistVar()
			);
			this.setState({ markers: newMarkers });
		}
	}

	getOptions() {
		const { polyglotStatus } = this.props;

		if (polyglotStatus?.status === ExternalApplicationStatus.DOWN) {
			return languageOptions.map(l => ({
				value: l.value,
				label: l.value === 'js' ? l.label : `${l.label} (not configured)`,
			}));
		} else {
			return languageOptions;
		}
	}
	updateCurrentLanguage(newLanguage) {
		let { enhancement, setEnhancement, binding } = this.props;
		const enhancementInstance = CEnhancement.createEnhancement({...enhancement, fieldBinding: binding});
		enhancementInstance.language = newLanguage;
		setEnhancement(enhancementInstance.getObject());
		this.setState({
			currentLanguage: newLanguage,
		})
	}

	/**
	 * to update description of enhancement
	 */
	updateDescription(description) {
		let { enhancement, setEnhancement } = this.props;
		enhancement.description = description;
		setEnhancement(enhancement);
		this.setState({ description });
	}

	/**
	 * to update expert code
	 */
	updateExpertCode(code, e) {
		if (code.length <= Validation.TextLength.Long) {
			const { setEnhancement } = this.props;
			let { enhancement } = this.props;
			enhancement.expertCode = code;
			setEnhancement(enhancement);
			this.setState({ expertCode: code });
		}
	}

	renderExpertVar(input) {
		const { connection } = this.props;
		const {currentLanguage} = this.state;
		const LanguageGenerator = codeGeneratorRegistry[currentLanguage]();
		const regex = LanguageGenerator.getExpertVarRegExp();
		let match;
		const result = [];

		while ((match = regex.exec(input)) !== null) {
			const [_, variable, color, prop] = match;
			result.push({
				var: variable,
				color: `#${color}`,
				prop: prop,
			});
		}

		const output = result.map((item, key) => {
			const method = connection.getMethodByColor(item.color);
			//RESULT_VAR is passed to the biosVersion field in the AddComplexUnit request body.
			let path = item.prop[item.prop.length - 1] === '.'
				? item.prop.substring(0, item.prop.length - 1)
				: item.prop;
			let target = '';
			if (path.indexOf('body.$.') === 0) {
				target = 'body';
				path = path.substring(7);
			} else if (path.indexOf('header.$.') === 0) {
				target = 'header';
				path = path.substring(9);
			} else if (path.indexOf('status') === 0) {
				target = 'status';
				path = path.substring(7);
			}
			const isResultVar = item.var === 'RESULT_VAR';
			const isStatus = target === 'status';
			return (
				<ReferenceBlockStyled key={key} style={{ margin: '5px 0' }}>
					<DefaultText value={`${item.var} is ${isResultVar ? 'used as' : 'taken from'}${!isStatus ? ' the value of the ' : ''}`}/>
					<SourceFieldStyled style={{ color: item.color }}>
						<DefaultText value={path} />
					</SourceFieldStyled>
					<DefaultText value={<span>{`${!isStatus ? ' field in the' : ''} ${isResultVar ? 'request' : 'response'} `}<strong>{target}</strong>{` of the `}</span>}/>
					<SourceMethodNameStyled style={{ background: item.color }}>
						<DefaultText value={method.label || method.name}/>
					</SourceMethodNameStyled>
					<DefaultText value={` method.`}/>
				</ReferenceBlockStyled>
			);
		});

		return output;
	}

	renderEnhancement() {
		const { expertVar, markers } = this.state;
		let { readOnly, theme } = this.props;
		let { expertCode, currentLanguage } = this.state;
		const options = this.getOptions();

		const styleProps = {
			display: 'inline-block',
			width: '100%',
			marginLeft: '46px',
			marginBottom: 0,
			flex: 1,
			borderBottom: '1px solid #e9e9e9',
		};
		const lOptions = this.getOptions();
		return (
			<>
				<FieldBindingsBlockStyled
					style={{
						margin: '10px',
						fontSize: '12px',
						maxHeight: '100px',
						minHeight: '60px',
						overflowY: 'auto',
					}}
				>
					{this.renderExpertVar(expertVar)}
				</FieldBindingsBlockStyled>
				<div style={{margin: '0 10px'}}>
					<InputSelect
						id={`input_language`}
						label={'Language'}
						options={lOptions}
						onChange={(option) => this.updateCurrentLanguage(option.value)}
						value={lOptions.find(o => o.value === currentLanguage)}
					/>
				</div>
				<Input
					className={styles.enhancement_code}
					readOnly={readOnly}
					value={expertCode}
					display={'grid'}
					hasUnderline={false}
					labelMargin='0 0 0 0'
					height={`calc(100% - 20px)`}
				>
					<LimitedAceEditor
						hasDiffLang
						maxLength={Validation.TextLength.Long}
						ref={this.props.enhancementRef}
						style={{
							...getReactXmlStyles({ ...styleProps, marginTop: '0' }),
							width: styleProps.width,
							height: '100%',
						}}
						markers={markers}
						mode={modeMap[currentLanguage]}
						editorTheme='tomorrow'
						theme={theme}
						onChange={(newCode, e) => this.updateExpertCode(newCode, e)}
						name='enhancement_code'
						editorProps={{ $blockScrolling: true }}
						showGutter={true}
						highlightActiveLine={true}
						value={`${expertCode}`}
						height={'330px'}
						width={'100%'}
						readOnly={readOnly}
						setOptions={{
							enableBasicAutocompletion: true,
							enableLiveAutocompletion: true,
							enableSnippets: true,
							showLineNumbers: false,
							tabSize: 2,
							useWorker: false,
						}}
					/>
				</Input>
			</>
		);
	}

	toggleDescriptionIcon() {
		this.setState({ isDescriptionToggled: !this.state.isDescriptionToggled });
	}

	render() {
		const { description, isDescriptionToggled } = this.state;
		let { readOnly, isOpenedEnhancement } = this.props;
		return (
			<div
				style={{
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'space-between',
				}}
			>
				{this.renderEnhancement()}
				{!isOpenedEnhancement && (
					<>
						<div>
							<b>{`Description`}</b>
							<TooltipFontIcon
								tooltipPosition={'right'}
								style={{ verticalAlign: 'middle', cursor: 'pointer' }}
								onClick={() => this.toggleDescriptionIcon()}
								tooltip={isDescriptionToggled ? 'Hide' : 'Show'}
								value={isDescriptionToggled ? 'expand_less' : 'chevron_right'}
							/>
						</div>
						{isDescriptionToggled && (
							<Row>
								<Col md={12}>
									<InputTextarea
										id={'enhancement_description'}
										readOnly={readOnly}
										icon={'notes'}
										onChange={(e) => this.updateDescription(e.target.value)}
										name={'Description'}
										value={description}
										maxLength={Validation.TextLength.Medium}
									/>
								</Col>
							</Row>
						)}
					</>
				)}
			</div>
		);
	}
}

Enhancement.propTypes = {
	setEnhancement: PropTypes.func.isRequired,
	readOnly: PropTypes.bool,
	enhancement: PropTypes.any,
};

Enhancement.defaultProps = {};

export default React.forwardRef((props, ref) => (
	<Enhancement enhancementRef={ref} {...props} />
));
