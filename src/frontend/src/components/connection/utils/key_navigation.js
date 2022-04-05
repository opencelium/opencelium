/*
 * Copyright (C) <2022>  <becon GmbH>
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

import {BUSINESS_LABEL_MODE} from "@classes/components/content/connection_overview_2/CSvg";

/**
 * variable that switch navigation from app to List component and vice versa
 */
let isSwitchedOffUserListKeyNavigation = false;
function switchUserListKeyNavigation(status){
    isSwitchedOffUserListKeyNavigation = status;
}

function addNavigationListener(that, navigation){
    navigation.that = that;
    document.addEventListener('keydown', navigation);
}

function removeNavigationListener(that, navigation){
    navigation.that = that;
    document.removeEventListener('keydown', navigation);
}
function addNavigationListenerOnKeyUp(that, navigation){
    navigation.that = that;
    document.addEventListener('keyup', navigation);
}

function removeNavigationListenerOnKeyUp(that, navigation){
    navigation.that = that;
    document.removeEventListener('keyup', navigation);
}

function doAction(event, action){
    if(typeof document.activeElement.type === 'undefined' && !event.ctrlKey) {
        if(document.activeElement.contentEditable !== "true"){
            action();
        }
    }
}

/**
 * pressing up B to hide business labels in technical layout
 */
let HideBusinessLabelKeyNavigation = {
    handleEvent(event) {
        switch (event.type) {
            case 'keyup':
                hideBusinessLabel(event, this.that);
                break;
        }

    }
};
function hideBusinessLabel(e, that){
    let key = e.keyCode;
    switch (key) {
        //B
        case 66:
            doAction(e, () => {
                if(that.props.businessLabelMode === BUSINESS_LABEL_MODE.VISIBLE_ON_PRESS_KEY && that.props.isVisibleBusinessLabelKeyPressed === true){
                    that.props.setIsVisibleBusinessLabelKeyPressed(false);
                }
            });
            break;

    }
}
function addHideBusinessLabelKeyNavigation(that){
    addNavigationListenerOnKeyUp(that, HideBusinessLabelKeyNavigation);
}
function removeHideBusinessLabelKeyNavigation(that){
    removeNavigationListenerOnKeyUp(that, HideBusinessLabelKeyNavigation);
}
/**
 * pressing down B to show business labels in technical layout
 */
let ShowBusinessLabelKeyNavigation = {
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                showBusinessLabel(event, this.that);
                break;
        }

    }
};
function showBusinessLabel(e, that){
    let key = e.keyCode;
    switch (key) {
        //B
        case 66:
            doAction(e, () => {
                if(that.props.businessLabelMode === BUSINESS_LABEL_MODE.VISIBLE_ON_PRESS_KEY && that.props.isVisibleBusinessLabelKeyPressed === false){
                    that.props.setIsVisibleBusinessLabelKeyPressed(true);
                }
            });
            break;

    }
}
function addShowBusinessLabelKeyNavigation(that){
    addNavigationListener(that, ShowBusinessLabelKeyNavigation);
}
function removeShowBusinessLabelKeyNavigation(that){
    removeNavigationListener(that, ShowBusinessLabelKeyNavigation);
}
/**
 * pressing ARROW_DOWN select next option in select
 */
let SelectArrowDownKeyNavigation = {
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                selectArrowDown(event, this.that);
                break;
        }

    }
};
function selectArrowDown(e, that){
    let key = e.keyCode;
    switch (key) {
        //arrow_down
        case 40:
            doAction(e, () => {
                that.selectNextItem();
            });
            break;

    }
}
function addSelectArrowDownKeyNavigation(that){
    addNavigationListener(that, SelectArrowDownKeyNavigation);
}
function removeSelectArrowDownKeyNavigation(that){
    removeNavigationListener(that, SelectArrowDownKeyNavigation);
}
/**
 * pressing ARROW_UP select previous option in select
 */
let SelectArrowUpKeyNavigation = {
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                selectArrowUp(event, this.that);
                break;
        }

    }
};
function selectArrowUp(e, that){
    let key = e.keyCode;
    switch (key) {
        //arrow_up
        case 38:
            doAction(e, () => {
                that.selectPrevItem();
            });
            break;

    }
}
function addSelectArrowUpKeyNavigation(that){
    addNavigationListener(that, SelectArrowUpKeyNavigation);
}
function removeSelectArrowUpKeyNavigation(that){
    removeNavigationListener(that, SelectArrowUpKeyNavigation);
}
/**
 * pressing P open My Profile page
 */
