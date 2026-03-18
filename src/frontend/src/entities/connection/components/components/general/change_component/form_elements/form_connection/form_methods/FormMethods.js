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

        this.handleUpdateEntity = this.updateEntity.bind(this);
    }

    shouldComponentUpdate(nextProps) {
        return (
            nextProps.entity !== this.props.entity ||
            nextProps.data !== this.props.data ||
            nextProps.isDraft !== this.props.isDraft ||
            nextProps.noMethodTitle !== this.props.noMethodTitle ||
            nextProps.authUser !== this.props.authUser
        );
    }

    /**
     * to update entity
     */
    updateEntity(e = null){
        const {entity, updateEntity} = this.props;
        const storage = LocalStorage.getStorage();
        storage.set(
            `${entity.fromConnector.invoker.name}&${entity.toConnector.invoker.name}`,
            JSON.stringify(entity.getObject())
        );

        if(e === null) {
            updateEntity(entity);
        } else{
            updateEntity(e);
        }
    }

    getTourClassName(tourSteps){
        if (!tourSteps || tourSteps.length === 0) {
            return '';
        }

        const firstStep = tourSteps[0];
        if (!firstStep || !firstStep.selector) {
            return '';
        }

        return firstStep.selector.substr(1);
    }

    renderConnectorColumn(connector, readOnly, isDraft, withOffset = false) {
        return (
            <Col
                offset={withOffset ? {xl: 2, lg: 2} : undefined}
                xl={5}
                lg={5}
                md={6}
                sm={6}
                className={styles.form_select_method}
            >
                <Items
                    isDraft={isDraft}
                    readOnly={readOnly}
                    connection={this.props.entity}
                    connector={connector}
                    updateEntity={this.handleUpdateEntity}
                />
                {!readOnly &&
                    <DropdownMenu
                        readOnly={readOnly}
                        connection={this.props.entity}
                        connector={connector}
                        updateEntity={this.handleUpdateEntity}
                    />
                }
            </Col>
        );
    }

    render(){
        const {entity, data, isDraft, noMethodTitle} = this.props;
        const {readOnly, tourSteps} = data;
        const tourClassName = this.getTourClassName(tourSteps);

        /*
        * TODO: uncomment AddParam when backend will be ready
        */
        return (
            <div style={{margin: '0 65px', padding: '20px 0'}}>
                {!readOnly &&
                    <React.Fragment>
                        <Draft connection={entity} updateEntity={this.handleUpdateEntity}/>
                        <div style={{float: 'right'}}>
                            {/*<AddTemplate data={data} entity={entity} authUser={authUser}/>*/}
                            {/*<AddParam data={data} entity={entity} authUser={authUser}/>*/}
                        </div>
                    </React.Fragment>
                }
                <div>
                    <div className={tourClassName}>
                        {!noMethodTitle &&
                            <React.Fragment>
                                <hr noshade="noshade" size="1" style={{marginTop: '56px'}} color={"#f0f0f0"}/>
                                <div className={styles.mapping_methods}>Methods</div>
                            </React.Fragment>
                        }
                        <Row>
                            {this.renderConnectorColumn(entity.fromConnector, readOnly, isDraft, false)}
                            {this.renderConnectorColumn(entity.toConnector, readOnly, isDraft, true)}
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