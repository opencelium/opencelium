/*
 * Copyright (C) <2019>  <becon GmbH>
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

import Name from "./Name";
import Endpoint from "./Endpoint";
import Method from "./Method";
import Header from "./Header";
import Body from "./Body";
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import CInvoker from "../../../../../../classes/components/content/invoker/CInvoker";
import COperation from "../../../../../../classes/components/content/invoker/COperation";
import Status from "./Status";

class OperationItem extends Component{

    constructor(props){
        super(props);

        this.state = {
            tabKey: 'request',
        };
    }

    static getDerivedStateFromProps(props){
        if(props.justAdded){
            return {
                tabKey: 'request',
            };
        }
        return null;
    }

    handleTabChange(tabKey){
        this.setState({tabKey});
    }

    render(){
        const {operation, className, data, hasTour} = this.props;
        const {tourSteps} = data;
        let tourClassNames = [];
        if(hasTour && tourSteps && tourSteps.length > 0){
            for(let i = 0; i < tourSteps.length; i++){
                tourClassNames.push(tourSteps[i].selector.substr(1));
            }
        }
        return (
            <div className={className}>
                <Name {...this.props} tourStep={tourClassNames[0] ? tourClassNames[0] : ''}/>
                <Endpoint {...this.props} tourStep={tourClassNames[1] ? tourClassNames[1] : ''}/>
                <Method {...this.props} tourStep={tourClassNames[2] ? tourClassNames[2] : ''}/>
                <Tabs activeKey={this.state.tabKey} onSelect={::this.handleTabChange} className={tourClassNames[3] ? tourClassNames[3] : ''}>
                    <Tab title='Request' eventKey={'request'}>
                        <Header {...this.props} entity={operation.request} headerType={'request'} tourStep={tourClassNames[4] ? tourClassNames[4] : ''}/>
                        <Body {...this.props} entity={operation.request} bodyType={'request'} tourStep={tourClassNames[5] ? tourClassNames[5] : ''}/>
                    </Tab>
                    <Tab title='Response(success)' eventKey={'response_success'}>
                        <Status {...this.props} entity={operation.response.success} headerType={'response_success'}/>
                        <Header {...this.props} entity={operation.response.success} headerType={'response_success'}/>
                        <Body {...this.props} entity={operation.response.success} headerType={'response_success'}/>
                    </Tab>
                    <Tab title='Response(fail)' eventKey={'response_fail'}>
                        <Status {...this.props} entity={operation.response.fail} headerType={'response_fail'}/>
                        <Header {...this.props} entity={operation.response.fail} headerType={'response_fail'}/>
                        <Body {...this.props} entity={operation.response.fail} bodyType={'response_fail'}/>
                    </Tab>
                </Tabs>
            </div>
        );
    }
}

OperationItem.propTypes = {
    index: PropTypes.number,
    invoker: PropTypes.instanceOf(CInvoker).isRequired,
    operation: PropTypes.instanceOf(COperation).isRequired,
};

OperationItem.defaultProps = {
    index: -1,
    className: '',
    hasTour: false,
    justAdded: false,
};

export default OperationItem;