let MenuMyProfileKeyNavigation = {
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                menuMyProfile(event, this.that);
                break;
        }

    }
};
function menuMyProfile(e, that){
    let key = e.keyCode;
    if(e.altKey) {
        switch (key) {
            //P
            case 80:
                doAction(e, () => {
                    that.props.router.push('/myprofile');
                });
                break;

        }
    }
}
function addMenuMyProfileKeyNavigation(that){
    addNavigationListener(that, MenuMyProfileKeyNavigation);
}
function removeMenuMyProfileKeyNavigation(that){
    removeNavigationListener(that, MenuMyProfileKeyNavigation);
}

/**
 * pressing D open Dashboard page
 */
let MenuDashboardKeyNavigation = {
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                menuDashboardNavigate(event, this.that);
                break;
        }

    }
};
function menuDashboardNavigate(e, that){
    let key = e.keyCode;
    if(e.altKey) {
        switch (key) {
            //d
            case 68:
                if (!isSwitchedOffUserListKeyNavigation) {
                    doAction(e, () => {
                        if (that.props.hasOwnProperty('router')) {
                            that.props.router.push('/');
                        }
                    });
                }
                break;
        }
    }
}
function addMenuDashboardKeyNavigation(that){
    addNavigationListener(that, MenuDashboardKeyNavigation);
}
function removeMenuDashboardKeyNavigation(that){
    removeNavigationListener(that, MenuDashboardKeyNavigation);
}

/**
 * pressing U open Users page
 */
let MenuUsersKeyNavigation = {
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                menuUsersNavigate(event, this.that);
                break;
        }

    }
};
function menuUsersNavigate(e, that){
    let key = e.keyCode;
    if(e.altKey) {
        switch (key) {
            //U
            case 85:
                if (!isSwitchedOffUserListKeyNavigation) {
                    doAction(e, () => {
                        if (that.props.hasOwnProperty('router')) {
                            that.props.router.push('/users');
                        }
                    });
                }
                break;
        }
    }
}
function addMenuUsersKeyNavigation(that){
    addNavigationListener(that, MenuUsersKeyNavigation);
}
function removeMenuUsersKeyNavigation(that){
    removeNavigationListener(that, MenuUsersKeyNavigation);
}

/**
 * pressing G open User Groups page
 */
let MenuUserGroupsKeyNavigation = {
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                menuUserGroupsNavigate(event, this.that);
                break;
        }

    }
};
function menuUserGroupsNavigate(e, that){
    let key = e.keyCode;
    if(e.altKey) {
        switch (key) {
            //G
            case 71:
                if (!isSwitchedOffUserListKeyNavigation) {
                    doAction(e, () => {
                        if (that.props.hasOwnProperty('router')) {
                            that.props.router.push('/usergroups');
                        }
                    });
                }
                break;
        }
    }
}
function addMenuUserGroupsKeyNavigation(that){
    addNavigationListener(that, MenuUserGroupsKeyNavigation);
}
function removeMenuUserGroupsKeyNavigation(that){
    removeNavigationListener(that, MenuUserGroupsKeyNavigation);
}

/**
 * pressing C open Connectors
 */
let MenuConnectorsKeyNavigation = {
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                menuConnectorsNavigate(event, this.that);
                break;
        }

    }
};
function menuConnectorsNavigate(e, that){
    let key = e.keyCode;
    if(e.altKey) {
        switch (key) {
            //C
            case 67:
                doAction(e, () => {
                    if (that.props.hasOwnProperty('router')) {
                        that.props.router.push('/connectors');
                    }
                });
                break;
        }
    }
}
function addMenuConnectorsKeyNavigation(that){
    addNavigationListener(that, MenuConnectorsKeyNavigation);
}
function removeMenuConnectorsKeyNavigation(that){
    removeNavigationListener(that, MenuConnectorsKeyNavigation);
}

/**
 * pressing N open Connections
 */
