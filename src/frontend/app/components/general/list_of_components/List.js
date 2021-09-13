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
import { Row, Col } from "react-grid-system";

import ListHeader from './Header';
import Card from './Card';
import Pagination from "@basic_components/pagination/Pagination";
import AddButton from "./AddButton";
import {setCurrentPageItems, setViewType, setGridViewType, setSearchValue} from "@actions/app";
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
    ascSortByNameFunction,
    componentAppear, descSortByNameFunction, formatHtmlId,
    getThemeClass,
    isString,
    searchByNameFunction,
    setFocusById,
} from "@utils/app";
import styles from '@themes/default/general/list_of_components.scss';
import Input from "@basic_components/inputs/Input";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import GridViewMenu from "@components/general/list_of_components/GridViewMenu";
import ListView from "@components/general/list_of_components/ListView";
import Button from "@basic_components/buttons/Button";
import {NO_NEED_PERMISSION} from "@utils/constants/permissions";
import {CSearch} from "@classes/components/general/CSearch";


const AMOUNT_OF_ROWS = 3;

const AMOUNT_OF_ITEMS_FOR_LIST = 10;

export const VIEW_TYPE = {
    LIST: 'LIST',
    GRID: 'GRID',
};

function mapStateToProps(state){
    const app = state.get('app');
    return {
        viewType: app.get('viewType'),
        searchValue: app.get('searchValue'),
        gridViewType: app.get('gridViewType'),
        currentPageItems: app.get('currentPageItems').toJS(),
    };
}
/**
 * List Component
 */
@connect(mapStateToProps, {setCurrentPageItems, setViewType, setGridViewType, setSearchValue})
class List extends Component{

