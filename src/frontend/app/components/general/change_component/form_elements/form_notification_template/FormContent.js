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

import React, {Component} from 'react';
import {connect} from 'react-redux';
import FormSubject from "./FormSubject";
import Accordion from "react-bootstrap/Accordion";
import Card from "react-bootstrap/Card";
import FormBody from "./FormBody";
import CContent from "@classes/components/content/schedule/notification/CContent";


function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}
/*
* TODO: replace languages on real data
*/
const languages = ['en'];

/**
 * Component for Content
 */
@connect(mapStateToProps, {})
class FormContent extends Component{

    constructor(props){
        super(props);

        this.state = {
            newContentItem: CContent.createContent(),
        };
    }

    updateEntity(contentItem){
        let {entity, updateEntity} = this.props;
        entity.changeContentByLanguage(contentItem);
        updateEntity(entity);
    }

    updateNewContent(contentItem){
        this.setState({contentItem});
    }

    renderContent(){
        return this.props.entity.content.map(contentItem => {
            let language = contentItem.language;
            return(
                <div>
                    <Accordion.Toggle as={Card.Header} eventKey={language}>
                        <span>{language}</span>
                    </Accordion.Toggle>
                    <Accordion.Collapse eventKey={language} >
                        <Card.Body>
                            <FormSubject {...this.props} contentItem={contentItem} updateEntity={::this.updateEntity} />
                            <FormBody {...this.props} contentItem={contentItem} updateEntity={::this.updateEntity} />
                        </Card.Body>
                    </Accordion.Collapse>
                </div>
            );
        });
    }

    renderAdd(){
        const {newContentItem} = this.state;
        return(
            <div>
                <Accordion.Toggle as={Card.Header} eventKey={'add_new_content_item'}>
                    <span>{newContentItem.language}</span>
                </Accordion.Toggle>
                <Accordion.Collapse eventKey={'add_new_content_item'} >
                    <Card.Body>
                        <FormSubject {...this.props} contentItem={newContentItem} updateEntity={::this.updateNewContent} />
                        <FormBody {...this.props} contentItem={newContentItem} updateEntity={::this.updateNewContent} />
                    </Card.Body>
                </Accordion.Collapse>
            </div>
        );
    }

    /*
    * TODO: remove language check for multilanguages
    */
    render(){
        const {newContentItem} = this.state;
        const {entity} = this.props;
        if(languages.length === 1){
            return(
                <div>
                    <FormSubject {...this.props} contentItem={entity.content.length === 0 ? newContentItem : entity.content[0]} updateEntity={entity.content.length === 0 ? ::this.updateNewContent : ::this.updateEntity} />
                    <FormBody {...this.props} contentItem={entity.content.length === 0 ? newContentItem : entity.content[0]} updateEntity={entity.content.length === 0 ? ::this.updateNewContent : ::this.updateEntity} />
                </div>
            );
        }
        return (
            <Accordion defaultActiveKey={'add_new_content_item'}>
                {this.renderContent()}
                {this.renderAdd()}
            </Accordion>
        );
    }
}

export default FormContent;