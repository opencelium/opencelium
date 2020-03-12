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
import { Container, Row, Col } from "react-grid-system";

import ListHeader from './Header';
import Card from './Card';
import Pagination, {ENTITIES_PRO_PAGE} from "../../general/basic_components/pagination/Pagination";
import CardError from "./CardError";
import AddButton from "./AddButton";
import {
    addAddEntityKeyNavigation,
    addDeleteCardKeyNavigation, addSelectCardKeyNavigation, addUpdateCardKeyNavigation, addGraphCardKeyNavigation,
    addViewCardKeyNavigation, removeAddEntityKeyNavigation, removeDeleteCardKeyNavigation,
    removeSelectCardKeyNavigation, removeGraphCardKeyNavigation, addEnterKeyNavigation, removeEnterKeyNavigation,
    removeUpdateCardKeyNavigation, removeViewCardKeyNavigation, switchUserListKeyNavigation,
} from "../../../utils/key_navigation";
import {getThemeClass, isString, searchByNameFunction, sortByNameFunction} from "../../../utils/app";
import styles from '../../../themes/default/general/list_of_components.scss';
import Input from "../basic_components/inputs/Input";


/**
 * List Component
 */
class List extends Component{

    constructor(props){
        super(props);

        this.state = {
            selectedCard: -1,
            keyNavigateType: '',
            isPressedAddEntity: false,
            searchValue: '',
        };
    }

    componentDidMount(){
        const {mapEntity} = this.props;
        addSelectCardKeyNavigation(this);
        if(this.hasNoActions()){
            addEnterKeyNavigation(this);
        }
        if(mapEntity.hasOwnProperty('getViewLink')) {
            addViewCardKeyNavigation(this);
        }
        if(mapEntity.hasOwnProperty('getUpdateLink')) {
            addUpdateCardKeyNavigation(this);
        }
        if(mapEntity.hasOwnProperty('getGraphLink')) {
            addGraphCardKeyNavigation(this);
        }
        if(mapEntity.hasOwnProperty('onDelete')) {
            addDeleteCardKeyNavigation(this);
        }
        if(mapEntity.hasOwnProperty('getAddLink')) {
            addAddEntityKeyNavigation(this);
        }
        setTimeout(function(){
            const app_list = document.getElementById("app_list");
            if(app_list !== null) {
                app_list.style.opacity = 1;
            }
        }, 500);
    }

    componentWillUnmount(){
        const {mapEntity} = this.props;
        removeSelectCardKeyNavigation(this);
        if(this.hasNoActions()){
            removeEnterKeyNavigation(this);
        }
        if(mapEntity.hasOwnProperty('getViewLink')) {
            removeViewCardKeyNavigation(this);
        }
        if(mapEntity.hasOwnProperty('getUpdateLink')) {
            removeUpdateCardKeyNavigation(this);
        }
        if(mapEntity.hasOwnProperty('getGraphLink')) {
            removeGraphCardKeyNavigation(this);
        }
        if(mapEntity.hasOwnProperty('onDelete')) {
            removeDeleteCardKeyNavigation(this);
        }
        if(mapEntity.hasOwnProperty('getAddLink')) {
            removeAddEntityKeyNavigation(this);
        }
        switchUserListKeyNavigation(false);
    }

    changeSearchValue(searchValue){
        this.setState({searchValue});
    }

    /**
     * to check if entity has actions
     */
    hasNoActions(){
        const {mapEntity} = this.props;
        return !mapEntity.hasOwnProperty('getViewLink') && !mapEntity.hasOwnProperty('getUpdateLink') && !mapEntity.hasOwnProperty('getGraphLink') && !mapEntity.hasOwnProperty('onDelete');
    }

    /**
     * to add entity
     */
    addEntity(){
        this.setState({isPressedAddEntity: true});
    }

    /**
     * to set keyNavigateType state
     */
    keyNavigate(type){
        const {entities} = this.props;
        let max = entities.length < ENTITIES_PRO_PAGE ? entities.length : ENTITIES_PRO_PAGE;
        if(this.state.selectedCard > -1 && this.state.selectedCard < max) {
            switch (type) {
                case 'enter':
                    this.setState({keyNavigateType: 'enter'});
                    break;
                case 'view':
                    this.setState({keyNavigateType: 'view'});
                    break;
                case 'update':
                    this.setState({keyNavigateType: 'update'});
                    break;
                case 'graph':
                    this.setState({keyNavigateType: 'graph'});
                    break;
                case 'delete':
                    this.setState({keyNavigateType: 'delete'});
                    break;
                default:
                    this.setState({keyNavigateType: ''});
                    break;
            }
        }
    }

    /**
     * cardNumber from 0
     * to set selectedCard
     */
    selectCard(cardNumber){
        const {entities} = this.props;
        let selectedCard = -1;
        let max = entities.length < ENTITIES_PRO_PAGE ? entities.length : ENTITIES_PRO_PAGE;
        if(cardNumber >= 0 && cardNumber < max){
            selectedCard = cardNumber;
            switchUserListKeyNavigation(true);
        }
        if(selectedCard === -1){
            switchUserListKeyNavigation(false);
        }
        this.setState({selectedCard, keyNavigateType: ''});
    }

    /**
     * to sort entities by name/title
     */
    searchEntities(){
        const {searchValue} = this.state;
        const {entities} = this.props;
        let result = entities.filter((value) => searchByNameFunction(value, searchValue));
        return result;
    }