    constructor(props){
        super(props);
        const viewType = props.viewTypeMust ? props.viewTypeMust : props.viewType;
        const gridViewType = props.gridViewType;
        this.state = {
            viewType,
            selectedCard: -1,
            keyNavigateType: '',
            isPressedAddEntity: false,
            searchValue: props.searchValue,
            gridViewType,
            entitiesProPage: viewType === VIEW_TYPE.LIST ? 10 : 4 * AMOUNT_OF_ROWS,
            checks: [],
            sortType: 'asc',
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
        this.props.setSearchValue('');
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

    componentDidUpdate(prevProps,prevState){
        if(this.props.page.pageNumber !== prevProps.page.pageNumber || this.props.entities.length !== prevProps.entities.length
            || this.props.rerenderDependency !== prevProps.rerenderDependency){
            this.setCurrentPageItems();
        }
        if(prevState.viewType !== this.state.viewType){
            this.props.setViewType(this.state.viewType);
        }
        if(prevState.gridViewType !== this.state.gridViewType){
            this.props.setGridViewType(this.state.gridViewType);
        }
        for(let dependency in prevProps.mapDependencies){
            if(prevProps.mapDependencies[dependency] !== this.props.mapDependencies[dependency]){
                this.setCurrentPageItems();
                break;
            }
        }
    }

    toggleSortType(){
        this.setState({
            sortType: this.state.sortType === 'asc' ? 'desc' : 'asc',
        }, ::this.setCurrentPageItems)
    }

    setChecks(checks){
        this.setState({
            checks,
        });
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
        //this.props.setViewType(VIEW_TYPE.GRID);
    }

    setListView(){
        const {listViewData} = this.props;
        switchUserListKeyNavigation(false);
        if(listViewData) {
            this.setState({
                viewType: VIEW_TYPE.LIST,
                entitiesProPage: AMOUNT_OF_ITEMS_FOR_LIST,
                selectedCard: -1,
                keyNavigateType: '',
            }, this.setCurrentPageItems);
            //this.props.setViewType(VIEW_TYPE.LIST);
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
        const {entities, componentName} = this.props;
        let result;
        if(componentName){
            const Search = new CSearch({searchValue, sources: {[componentName]: entities}, componentName: componentName});
            result = Search.getResults()[componentName];
        } else{
            result = entities.filter((value) => searchByNameFunction(value, searchValue));
        }
        return result;
    }

    /**
     * to sort entities by name/title
     */
    sortEntities(){
        const {sortType} = this.state;
        let result = this.searchEntities();
        if(result.length > 1){
            let sortFunction = sortType === 'asc' ? ascSortByNameFunction : descSortByNameFunction;
            result = result.sort(sortFunction);
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

    deleteSelected(){
        const {checks} = this.state;
        const {listViewData} = this.props;
        let entityIds = checks.filter(c => c.value);
        entityIds = entityIds.map(c => c.id);
        if(listViewData && listViewData.hasOwnProperty('deleteSelected')) {
            listViewData.deleteSelected({[listViewData.entityIdsName]: entityIds});
        }
    }

    isOneChecked(){
        let {checks} = this.state;
        for(let i = 0; i < checks.length; i++){
            if(checks[i].value){
                return true;
            }
        }
        return false;
    }

    render(){
        const {
            mapEntity, entities, setTotalPages, exceptionEntities, permissions, authUser, load, containerStyles,
            noSearchField, currentPageItems, listViewData, readOnly, deletingEntity,
        } = this.props;
        const {selectedCard, keyNavigateType, isPressedAddEntity, searchValue, gridViewType, entitiesProPage, viewType, sortType} = this.state;
        let {page, translations, hasDeleteSelectedButtons} = this.props;
        let classNames = ['empty_list', 'search_field'];
        classNames = getThemeClass({classNames, authUser, styles});
        page.entitiesLength = this.searchEntities().length;
        let listViewEntities = [];
        if(viewType === VIEW_TYPE.LIST && listViewData){
            listViewEntities = currentPageItems.map(item => listViewData.map(item, this));
        }
        const isListViewIconDisabled = !(listViewData);
        const listViewEntitiesHeader = listViewEntities.length > 0 ? listViewEntities[0].map(element => {return {label: element.label, value: element.name, width: element.width, visible: element.visible, style: element.style};}) : [];
        const entityIdName = listViewData ? listViewData.entityIdName : '';
        const actionsShouldBeMinimized = listViewData && listViewData.hasOwnProperty('actionsShouldBeMinimized') ? listViewData.actionsShouldBeMinimized : false;
        const renderListViewItemActions = listViewData && listViewData.hasOwnProperty('renderItemActions') ? (entity) => listViewData.renderItemActions(entity, ::this.setCurrentPageItems) : null;
        const isItemActionsBefore = listViewData && listViewData.hasOwnProperty('isItemActionsBefore') ? listViewData.isItemActionsBefore : false;
        const isDeleteSelectedButtonDisabled = !::this.isOneChecked();
        const hasAddButton = mapEntity.hasOwnProperty('getAddLink') || mapEntity.hasOwnProperty('AddButton');
        if(hasDeleteSelectedButtons){
            hasDeleteSelectedButtons = viewType === VIEW_TYPE.LIST;
        }
        const hasAdditionalButton = mapEntity.hasOwnProperty('AdditionalButton');
        const hasNoButtons = !hasAddButton && !hasDeleteSelectedButtons && !hasAdditionalButton;
        return(
            <Row id={'app_list'}>
                <Col sm={12}>
                    <div style={{...containerStyles, marginBottom: '50px'}}>
                        <ListHeader header={translations.header}/>
                        <div className={styles.action_panel}>
                            {
                                !readOnly &&
                                    mapEntity.hasOwnProperty('getAddLink')
                                    ?
                                        <AddButton
                                            hasTour={translations.header.hasOwnProperty('onHelpClick')}
                                            title={<span>{translations.add_button}</span>}
                                            link={mapEntity.getAddLink}
                                            isPressedAddEntity={isPressedAddEntity}
                                            permission={permissions.CREATE}
                                            authUser={authUser}
                                        />
                                    :
                                        mapEntity.hasOwnProperty('AddButton') && <mapEntity.AddButton/>
                            }
                            {
                                hasDeleteSelectedButtons && !readOnly &&
                                <div className={styles.delete_selected_button}>
                                    <Button icon={'delete'} onClick={::this.deleteSelected} id={formatHtmlId(`button_delete_selected`)} disabled={isDeleteSelectedButtonDisabled}>
                                        <span>{'Delete Selected'}</span>
                                    </Button>
                                </div>
                            }
                            {
                                hasAdditionalButton && !readOnly &&
                                <div className={styles.additional_button}>
                                    {typeof mapEntity.AdditionalButton === 'function' ? mapEntity.AdditionalButton(this) : mapEntity.AdditionalButton}
                                </div>
                            }
                            {
                                entities.length > 0 && !noSearchField && !readOnly &&
                                <div className={`${styles[classNames.search_field]} tour-step-search-1`}>
                                    <Input
                                        value={searchValue}
                                        onChange={::this.changeSearchValue}
                                        placeholder={'Search field'}
                                        id={'search_field'}
                                        theme={{input: styles.input}}
                                    />
                                </div>
                            }
                            {
                                entities.length > 0 && !readOnly &&
                                    <span className={styles.list_view_icon}>
                                        <TooltipFontIcon onClick={::this.setListView} tooltip={'List View'} value={'view_list'} isButton={true} turquoiseTheme disabled={isListViewIconDisabled}/>
                                        <GridViewMenu setGridViewType={::this.setGridViewType}/>
                                    </span>
                            }
                        </div>
                        {
                            currentPageItems.length === 0
                            ?
                                <div className={styles[classNames.empty_list]}>
                                    <span>
                                        {this.props.translations.empty_list}
                                    </span>
                                </div>
                            :
                                <React.Fragment>
                                    {viewType === VIEW_TYPE.LIST &&
                                        <ListView
                                            deletingEntity={deletingEntity}
                                            readOnly={readOnly}
                                            translations={translations}
                                            sortType={sortType}
                                            toggleSortType={::this.toggleSortType}
                                            setChecks={::this.setChecks}
                                            entitiesName={'allEntities'}
                                            entityIdName={entityIdName}
                                            allEntities={entities}
                                            items={listViewEntities}
                                            header={listViewEntitiesHeader}
                                            mapEntity={mapEntity}
                                            renderItemActions={renderListViewItemActions}
                                            actionsShouldBeMinimized={actionsShouldBeMinimized}
                                            isItemActionsBefore={isItemActionsBefore}
                                        />}
                                    {viewType === VIEW_TYPE.GRID &&
                                    <div className={styles.grid_view}>
                                        {
                                            currentPageItems.map((entity, key) => {
                                                let viewLink = mapEntity.hasOwnProperty('getViewLink') ? mapEntity.getViewLink(entity) : '';
                                                let updateLink = mapEntity.hasOwnProperty('getUpdateLink') ? mapEntity.getUpdateLink(entity) : '';
                                                let graphLink = mapEntity.hasOwnProperty('getGraphLink') ? mapEntity.getGraphLink(entity) : '';
                                                let onCardClickLink = mapEntity.hasOwnProperty('getOnCardClickLink') ? mapEntity.getOnCardClickLink(entity.mappedEntity) : '';
                                                let onDelete = mapEntity.hasOwnProperty('onDelete') ? mapEntity.onDelete : null;
                                                let hasView = isString(viewLink) && viewLink !== '';
                                                let hasUpdate = isString(updateLink) && updateLink !== '' && !readOnly;
                                                let hasGraph = isString(graphLink) && graphLink !== '';
                                                let hasDelete = onDelete !== null && !readOnly;
                                                let isSelectedCard = false;
                                                if (selectedCard === key) {
                                                    isSelectedCard = true;
                                                }
                                                return (
                                                    <Card
                                                        key={key}
                                                        deletingEntity={deletingEntity}
                                                        permission={entity.permission ? entity.permission : NO_NEED_PERMISSION}
                                                        gridViewType={gridViewType}
                                                        hasTour={translations.header && translations.header.hasOwnProperty('onHelpClick') && (key === 0 || key === 1)}
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
                                                );
                                            })
                                        }
                                    </div>
                                    }
                                </React.Fragment>
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
    hasDeleteSelectedButtons: PropTypes.bool,
    readOnly: PropTypes.bool,
    viewTypeMust: PropTypes.oneOf(['GRID', 'LIST']),
    componentName: PropTypes.string,
};

List.defaultProps = {
    exceptionEntities: {label: '', exceptions: []},
    load: null,
    containerStyles: {},
    noSearchField: false,
    mapDependencies: {},
    hasDeleteSelectedButtons: true,
    listViewData: null,
    readOnly: false,
    componentName: '',
    deletingEntity: null,
};

export default withRouter(List);