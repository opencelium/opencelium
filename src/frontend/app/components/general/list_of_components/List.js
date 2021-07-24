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
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import { withRouter } from 'react-router';
import { Container, Row, Col } from "react-grid-system";

import ListHeader from './Header';
import Card from './Card';
import Pagination from "@basic_components/pagination/Pagination";
import CardError from "./CardError";
import AddButton from "./AddButton";
import {setCurrentPageItems} from "@actions/app";
import {
    addAddEntityKeyNavigation,
    addDeleteCardKeyNavigation,
    addSelectCardKeyNavigation,
    addUpdateCardKeyNavigation,
    addGraphCardKeyNavigation,
    addViewCardKeyNavigation,
    removeAddEntityKeyNavigation,
    removeDeleteCardKeyNavigation,
    removeSelectCardKeyNavigation,
    removeGraphCardKeyNavigation,
    addEnterKeyNavigation,
    removeEnterKeyNavigation,
    removeUpdateCardKeyNavigation,
    removeViewCardKeyNavigation,
    switchUserListKeyNavigation,
    addFocusDocumentNavigation,
    removeFocusDocumentNavigation,
} from "@utils/key_navigation";
import {
    componentAppear,
    getThemeClass,
    isString,
    searchByNameFunction,
    setFocusById,
    sortByNameFunction
} from "@utils/app";
import styles from '@themes/default/general/list_of_components.scss';
import Input from "@basic_components/inputs/Input";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import GridViewMenu from "@components/general/list_of_components/GridViewMenu";
import ListView from "@components/general/list_of_components/ListView";


const AMOUNT_OF_ROWS = 3;

const AMOUNT_OF_ITEMS_FOR_LIST = 10;

const VIEW_TYPE = {
    LIST: 'LIST',
    GRID: 'GRID',
};

function mapStateToProps(state){
    const app = state.get('app');
    return {
        currentPageItems: app.get('currentPageItems').toJS(),
    };
}
/**
 * List Component
 */
@connect(mapStateToProps, {setCurrentPageItems})
class List extends Component{

    constructor(props){
        super(props);

        this.state = {
            viewType: VIEW_TYPE.GRID,
            selectedCard: -1,
            keyNavigateType: '',
            isPressedAddEntity: false,
            searchValue: '',
            gridViewType: '4',
            entitiesProPage: 4 * AMOUNT_OF_ROWS,
        };
    }

    componentDidMount(){
        const {mapEntity} = this.props;
        this.setCurrentPageItems();
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
        addFocusDocumentNavigation(this);
        document.addEventListener('mousedown', ::this.onMouseDownOnDocument)
        setFocusById('search_field');
        componentAppear('app_list');
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
        document.removeEventListener('mousedown', ::this.onMouseDownOnDocument)
        removeFocusDocumentNavigation(this);
        switchUserListKeyNavigation(false);
    }

    componentDidUpdate(prevProps){
        if(this.props.page.pageNumber !== prevProps.page.pageNumber || this.props.entities.length !== prevProps.entities.length
            || this.props.rerenderDependency !== prevProps.rerenderDependency){
            this.setCurrentPageItems();
        }
        for(let dependency in prevProps.mapDependencies){
            if(prevProps.mapDependencies[dependency] !== this.props.mapDependencies[dependency]){
                this.setCurrentPageItems();
                break;
            }
        }
    }

    onMouseDownOnDocument(){
        if(this.state.selectedCard !== -1){
            this.setState({
                selectedCard: -1,
                keyNavigateType: '',
            });
        }
    }

    setGridViewType(type){
        switchUserListKeyNavigation(false);
        this.setState({
            viewType: VIEW_TYPE.GRID,
            gridViewType: `${type}`,
            entitiesProPage: parseInt(type) * AMOUNT_OF_ROWS,
            selectedCard: -1,
            keyNavigateType: '',
        }, this.setCurrentPageItems);
    }