let MenuConnectionsKeyNavigation = {
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                menuConnectionsNavigate(event, this.that);
                break;
        }

    }
};
function menuConnectionsNavigate(e, that){
    let key = e.keyCode;
    if(e.altKey) {
        switch(key){
            //N
            case 78:
                doAction(e, () => {
                    if(that.props.hasOwnProperty('router')) {
                        that.props.router.push('/connections');
                    }
                });
                break;
        }
    }
}
function addMenuConnectionsKeyNavigation(that){
    addNavigationListener(that, MenuConnectionsKeyNavigation);
}
function removeMenuConnectionsKeyNavigation(that){
    removeNavigationListener(that, MenuConnectionsKeyNavigation);
}

/**
 * pressing S open Schedules
 */
let MenuSchedulesKeyNavigation = {
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                menuSchedulesNavigate(event, this.that);
                break;
        }

    }
};
function menuSchedulesNavigate(e, that){
    let key = e.keyCode;
    if(e.altKey) {
        switch (key) {
            //S
            case 83:
                doAction(e, () => {
                    if (that.props.hasOwnProperty('router')) {
                        that.props.router.push('/schedules');
                    }
                });
                break;
        }
    }
}
function addMenuSchedulesKeyNavigation(that){
    addNavigationListener(that, MenuSchedulesKeyNavigation);
}
function removeMenuSchedulesKeyNavigation(that){
    removeNavigationListener(that, MenuSchedulesKeyNavigation);
}

/**
 * pressing A open Apps
 */
let MenuAdminCardsKeyNavigation = {
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                menuAdminCardsNavigate(event, this.that);
                break;
        }

    }
};
function menuAdminCardsNavigate(e, that){
    let key = e.keyCode;
    if(e.altKey) {
        switch (key) {
            //A
            case 65:
                doAction(e, () => {
                    if (that.props.hasOwnProperty('router')) {
                        that.props.router.push('/admin_cards');
                    }
                });
                break;
        }
    }
}
function addMenuAdminCardsKeyNavigation(that){
    addNavigationListener(that, MenuAdminCardsKeyNavigation);
}
function removeMenuAdminCardsKeyNavigation(that){
    removeNavigationListener(that, MenuAdminCardsKeyNavigation);
}

/**
 * pressing I open Invokers page
 */
let MenuInvokersKeyNavigation = {
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                menuInvokersNavigate(event, this.that);
                break;
        }

    }
};
function menuInvokersNavigate(e, that){
    let key = e.keyCode;
    if(e.altKey) {
        switch (key) {
            //U
            case 73:
                if (!isSwitchedOffUserListKeyNavigation) {
                    doAction(e, () => {
                        if (that.props.hasOwnProperty('router')) {
                            that.props.router.push('/invokers');
                        }
                    });
                }
                break;
        }
    }
}
function addMenuInvokersKeyNavigation(that){
    addNavigationListener(that, MenuInvokersKeyNavigation);
}
function removeMenuInvokersKeyNavigation(that){
    removeNavigationListener(that, MenuInvokersKeyNavigation);
}

/**
 * pressing Esc call cancel action
 */
let CancelKeyNavigation = {
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                cancelKeyNavigate(event, this.that);
                break;
        }

    }
};
function cancelKeyNavigate(e, that) {
    let key = e.keyCode;
    switch (key) {
        //esc
        case 27:
            doAction(e, () => {
                if (typeof that.props.cancel === 'function') {
                    that.props.cancel();
                }
            });
            break;
    }
}
function addCancelKeyNavigation(that){
    addNavigationListener(that, CancelKeyNavigation);
}
function removeCancelKeyNavigation(that){
    removeNavigationListener(that, CancelKeyNavigation);
}

/**
 * pressing Enter call doAction in the ChangeContent component
 */
let ChangeContentActionNavigation = {
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                changeContentActionNavigate(event, this.that);
                break;
        }

    }
};
function changeContentActionNavigate(e, that) {
    let key = e.keyCode;
    switch (key) {
        //enter
        case 13:
            doAction(e, () => {
                if(typeof that.doAction === 'function') {
                    if(that.state.page === (that.state.contentsLength - 1)) {
                        that.doAction(e, );
                    }
                }
            });
            break;
    }
}
function addChangeContentActionNavigation(that){
    addNavigationListener(that, ChangeContentActionNavigation);
}
function removeChangeContentActionNavigation(that){
    removeNavigationListener(that, ChangeContentActionNavigation);
}

/**
 * pressing O logout from app
 */