    /**
     * to sort entities by name/title
     */
    sortEntities(){
        let result = this.searchEntities();
        if(result.length > 1){
            result = result.sort(sortByNameFunction);
        }
        return result;
    }

    /**
     * to filter entities depending of the page
     */
    filterEntities(){
        const {entities} = this.props;
        let {pageNumber} = this.props.page;
        if(entities.length === 0){
            return [];
        }
        if(typeof pageNumber === 'undefined'){
            pageNumber = 1;
        }
        return this.sortEntities().filter((entity, key) => {
            if(key >= (pageNumber - 1)*ENTITIES_PRO_PAGE && key <= pageNumber*ENTITIES_PRO_PAGE - 1) {
                return entity;
            }
        });
    }

    render(){
        const {mapEntity, entities, setTotalPages, exceptionEntities, permissions, authUser, load, containerStyles, noSearchField} = this.props;
        const {selectedCard, keyNavigateType, isPressedAddEntity, searchValue} = this.state;
        let {page, translations} = this.props;
        let classNames = ['empty_list'];
        let filteredEntities = this.filterEntities();
        classNames = getThemeClass({classNames, authUser, styles});
        page.entitiesLength = this.searchEntities().length;
        return(
            <Row id={'app_list'}>
                <Col xl={8} lg={10} md={12} sm={12} offset={{ xl: 2, lg: 1 }} >
                    <Container style={containerStyles} style={{marginBottom: '70px'}}>
                        <ListHeader header={translations.header} authUser={authUser}/>
                        {
                            entities.length > 0 && !noSearchField
                            ?
                                <div className={'tour-step-search-1'}>
                                    <Input value={searchValue} onChange={::this.changeSearchValue} label={'Search field'}/>
                                </div>
                            :
                                null
                        }
                        <Row>
                            {
                                filteredEntities.length > 0
                                    ?
                                        filteredEntities.map((entity, key) => {
                                            let mappedEntity = mapEntity.map(entity);
                                            let viewLink = mapEntity.hasOwnProperty('getViewLink') ? mapEntity.getViewLink(entity) : '';
                                            let updateLink = mapEntity.hasOwnProperty('getUpdateLink') ? mapEntity.getUpdateLink(entity) : '';
                                            let graphLink = mapEntity.hasOwnProperty('getGraphLink') ? mapEntity.getGraphLink(entity) : '';
                                            let onCardClickLink = mapEntity.hasOwnProperty('getOnCardClickLink') ? mapEntity.getOnCardClickLink(entity) : '';
                                            let onDelete = mapEntity.hasOwnProperty('onDelete') ? mapEntity.onDelete : null;
                                            let hasView = isString(viewLink) && viewLink !== '';
                                            let hasUpdate = isString(updateLink) && updateLink !== '';
                                            let hasGraph = isString(graphLink) && graphLink !== '';
                                            let hasDelete = onDelete !== null;
                                            let isSelectedCard = false;
                                            if(selectedCard === key){
                                                isSelectedCard = true;
                                            }
                                            return (
                                                <Col xs={12} sm={6} key={key}>
                                                    <CardError>
                                                        <Card
                                                            hasTour={translations.header.hasOwnProperty('onHelpClick') && (key === 0 || key === 1)}
                                                            index={key}
                                                            keyNavigateType={keyNavigateType}
                                                            entity={mappedEntity}
                                                            isException={exceptionEntities.exceptions.indexOf(mappedEntity.id) !== -1}
                                                            exceptionLabel={exceptionEntities.label}
                                                            viewLink={viewLink}
                                                            updateLink={updateLink}
                                                            graphLink={graphLink}
                                                            onDelete={onDelete}
                                                            isSelectedCard={isSelectedCard}
                                                            permissions={permissions}
                                                            authUser={authUser}
                                                            hasView={hasView}
                                                            hasUpdate={hasUpdate}
                                                            hasGraph={hasGraph}
                                                            hasDelete={hasDelete}
                                                            onCardClickLink={onCardClickLink}
                                                            keyNavigate={::this.keyNavigate}
                                                            load={load}
                                                        />
                                                    </CardError>
                                                </Col>
                                            );
                                        })
                                    :

                                    <Col xs={12} sm={6}>
                                        <span className={styles[classNames.empty_list]}>{this.props.translations.empty_list}</span>
                                    </Col>
                            }
                        </Row>
                        <Pagination page={page} setTotalPages={setTotalPages}/>
                        {
                            mapEntity.hasOwnProperty('getAddLink') ?
                                <AddButton
                                    hasTour={translations.header.hasOwnProperty('onHelpClick')}
                                    title={translations.add_button}
                                    link={mapEntity.getAddLink}
                                    isPressedAddEntity={isPressedAddEntity}
                                    permission={permissions.CREATE}
                                    authUser={authUser}
                                />
                                :
                                    mapEntity.hasOwnProperty('getAddComponent') ?
                                        <mapEntity.getAddComponent/>
                                    :
                                        null
                        }
                    </Container>
                </Col>
            </Row>
        );
    }
}

List.propTypes = {
    authUser: PropTypes.object.isRequired,
    entities: PropTypes.array.isRequired,
    exceptionEntities: PropTypes.object,
    permissions: PropTypes.object.isRequired,
    load: PropTypes.object,
    containerStyles: PropTypes.object,
    noSearchField: PropTypes.bool,
};

List.defaultProps = {
    exceptionEntities: {label: '', exceptions: []},
    load: null,
    containerStyles: {},
    noSearchField: false,
};

export default List;