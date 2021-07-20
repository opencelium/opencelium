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
import {withTranslation} from 'react-i18next';
import { withRouter } from 'react-router';

import {formatHtmlId, generateLabel, isString} from "@utils/app";
import {switchUserListKeyNavigation} from "@utils/key_navigation";
import Confirmation from "../app/Confirmation";
import CardButton from "./CardButton";
import {getThemeClass} from "@utils/app";
import Loading from "@loading";
import CardIcon from "../../icons/CardIcon";

import styles from '@themes/default/general/list_of_components.scss';
import {API_REQUEST_STATE} from "@utils/constants/app";


/**
 * Card component for Item of the List
 */
@withTranslation('app')
class ListCard extends Component{

    constructor(props){
        super(props);
        this.state = {
            showConfirm: false,
            hasSelectedCardEffect: false,
            clickOnCard: false,
            avatarScale: 1,
        };
    }

    static getDerivedStateFromProps(props, state){
        if(state.clickOnCard){
            if(props.load && props.load.hasOwnProperty('loadingLink')) {
                if (props.load.loadingLink !== API_REQUEST_STATE.START) {
                    if(props.load) {
                        if(props.load.hasOwnProperty('callback')) {
                            props.load.callback({link: props.onCardClickLink});
                        }
                    }
                    return {
                        clickOnCard: false,
                        avatarScale: 1,
                    };
                }
            }
        }
        return null;
    }

    componentDidUpdate(prevProps){
        const {isException, isSelectedCard, keyNavigateType} = this.props;
        if(isSelectedCard && keyNavigateType !== '' && prevProps.keyNavigateType !== keyNavigateType){
            switch(keyNavigateType){
                case 'enter':
                    switchUserListKeyNavigation(false);
                    this.enter();
                    break;
                case 'view':
                    switchUserListKeyNavigation(false);
                    this.view();
                    break;
                case 'update':
                    switchUserListKeyNavigation(false);
                    this.update();
                    break;
                case 'graph':
                    switchUserListKeyNavigation(false);
                    this.viewGraph();
                    break;
                case 'delete':
                    switchUserListKeyNavigation(false);
                    if(!isException) {
                        this.wantDelete();
                    }
                    break;
            }
        }
    }

    toggleHasSelectedCardEffect(hasSelectedCardEffect){
        this.setState({hasSelectedCardEffect});
    }

    /**
     * to act clicking on Card for Apps
     */
    enter(){
        this.onCardClick();
    }

    /**
     * to view entity
     */
    view(){
        const {router, viewLink} = this.props;
        router.push(viewLink);
    }

    /**
     * to update entity
     */
    update(){
        const {router, updateLink} = this.props;
        router.push(updateLink);
    }

    /**
     * to view graph of the connection
     */
    viewGraph(){
        const {router, graphLink} = this.props;
        if(graphLink !== '') {
            router.push(graphLink);
        }
    }

    /**
     * to delete entity
     */
    doDelete(){
        const {onDelete, entity} = this.props;
        if(onDelete) {
            onDelete({...entity});
        }
        this.toggleConfirm();
    }

    /**
     * to show effect on mouse over for Apps
     */
    onMouseOverCard(){
        if(this.hasNotActions()){
            this.toggleHasSelectedCardEffect(true);
        }
    }

    /**
     * to remove effect on mouse leave for Apps
     */
    onMouseLeaveCard(){
        if(this.hasNotActions()){
            this.toggleHasSelectedCardEffect(false);
        }
    }

    /**
     * to set showConfirm state
     */
    toggleConfirm(){
        this.setState({showConfirm: !this.state.showConfirm});
    }

    /**
     * to show confirmation before delete
     */
    wantDelete(){
        this.toggleConfirm();
    }

    /**
     * to open link clicking on Card in a new tab for Apps
     */
    onCardClick(){
        const {entity, onCardClickLink, load} = this.props;
        if(onCardClickLink && onCardClickLink !== '') {
            let that = this;
            this.setState({avatarScale: 0});
            setTimeout(() => {
                if (load && load.hasOwnProperty('loadLink')) {
                    load.loadLink(entity);
                }
                that.setState({clickOnCard: true}, () => {
                    that.props.keyNavigate('');
                });
            }, 100);
        }
    }

    /**
     * to check if Card does not have any action
     */
    hasNotActions(){
        const {hasView, hasUpdate, hasGraph, hasDelete} = this.props;
        return !hasView && !hasUpdate && !hasGraph && !hasDelete;
    }

