/*
 * Copyright (C) <2021>  <becon GmbH>
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

import React, {Component, Suspense} from 'react';
import {connect} from 'react-redux';
import {Container} from 'react-grid-system';

import Loading from '@loading';
import ComponentError from "../../general/app/ComponentError";
import {ERROR_TYPE} from "@utils/constants/app";
import ViewHeader from "@components/general/view_component/Header";
import {fetchConditionalOperator} from "@actions/global_conditional_operators/fetch";
import {updateConditionalOperator} from "@actions/global_conditional_operators/update";
import Input from "@basic_components/inputs/Input";
import Button from "@basic_components/buttons/Button";

function mapStateToProps(state){
    const conditionalOperator = state.get('conditional_operator');
    return{
        currentConditionalOperator: conditionalOperator.get('currentConditionalOperator'),
        fetchingConditionalOperator: conditionalOperator.get('fetchingConditionalOperator'),
        updatingConditionalOperator: conditionalOperator.get('updatingConditionalOperator'),
    }
}

/**
 * Layout for GlobalConditionalOperators
 */
@connect(mapStateToProps, {fetchConditionalOperator, updateConditionalOperator})
class GlobalConditionalOperators extends Component{

    constructor(props){
        super(props);

        this.state = {
            value: '',
        }
    }

    componentDidMount() {
        this.props.fetchConditionalOperator();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(prevProps.currentConditionalOperator !== this.props.currentConditionalOperator){
            this.setState({
                value: this.props.currentConditionalOperator,
            })
        }
    }

    changeValue(value){
        this.setState({value});
    }

    save(){
        this.props.currentConditionalOperator({name: 'ContainsInOCList', value: this.state.value});
    }

    render(){
        const {value} = this.state;
        let header = {title: 'Global Conditional Operators', breadcrumbs: [{link: '/admin_cards', text: 'Admin Cards'}],};
        return (
            <Container>
                <Suspense fallback={(<Loading/>)}>
                    <ComponentError entity={{type: ERROR_TYPE.FRONTEND, name: this.constructor.name}}>
                        <ViewHeader header={header}/>
                        <div>ContainsInOCList</div>
                        <Input value={value} label={'List'} onChange={::this.changeValue}/>
                        <Button title={'Save'} onClick={::this.save} style={{float: 'right'}}/>
                    </ComponentError>
                </Suspense>
            </Container>
        );
    }
}

export default GlobalConditionalOperators;