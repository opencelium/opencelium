import {store} from "@utils/store";
import {MenuStyle} from "./themes/MenuStyles";
import {FormSectionHeaderStyles} from "@utils/themes/FormSectionHeaderStyles";


export const getStyles = (styleName) => {
    const authUser = store.getState('auth').get('auth').get('authUser');
    if(!authUser){
        return null;
    }
    const theme = authUser.userDetail.theme;
    switch (styleName){
        case 'menu':
            return MenuStyle(theme);
        case 'form_section_header':
            return FormSectionHeaderStyles(theme);
    }
};