let LogoutKeyNavigation = {
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                logoutNavigate(event, this.that);
                break;
        }

    }
};
function logoutNavigate(e, that) {
    let key = e.keyCode;
    if(e.altKey) {
        switch (key) {
            //O
            case 79:
                doAction(e, () => {
                    if (typeof that.wantLogout === 'function') {
                        that.wantLogout();
                    }
                });
                break;
        }
    }
}
function addLogoutKeyNavigation(that){
    addNavigationListener(that, LogoutKeyNavigation);
}
function removeLogoutKeyNavigation(that){
    removeNavigationListener(that, LogoutKeyNavigation);
}

/**
 * pressing LeftArrow redirect to previous page
 */
let PrevPageChangeEntityKeyNavigation = {
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                prevPageChangeEntityNavigate(event, this.that);
                break;
        }

    }
};
function prevPageChangeEntityNavigate(e, that){
    let key = e.keyCode;
    switch (key) {
        //<-
        case 37:
            doAction(e, () => {
                if (typeof that.prevPage === 'function')
                    that.prevPage();
            });
            break;
    }
}
function addPrevPageChangeEntityKeyNavigation(that){
    addNavigationListener(that, PrevPageChangeEntityKeyNavigation);
}
function removePrevPageChangeEntityKeyNavigation(that){
    removeNavigationListener(that, PrevPageChangeEntityKeyNavigation);
}

/**
 * pressing RightArrow redirect to next page
 */
let NextPageChangeEntityKeyNavigation = {
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                nextPageChangeEntityNavigate(event, this.that);
                break;
        }

    }
};
function nextPageChangeEntityNavigate(e, that){
    let key = e.keyCode;
    switch (key) {
        //->
        case 39:
            doAction(e, () => {
                if (typeof that.nextPage === 'function')
                    that.nextPage();
            });
            break;
    }
}
function addNextPageChangeEntityKeyNavigation(that){
    addNavigationListener(that, NextPageChangeEntityKeyNavigation);
}
function removeNextPageChangeEntityKeyNavigation(that){
    removeNavigationListener(that, NextPageChangeEntityKeyNavigation);
}

/**
 * pressing A click on the AddButton and open Add Entity Page
 */
let AddEntityKeyNavigation = {
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                addEntityNavigate(event, this.that);
                break;
        }

    }
};
function addEntityNavigate(e, that){
    let key = e.keyCode;
    if(e.altKey) {
        switch (key) {
            //+
            case 107:
                doAction(e, () => {
                    if (typeof that.addEntity === 'function') {
                        that.addEntity();
                    }
                });
                break;
        }
    }
}
function addAddEntityKeyNavigation(that){
    addNavigationListener(that, AddEntityKeyNavigation);
}
function removeAddEntityKeyNavigation(that){
    removeNavigationListener(that, AddEntityKeyNavigation);
}

/**
 * pressing 1, 2, 3, 4 select first, second, third or fourth Card in the List component
 * pressing 5 or Esc undo selection
 */
let SelectCardKeyNavigation = {
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                selectCardNavigate(event, this.that);
                break;
        }

    }
};
function selectCardNavigate(e, that){
    let key = e.keyCode;
    let arrowDirection = '';
    switch (key) {
        //esc, left, top, right, bottom
        case 27:
            arrowDirection = 'cancel';
            break;
        case 37:
            arrowDirection = 'left';
            break
        case 38:
            arrowDirection = 'top';
            break
        case 39:
            arrowDirection = 'right';
            break;
        case 40:
            arrowDirection = 'bottom';
            break;
    }
    if(arrowDirection !== ''){
        doAction(e, () => {
            if (typeof that.selectCard === 'function')
                that.selectCard(arrowDirection);
        });
    }
}
function addSelectCardKeyNavigation(that){
    addNavigationListener(that, SelectCardKeyNavigation);
}
function removeSelectCardKeyNavigation(that){
    removeNavigationListener(that, SelectCardKeyNavigation);
}

/**
 * pressing V preform view action of the item in the List component
 */
let ViewCardKeyNavigation = {
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                viewCardNavigate(event, this.that);
                break;
        }

    }
};
function viewCardNavigate(e, that){
    let key = e.keyCode;
    switch (key) {
        //v
        case 86:
            doAction(e, () => {
                if (typeof that.keyNavigate === 'function') {
                    that.keyNavigate('view');
                }
            });
            break;
    }
}
function addViewCardKeyNavigation(that){
    addNavigationListener(that, ViewCardKeyNavigation);
}
function removeViewCardKeyNavigation(that){
    removeNavigationListener(that, ViewCardKeyNavigation);
}

