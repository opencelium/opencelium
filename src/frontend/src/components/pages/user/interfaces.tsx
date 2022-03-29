import {ITheme} from "../../general/Theme";
import {PermissionProps} from "@constants/permissions";
import styled from "styled-components";
import UserForm from "@page/user/UserForm";

interface UserListProps{
    theme?: ITheme,
    permission?: PermissionProps;
}

export const UserFormStyled = styled(UserForm)`
    
`;

export {
    UserListProps,
}