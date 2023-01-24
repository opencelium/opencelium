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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Row, Col} from "react-grid-system";

import styles from '@entity/connection/components/themes/default/general/change_component.scss';
import {FormElement} from "@entity/connection/components/decorators/FormElement";
import DropdownMenu from "./dropdown_menu/DropdownMenu";
import Items from "./Items";
import Draft from "@change_component/form_elements/form_connection/form_methods/Draft";
import {LocalStorage} from "@application/classes/LocalStorage";


function mapStateToProps(state){
    const authUser = state.authReducer.authUser;
    return{
        authUser,
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
        const storage = LocalStorage.getStorage();
        storage.set(`${entity.fromConnector.invoker.name}&${entity.toConnector.invoker.name}`, JSON.stringify(entity.getObject()));
        if(e === null) {
            updateEntity(entity);
        } else{
            updateEntity(e);
        }
    }

    render(){
        const {entity, data, isDraft, noMethodTitle} = this.props;
        const {readOnly} = data;
        let {tourSteps} = data;
        let tourClassNames = [];
        if(tourSteps && tourSteps.length > 0){
            for(let i = 0; i < tourSteps.length; i++){
                tourClassNames.push(tourSteps[i].selector.substr(1));
            }
        }
        /*
        * TODO: uncomment AddParam when backend will be ready
        */
        return (
            <div style={{margin: '0 65px', padding: '20px 0'}}>
                {!readOnly &&
                    <React.Fragment>
                        <Draft connection={entity} updateEntity={(a) => this.updateEntity(a)}/>
                        <div style={{float: 'right'}}>
                            {/*<AddTemplate data={data} entity={entity} authUser={authUser}/>*/}
                            {/*<AddParam data={data} entity={entity} authUser={authUser}/>*/}
                        </div>
                    </React.Fragment>
                }
                <div>
                    <div className={tourClassNames[0] ? tourClassNames[0] : ''}>
                        {!noMethodTitle &&
                            <React.Fragment>
                                <hr noshade="noshade" size="1" style={{marginTop: '56px'}} color={"#f0f0f0"}/>
                                <div className={styles.mapping_methods}>Methods</div>
                            </React.Fragment>
                        }
                        <Row>
                            <Col xl={5} lg={5} md={6} sm={6} className={`${styles.form_select_method}`}>
                                <Items
                                    isDraft={isDraft}
                                    readOnly={readOnly}
                                    connection={entity}
                                    connector={entity.fromConnector}
                                    updateEntity={(a) => this.updateEntity(a)}
                                />
                                {!readOnly &&
                                    <DropdownMenu
                                        readOnly={readOnly}
                                        connection={entity}
                                        connector={entity.fromConnector}
                                        updateEntity={(a) => this.updateEntity(a)}
                                    />
                                }
                            </Col>
                            <Col offset={{xl: 2, lg: 2}} xl={5} lg={5} md={6} sm={6} className={`${styles.form_select_method}`}>
                                <Items
                                    isDraft={isDraft}
                                    readOnly={readOnly}
                                    connection={entity}
                                    connector={entity.toConnector}
                                    updateEntity={(a) => this.updateEntity(a)}
                                />
                                {!readOnly &&
                                    <DropdownMenu
                                        readOnly={readOnly}
                                        connection={entity}
                                        connector={entity.toConnector}
                                        updateEntity={(a) => this.updateEntity(a)}
                                    />
                                }
                            </Col>
                        </Row>
                    </div>
                </div>
            </div>
        );
    }
}

FormMethods.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};

FormMethods.defaultProps = {
    isDraft: false,
    noMethodTitle: false,
};


export default FormMethods;