    renderSubtitle(){
        const {entity, authUser} = this.props;
        let classNames = ['subtitle'];
        classNames = getThemeClass({classNames, authUser, styles});
        if(typeof entity.subtitle === 'string') {
            return(
                <div className={styles[classNames.subtitle]}>{entity.subtitle}</div>
            );
        }
        if(React.isValidElement(entity.subtitle)){
            return entity.subtitle;
        }
        return null;
    }

    renderAvatar(){
        const {clickOnCard, avatarScale} = this.state;
        const {entity, authUser, load} = this.props;
        let classNames = ['loading'];
        classNames = getThemeClass({classNames, authUser, styles});
        if(clickOnCard && load && load.hasOwnProperty('loadingLink') && load.loadingLink === API_REQUEST_STATE.START){
            return <Loading authUser={authUser} className={styles[classNames.loading]}/>;
        }
        if(typeof entity.avatar === 'string') {
            return(
                <CardIcon authUser={authUser} icon={entity.avatar} style={{transform: `scale(${avatarScale})`}}/>
            );
        }
        if(React.isValidElement(entity.avatar)){
            return entity.avatar;
        }
        return null;
    }

    renderActions(){
        const {t, isException, exceptionLabel, isSelectedCard, permissions, authUser, hasView, hasUpdate, hasGraph, hasDelete, hasTour, index} = this.props;
        let classNames = [
            'button',
            'button_delete',
            'only_button_delete',
            'key_navigation_title',
            'key_navigation_letter',
            'key_navigation_title',
            'key_navigation_letter',
            'key_navigation_title',
            'key_navigation_letter_delete',
            'card_actions',
            'current_card',
            'current_card_title',
            'no_actions_card',
            'card',
            'selected_card',
            'top_section',
            'card_title',
            'title'];
        classNames = getThemeClass({classNames, authUser, styles});
        let buttonStyle = styles[classNames.button];
        let deleteButtonStyle = buttonStyle;
        if(!hasView && !hasUpdate && !hasGraph){
            deleteButtonStyle += ` ${styles[classNames.only_button_delete]}`;
        } else{
            deleteButtonStyle += ` ${styles[classNames.button_delete]}`;
        }
        let currentCardStyle = `${styles[classNames.current_card]}`;
        let viewButtonText = t('LIST.CARD.BUTTON_VIEW');
        let updateButtonText = t('LIST.CARD.BUTTON_UPDATE');
        let graphButtonText = t('LIST.CARD.BUTTON_GRAPH');
        let deleteButtonText = t('LIST.CARD.BUTTON_DELETE');
        if(isSelectedCard){
            viewButtonText = generateLabel(t('LIST.CARD.BUTTON_VIEW'), 0, {keyNavigationTitle: styles[classNames.key_navigation_title], keyNavigationLetter: styles[classNames.key_navigation_letter]});
            updateButtonText = generateLabel(t('LIST.CARD.BUTTON_UPDATE'), 0, {keyNavigationTitle: styles[classNames.key_navigation_title], keyNavigationLetter: styles[classNames.key_navigation_letter]});
            graphButtonText = generateLabel(t('LIST.CARD.BUTTON_GRAPH'), 0, {keyNavigationTitle: styles[classNames.key_navigation_title], keyNavigationLetter: styles[classNames.key_navigation_letter]});
            deleteButtonText = generateLabel(t('LIST.CARD.BUTTON_DELETE'), 0, {keyNavigationTitle: styles[classNames.key_navigation_title], keyNavigationLetter: styles[classNames.key_navigation_letter_delete]});
        }

        if(this.hasNotActions()){
            return (
                <div className={styles[classNames.card_actions]}>
                    <CardButton hasTab={false} className={styles[classNames.no_actions_card]} text={'nothing'} permission={permissions.READ} index={index}/>
                </div>
            );
        }
        if(!isException){
            return (
                <div className={styles[classNames.card_actions]} style={!hasView && !hasUpdate && !hasGraph ? {textAlign: 'right'} : null}>
                    {hasView && <CardButton className={`${buttonStyle} ${hasTour ? `tour-step-view-${index + 1}` : ''}`} index={index} onClick={::this.view} text={viewButtonText} permission={permissions.READ}/>}
                    {hasUpdate && <CardButton className={`${buttonStyle} ${hasTour ? `tour-step-update-${index + 1}` : ''}`} index={index} onClick={::this.update} text={updateButtonText} permission={permissions.UPDATE}/>}
                    {hasGraph && <CardButton className={`${buttonStyle} ${hasTour ? `tour-step-graph-${index + 1}` : ''}`} index={index} onClick={::this.viewGraph} text={graphButtonText} permission={permissions.READ}/>}
                    {hasDelete && <CardButton className={`${deleteButtonStyle} ${hasTour ? `tour-step-delete-${index + 1}` : ''}`} index={index} onClick={::this.wantDelete} text={deleteButtonText} permission={permissions.DELETE}/>}
                </div>
            );
        } else{
            return (
                <div className={styles[classNames.card_actions]}>
                    {hasView && <CardButton className={`${buttonStyle} ${hasTour ? `tour-step-view-${index + 1}` : ''}`} index={index} onClick={::this.view} text={viewButtonText} permission={permissions.READ}/>}
                    {hasUpdate && <CardButton className={`${buttonStyle} ${hasTour ? `tour-step-update-${index + 1}` : ''}`} index={index} onClick={::this.update} text={updateButtonText} permission={permissions.UPDATE}/>}
                    {/*<CardButton hasTab={false} className={`${currentCardStyle}`} index={index} text={exceptionLabel} permission={permissions.READ}/>*/}
                </div>
            );
        }
    }