    setListView(){
        const {mapListViewData} = this.props;
        switchUserListKeyNavigation(false);
        if(mapListViewData) {
            this.setState({
                viewType: VIEW_TYPE.LIST,
                entitiesProPage: AMOUNT_OF_ITEMS_FOR_LIST,
                selectedCard: -1,
                keyNavigateType: '',
            }, this.setCurrentPageItems);
        }
    }

    changeSearchValue(searchValue){
        this.setState({searchValue}, () => {
            this.setCurrentPageItems();
            this.props.router.push(this.props.page.link + '1');
        });
    }

    setCurrentPageItems(){
        const {mapEntity, setCurrentPageItems} = this.props;
        let filteredEntities = this.filterEntities().map((entity, key) => {let data = entity.getObject ? entity.getObject() : entity; return {...data, mappedEntity: mapEntity.map(entity, key)};});
        setCurrentPageItems(filteredEntities);
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
        const {entitiesProPage} = this.state;
        const {entities} = this.props;
        let max = entities.length < entitiesProPage ? entities.length : entitiesProPage;
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
    selectCard(arrowDirection){
        const {entitiesProPage} = this.state;
        const {entities} = this.props;
        let gridViewType = parseInt(this.state.gridViewType);
        let {selectedCard} = this.state;
        let max = entities.length < entitiesProPage ? entities.length : entitiesProPage;
        switch(arrowDirection){
            case 'cancel':
                selectedCard = -1;
                break;
            case 'left':
                if(selectedCard === -1){
                    selectedCard = 0;
                } else{
                    selectedCard = selectedCard === 0 ? 0 : selectedCard - 1;
                }
                break;
            case 'top':
                if(selectedCard === -1){
                    selectedCard = 0;
                } else{
                    selectedCard = selectedCard - gridViewType < 0 ? selectedCard : selectedCard - gridViewType;
                }
                break;
            case 'right':
                if(selectedCard === -1){
                    selectedCard = 0;
                } else{
                    selectedCard = selectedCard === max - 1 ? selectedCard : selectedCard + 1;
                }
                break;
            case 'bottom':
                if(selectedCard === -1){
                    selectedCard = 0;
                } else{
                    selectedCard = selectedCard + gridViewType >= max ? selectedCard : selectedCard + gridViewType;
                }
                break;

        }
        if(selectedCard !== -1){
            switchUserListKeyNavigation(true);
        } else{
            switchUserListKeyNavigation(false);
        }
        if(selectedCard >= max){
            selectedCard = max - 1;
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
        const {entitiesProPage} = this.state;
        const {entities} = this.props;
        let {pageNumber} = this.props.page;
        if(entities.length === 0){
            return [];
        }
        if(typeof pageNumber === 'undefined'){
            pageNumber = 1;
        }
        return this.sortEntities().filter((entity, key) => {
            if(key >= (pageNumber - 1)*entitiesProPage && key <= pageNumber*entitiesProPage - 1) {
                return entity;
            }
        });
    }

    render(){
        const {mapEntity, entities, setTotalPages, exceptionEntities, permissions, authUser, load, containerStyles, noSearchField, currentPageItems, mapListViewData} = this.props;
        const {selectedCard, keyNavigateType, isPressedAddEntity, searchValue, gridViewType, entitiesProPage, viewType} = this.state;
        let {page, translations} = this.props;
        let classNames = ['empty_list', 'search_field'];
        classNames = getThemeClass({classNames, authUser, styles});
        page.entitiesLength = this.searchEntities().length;
        let listViewData = [];
        if(viewType === VIEW_TYPE.LIST){
            listViewData = currentPageItems.map(item => mapListViewData(item));
        }
        const isListViewIconDisabled = !(mapListViewData);
        const listViewDataHeader = listViewData.length > 0 ? listViewData[0].map(element => {return {value: element.name, width: element.width};}) : [];
        return(
            <Row id={'app_list'}>
                <Col sm={12}>
                    <div style={{...containerStyles, marginBottom: '70px'}}>
                        <ListHeader header={translations.header}/>
                        <div style={{display: 'flex'}}>
                            {
                                mapEntity.hasOwnProperty('getAddLink') ?
                                    <AddButton
                                        hasTour={translations.header.hasOwnProperty('onHelpClick')}
                                        title={<span>{translations.add_button}</span>}
                                        link={mapEntity.getAddLink}
                                        isPressedAddEntity={isPressedAddEntity}
                                        permission={permissions.CREATE}
                                        authUser={authUser}
                                    />
                                    :
                                    mapEntity.hasOwnProperty('AddButton') &&
                                    <mapEntity.AddButton/>
                            }
                            {
                                mapEntity.hasOwnProperty('AdditionalButton') && mapEntity.AdditionalButton
                            }
                            {
                                entities.length > 0 && !noSearchField &&
                                <div className={`${styles[classNames.search_field]} tour-step-search-1`}>
                                    <Input value={searchValue} onChange={::this.changeSearchValue} label={'Search field'} id={'search_field'}/>
                                </div>
                            }
                            {
                                entities.length > 0 &&
                                    <span className={styles.list_view_icon}>
                                        <TooltipFontIcon onClick={::this.setListView} tooltip={'List View'} value={'view_list'} isButton={true} turquoiseTheme disabled={isListViewIconDisabled}/>
                                        <GridViewMenu setGridViewType={::this.setGridViewType}/>
                                    </span>
                            }
                        </div>
                        {viewType === VIEW_TYPE.LIST && <ListView items={listViewData} header={listViewDataHeader} mapEntity={mapEntity}/>}
                        {viewType === VIEW_TYPE.GRID &&
                            <div className={styles.grid_view}>
                                {
                                    currentPageItems.length > 0
                                        ?
                                        currentPageItems.map((entity, key) => {
                                            let viewLink = mapEntity.hasOwnProperty('getViewLink') ? mapEntity.getViewLink(entity) : '';
                                            let updateLink = mapEntity.hasOwnProperty('getUpdateLink') ? mapEntity.getUpdateLink(entity) : '';
                                            let graphLink = mapEntity.hasOwnProperty('getGraphLink') ? mapEntity.getGraphLink(entity) : '';
                                            let onCardClickLink = mapEntity.hasOwnProperty('getOnCardClickLink') ? mapEntity.getOnCardClickLink(entity.mappedEntity) : '';
                                            let onDelete = mapEntity.hasOwnProperty('onDelete') ? mapEntity.onDelete : null;
                                            let hasView = isString(viewLink) && viewLink !== '';
                                            let hasUpdate = isString(updateLink) && updateLink !== '';
                                            let hasGraph = isString(graphLink) && graphLink !== '';
                                            let hasDelete = onDelete !== null;
                                            let isSelectedCard = false;
                                            if (selectedCard === key) {
                                                isSelectedCard = true;
                                            }
                                            return (
                                                <div key={key} className={styles[`cards_item_grid_view_${gridViewType}`]}>
                                                    <CardError>
                                                        <Card
                                                            hasTour={translations.header.hasOwnProperty('onHelpClick') && (key === 0 || key === 1)}
                                                            index={key}
                                                            keyNavigateType={keyNavigateType}
                                                            entity={entity.mappedEntity}
                                                            isException={exceptionEntities.exceptions.indexOf(entity.mappedEntity.id) !== -1}
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
                                                            isButton={onCardClickLink !== ''}
                                                        />
                                                    </CardError>
                                                </div>
                                            );
                                        })
                                        :

                                        <div>
                                            <span className={styles[classNames.empty_list]}>
                                                {this.props.translations.empty_list}
                                            </span>
                                        </div>
                                }
                            </div>
                        }
                        <Pagination page={page} setTotalPages={setTotalPages} entitiesProPage={entitiesProPage}/>
                    </div>
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
    mapDependencies: PropTypes.object,
};

List.defaultProps = {
    exceptionEntities: {label: '', exceptions: []},
    load: null,
    containerStyles: {},
    noSearchField: false,
    mapDependencies: {},
};

export default withRouter(List);