/**
 * pressing Enter go inside the card on the Apps' list
 */
let EnterCardKeyNavigation = {
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                enterCardNavigate(event, this.that);
                break;
        }

    }
};
function enterCardNavigate(e, that){
    let key = e.keyCode;
    switch (key) {
        //Enter
        case 13:
            doAction(e, () => {
                if (typeof that.keyNavigate === 'function') {
                    that.keyNavigate('enter');
                }
            });
            break;
    }
}
function addEnterKeyNavigation(that){
    addNavigationListener(that, EnterCardKeyNavigation);
}
function removeEnterKeyNavigation(that){
    removeNavigationListener(that, EnterCardKeyNavigation);
}

/**
 * pressing U preform update action of the item in the List component
 */
let UpdateCardKeyNavigation = {
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                updateCardNavigate(event, this.that);
                break;
        }

    }
};
function updateCardNavigate(e, that){
    let key = e.keyCode;
    switch (key) {
        //u
        case 85:
            doAction(e, () => {
                if (typeof that.keyNavigate === 'function') {
                    that.keyNavigate('update');
                }
            });
            break;
    }
}
function addUpdateCardKeyNavigation(that){
    addNavigationListener(that, UpdateCardKeyNavigation);
}
function removeUpdateCardKeyNavigation(that){
    removeNavigationListener(that, UpdateCardKeyNavigation);
}

/**
 * pressing G preform view graph action in List of Connections
 */
let GraphCardKeyNavigation = {
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                viewGraphCardNavigate(event, this.that);
                break;
        }

    }
};
function viewGraphCardNavigate(e, that){
    let key = e.keyCode;
    switch (key) {
        //g
        case 71:
            doAction(e, () => {
                if (typeof that.keyNavigate === 'function') {
                    that.keyNavigate('graph');
                }
            });
            break;
    }
}
function addGraphCardKeyNavigation(that){
    addNavigationListener(that, GraphCardKeyNavigation);
}
function removeGraphCardKeyNavigation(that){
    removeNavigationListener(that, GraphCardKeyNavigation);
}

/**
 * pressing D preform delete action from the List component
 */
let DeleteCardKeyNavigation = {
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                deleteCardNavigate(event, this.that);
                break;
        }

    }
};
function deleteCardNavigate(e, that){
    let key = e.keyCode;
    switch (key) {
        //d
        case 68:
            doAction(e, () => {
                if (typeof that.keyNavigate === 'function') {
                    that.keyNavigate('delete');
                }
            });
            break;
    }
}
function addDeleteCardKeyNavigation(that){
    addNavigationListener(that, DeleteCardKeyNavigation);
}
function removeDeleteCardKeyNavigation(that){
    removeNavigationListener(that, DeleteCardKeyNavigation);
}

/**
 * pressing Esc focus on the document
 */
let FocusDocumentNavigation = {
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                focusDocument(event, this.that);
                break;
        }

    }
};
function focusDocument(e, that){
    let key = e.keyCode;
    switch (key) {
        //esc
        case 27:
            if (document.activeElement) {
                setTimeout(() => document.activeElement.blur(), 300);
            }
            break;
    }
}
function addFocusDocumentNavigation(that){
    addNavigationListener(that, FocusDocumentNavigation);
}
function removeFocusDocumentNavigation(that){
    removeNavigationListener(that, FocusDocumentNavigation);
}

/**
 * pressing Esc focus on the document
 */
let CloseParamGenerator = {
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                closeParamGenerator(event, this.that);
                break;
        }

    }
};
function closeParamGenerator(e, that){
    let key = e.keyCode;
    switch (key) {
        //esc
        case 27:
            if(that.state.showGenerator || that.props.isVisible){
                that.setState({
                    shouldClose: true,
                });
            }
            break;
    }
}
function addCloseParamGeneratorNavigation(that){
    addNavigationListener(that, CloseParamGenerator);
}
function removeCloseParamGeneratorNavigation(that){
    removeNavigationListener(that, CloseParamGenerator);
}

/**
 * pressing LeftArrow open previous page of the List component
 */
