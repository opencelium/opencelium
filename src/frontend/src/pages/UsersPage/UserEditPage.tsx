import type {User} from "@entities/user/model/types.ts";
import {Button} from "@shared/ui/primitives/Button";
import {useUserEditorDialog} from "@features/user/user-update/useUserEditorDialog.tsx";

//example of multilevel Dialogs
const UserEditPage = ({ user }: { user: User }) => {
    const openEditor = useUserEditorDialog(user);

    return (
        <Button onClick={openEditor}>
            Button with dialog form + confirmation
        </Button>
    );
};

export default UserEditPage;