    renderCard(){
        const {hasSelectedCardEffect} = this.state;
        const {entity, t, isSelectedCard, authUser, hasTour, index, isButton} = this.props;
        let classNames = ['card', 'selected_card', 'top_section', 'card_title', 'title'];
        classNames = getThemeClass({classNames, authUser, styles});
        let cardClassName = styles[classNames.card];
        let cardStyle = {};
        if(isSelectedCard || hasSelectedCardEffect){
            cardClassName += ' ' + styles[classNames.selected_card];
        }
        if(hasTour){
            cardClassName += ` tour-step-card-${index + 1}`;
        }
        if(hasSelectedCardEffect){
            cardStyle.cursor = 'pointer';
        }
        return (
            <div id={`list_card_${index}`} className={cardClassName} style={cardStyle} onClick={!isButton ? ::this.onCardClick : null} onMouseOver={::this.onMouseOverCard} onMouseLeave={::this.onMouseLeaveCard}>
                <div className={styles[classNames.top_section]}>
                        {isString(entity.title) &&
                            <div className={styles[classNames.card_title]}>
                                <div className={styles[classNames.title]} title={entity.title}>{entity.title}</div>
                                {this.renderSubtitle()}
                            </div>
                        }
                        {!isString(entity.title) &&
                            entity.title
                        }
                    {this.renderAvatar()}
                </div>
                {this.renderActions()}
                <Confirmation
                    okClick={::this.doDelete}
                    cancelClick={::this.toggleConfirm}
                    active={this.state.showConfirm}
                    title={t('LIST.CARD.CONFIRMATION_TITLE')}
                    message={t('LIST.CARD.CONFIRMATION_MESSAGE')}
                />
            </div>
        );
    }

    render(){
        const {isButton} = this.props;
        if(isButton){
            return(
                <button className={styles.card_as_button} onClick={::this.onCardClick}>
                    {this.renderCard()}
                </button>
            );
        } else{
            return this.renderCard();
        }
    }
}

ListCard.propTypes = {
    entity: PropTypes.shape({
        id: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number,
        ]),
        title: PropTypes.any.isRequired,
    }).isRequired,
    isSelectedCard: PropTypes.bool,
    viewLink: PropTypes.string,
    updateLink: PropTypes.string,
    graphLink: PropTypes.string,
    onCardClickLink: PropTypes.string,
    onDelete: PropTypes.func,
    isException: PropTypes.bool,
    exceptionLabel: PropTypes.string,
    permissions: PropTypes.object.isRequired,
    authUser: PropTypes.object.isRequired,
    hasView: PropTypes.bool,
    hasUpdate: PropTypes.bool,
    hasGraph: PropTypes.bool,
    hasDelete: PropTypes.bool,
    load: PropTypes.object,
    isButton: PropTypes.bool,
};

ListCard.defaultProps = {
    isSelectedCard: false,
    isException: false,
    exceptionLabel: '',
    hasGraph: false,
    hasView: true,
    hasUpdate: true,
    hasDelete: true,
    graphLink: '',
    onCardClickLink: '',
    load: null,
    isButton: false,
};

export default withRouter(ListCard);