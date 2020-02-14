/*
 * Copyright (C) <2020>  <becon GmbH>
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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Row, Col} from "react-grid-system";

import theme from "react-toolbox/lib/input/theme.css";
import styles from '../../../../../../themes/default/general/change_component.scss';
import {FormElement} from "../../../../../../decorators/FormElement";
import DropdownMenu from "./dropdown_menu/DropdownMenu";
import Items from "./Items";
import Mapping from "./mapping/Mapping";

import AddTemplate from "./AddTemplate";
import CInvoker from "../../../../../../classes/components/content/invoker/CInvoker";


function mapStateToProps(state){
    const auth = state.get('auth');
    return{
        authUser: auth.get('authUser'),
    };
}

/**
 * Main Component for FormMethods of Connection Component
 */
@connect(mapStateToProps, {})
@FormElement()
class FormMethods extends Component{

    constructor(props){
        super(props);
    }

    /**
     * to update entity
     */
    updateEntity(e = null){
        const {entity, updateEntity} = this.props;
        console.log(entity.toConnector.operators);
        if(e === null) {
            updateEntity(entity);
        } else{
            updateEntity(e);
        }
    }

    render(){
        const {entity, data, authUser} = this.props;
        const {readOnly} = data;
        let {tourSteps} = data;
        let tourClassNames = [];
        if(tourSteps && tourSteps.length > 0){
            for(let i = 0; i < tourSteps.length; i++){
                tourClassNames.push(tourSteps[i].selector.substr(1));
            }
        }
        return (
            <div className={`${theme.withIcon} ${theme.input}`} style={{margin: '0 65px'}}>
                {!readOnly ?
                    <AddTemplate data={data} entity={entity} authUser={authUser}/>
                    : null
                }
                <div>
                    <div className={tourClassNames[0] ? tourClassNames[0] : ''}>
                        <div className={`${theme.inputElement} ${theme.filled} ${styles.multiselect_label}`}/>
                        <hr noshade="noshade" size="1" style={{marginTop: '40px'}} color={"#f0f0f0"}/>
                        <div className={styles.mapping_methods}>Methods</div>
                        <Row>
                            <Col xl={5} lg={5} md={6} sm={6} className={`${styles.form_select_method}`}>
                                <Items
                                    readOnly={readOnly}
                                    connection={entity}
                                    connector={entity.fromConnector}
                                    updateEntity={::this.updateEntity}
                                />
                                {
                                    readOnly
                                    ?
                                        null
                                    :
                                        <DropdownMenu
                                            readOnly={readOnly}
                                            connection={entity}
                                            connector={entity.fromConnector}
                                            updateEntity={::this.updateEntity}
                                        />
                                }
                            </Col>
                            <Col offset={{xl: 2, lg: 2}} xl={5} lg={5} md={6} sm={6} className={`${styles.form_select_method}`}>
                                <Items
                                    readOnly={readOnly}
                                    connection={entity}
                                    connector={entity.toConnector}
                                    updateEntity={::this.updateEntity}
                                />
                                {
                                    readOnly
                                        ?
                                        null
                                        :
                                        <DropdownMenu
                                            readOnly={readOnly}
                                            connection={entity}
                                            connector={entity.toConnector}
                                            updateEntity={::this.updateEntity}
                                        />
                                }
                            </Col>
                        </Row>
                    </div>
                    <Mapping
                        readOnly={readOnly}
                        connection={entity}
                        updateEntity={::this.updateEntity}
                        tourClassNames={tourClassNames}
                    />
                </div>
            </div>
        );
    }
}

FormMethods.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};


export default FormMethods;