let PrevPageKeyNavigation = {
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                prevPageNavigate(event, this.that);
                break;
        }

    }
};
function prevPageNavigate(e, that){
    let key = e.keyCode;
    if(e.ctrlKey) {
        switch (key) {
            //<-
            case 37:
                doAction(e, () => {
                    if (typeof that.openPrevPage === 'function')
                        that.openPrevPage();
                });
                break;
        }
    }
}
function addPrevPageKeyNavigation(that){
    addNavigationListener(that, PrevPageKeyNavigation);
}
function removePrevPageKeyNavigation(that){
    removeNavigationListener(that, PrevPageKeyNavigation);
}

/**
 * pressing RightArrow open next page of the List component
 */
let NextPageKeyNavigation = {
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                nextPageNavigate(event, this.that);
                break;
        }

    }
};
function nextPageNavigate(e, that){
    let key = e.keyCode;
    if(e.ctrlKey) {
        switch (key) {
            //->
            case 39:
                doAction(e, () => {
                    if (typeof that.openNextPage === 'function')
                        that.openNextPage();
                });
                break;
        }
    }
}
function addNextPageKeyNavigation(that){
    addNavigationListener(that, NextPageKeyNavigation);
}
function removeNextPageKeyNavigation(that){
    removeNavigationListener(that, NextPageKeyNavigation);
}

/**
 * pressing C login app
 */
let LoginKeyNavigation = {
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                loginNavigate(event, this.that);
                break;
        }

    }
};
function loginNavigate(e, that){
    let key = e.keyCode;
    switch(key){
        //C
        case 67:
            doAction(e, () => {
                if(typeof that.login === 'function') {
                    that.login();
                }
            });
            break;

    }
}
function addLoginKeyNavigation(that){
    addNavigationListener(that, LoginKeyNavigation);
}
function removeLoginKeyNavigation(that){
    removeNavigationListener(that, LoginKeyNavigation);
}


export{
    switchUserListKeyNavigation,
    addSelectArrowDownKeyNavigation,
    removeSelectArrowDownKeyNavigation,
    addSelectArrowUpKeyNavigation,
    removeSelectArrowUpKeyNavigation,
    addMenuMyProfileKeyNavigation,
    removeMenuMyProfileKeyNavigation,
    addLoginKeyNavigation,
    removeLoginKeyNavigation,
    addPrevPageKeyNavigation,
    removePrevPageKeyNavigation,
    addNextPageKeyNavigation,
    removeNextPageKeyNavigation,
    addFocusDocumentNavigation,
    removeFocusDocumentNavigation,
    addSelectCardKeyNavigation,
    removeSelectCardKeyNavigation,
    addViewCardKeyNavigation,
    removeViewCardKeyNavigation,
    addEnterKeyNavigation,
    removeEnterKeyNavigation,
    addUpdateCardKeyNavigation,
    removeUpdateCardKeyNavigation,
    addGraphCardKeyNavigation,
    removeGraphCardKeyNavigation,
    addDeleteCardKeyNavigation,
    removeDeleteCardKeyNavigation,
    addAddEntityKeyNavigation,
    removeAddEntityKeyNavigation,
    addPrevPageChangeEntityKeyNavigation,
    removePrevPageChangeEntityKeyNavigation,
    addNextPageChangeEntityKeyNavigation,
    removeNextPageChangeEntityKeyNavigation,
    addLogoutKeyNavigation,
    removeLogoutKeyNavigation,
    addChangeContentActionNavigation,
    removeChangeContentActionNavigation,
    addCancelKeyNavigation,
    removeCancelKeyNavigation,
    addMenuConnectorsKeyNavigation,
    removeMenuConnectorsKeyNavigation,
    addMenuConnectionsKeyNavigation,
    removeMenuConnectionsKeyNavigation,
    addMenuSchedulesKeyNavigation,
    removeMenuSchedulesKeyNavigation,
    addMenuUserGroupsKeyNavigation,
    removeMenuUserGroupsKeyNavigation,
    addMenuUsersKeyNavigation,
    removeMenuUsersKeyNavigation,
    addMenuDashboardKeyNavigation,
    removeMenuDashboardKeyNavigation,
    addMenuAdminCardsKeyNavigation,
    removeMenuAdminCardsKeyNavigation,
    addMenuInvokersKeyNavigation,
    removeMenuInvokersKeyNavigation,
    addCloseParamGeneratorNavigation,
    removeCloseParamGeneratorNavigation,
    addShowBusinessLabelKeyNavigation,
    removeShowBusinessLabelKeyNavigation,
    addHideBusinessLabelKeyNavigation,
    removeHideBusinessLabelKeyNavigation,
};