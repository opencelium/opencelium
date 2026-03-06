/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, { FC, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@application/utils/store';
import { API_REQUEST_STATE } from '@application/interfaces/IApplication';
import FormSection from '@app_component/form/form_section/FormSection';
import InputText from '@app_component/base/input/text/InputText';
import { InputTextType } from '@app_component/base/input/text/interfaces';
import Button from '@app_component/base/button/Button';
import Hint from '@app_component/base/hint/Hint';
import { updatePassword } from '@entity/user/redux-toolkit/action_creators/UserCreators';
import { logout } from '@application/redux_toolkit/slices/AuthSlice';

const UpdatePasswordSection: FC = () => {
    const dispatch = useAppDispatch();
    const { updatingPassword } = useAppSelector((s) => s.userReducer);

    const isUpdatingPassword = updatingPassword === API_REQUEST_STATE.START;

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordTouched, setPasswordTouched] = useState(false);

    const currentPasswordError = useMemo(() => {
        if (!passwordTouched) return '';
        if (!currentPassword) return 'Please fill current password.';
        return '';
    }, [passwordTouched, currentPassword]);

    const newPasswordError = useMemo(() => {
        if (!passwordTouched) return '';
        if (!newPassword) return 'Please fill new password.';
        if (newPassword.length < 8) return 'New password must be at least 8 characters.';
        if (currentPassword && currentPassword === newPassword) {
            return 'New password must be different from current password.';
        }
        return '';
    }, [passwordTouched, newPassword, currentPassword]);

    const confirmPasswordError = useMemo(() => {
        if (!passwordTouched) return '';
        if (!confirmPassword) return 'Please confirm new password.';
        if (newPassword && confirmPassword !== newPassword) return 'Passwords do not match.';
        return '';
    }, [passwordTouched, confirmPassword, newPassword]);

    const onUpdatePassword = () => {
			setPasswordTouched(true);

            if (
                !currentPassword ||
                !newPassword ||
                !confirmPassword ||
                newPassword.length < 8 ||
                newPassword !== confirmPassword ||
                currentPassword === newPassword
            ) {
                return;
            }

			dispatch(updatePassword({
					currentPassword,
					newPassword,
					confirmPassword,
			}) as any).then((res: any) => {
					if (res && res.type && String(res.type).includes('fulfilled')) {
							dispatch(logout({}));
					}
			});
		};

    return (
        <FormSection label={{ value: 'update password' }} id={'profile-form-update-password'}>
            <InputText
                icon={'lock'}
                label={'Current password'}
                type={InputTextType.Password}
                value={currentPassword}
                onChange={(e: any) => setCurrentPassword(e.target.value)}
                maxLength={255}
                required={true}
                error={currentPasswordError}
            />
            <InputText
                icon={'lock'}
                label={'New password'}
                type={InputTextType.Password}
                value={newPassword}
                onChange={(e: any) => setNewPassword(e.target.value)}
                maxLength={255}
                required={true}
                error={newPasswordError}
            />
            <InputText
                icon={'lock'}
                label={'Repeat new password'}
                type={InputTextType.Password}
                value={confirmPassword}
                onChange={(e: any) => setConfirmPassword(e.target.value)}
                maxLength={255}
                required={true}
                error={confirmPasswordError}
            />
            <Hint
                message={'Your session will be immediately expired after update.'}
                style={{ marginLeft: 40 }}
            />
            <div style={{ float: 'right' }}>
                <Button
                    label={isUpdatingPassword ? 'Updating...' : 'Update'}
                    isLoading={isUpdatingPassword}
                    handleClick={onUpdatePassword}
                />
            </div>
        </FormSection>
    );
};

export default UpdatePasswordSection;