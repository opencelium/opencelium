import React from 'react';
import DeleteUserButton from "@features/user/user-delete/DeleteUserButton.tsx";
import ProfileDialog from "@widgets/ProfileDialog/ProfileDialog.tsx";
import UserEditPage from "@pages/UsersPage/UserEditPage.tsx";

const TestDialog = () => (
    <div style={{display: 'grid', width: '400px', gap: 10}}>

        <DeleteUserButton/>
        <ProfileDialog/>
        <UserEditPage
            user={{
                id: '1',
                email: 'email@test.com',
                firstname: 'Jack',
                lastname: 'Test',
                roles: ['admin'],
            }}
        />
    </div>
);

export default TestDialog;
