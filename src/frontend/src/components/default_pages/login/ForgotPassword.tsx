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

import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Toast, ToastBody, ToastHeader } from 'reactstrap';

import Card from '@entity/connection/components/components/general/basic_components/card/Card';
import InputText from '@app_component/base/input/text/InputText';
import { ColorTheme } from '@style/Theme';
import Button from '@app_component/base/button/Button';

const EMAIL_CONFIG_MESSAGE = 'Please, configure your email settings to use Forgot Password feature.';
const SERVER_UNREACHABLE_MESSAGE = 'Server is not reachable, check status of the server.';
const USER_NOT_EXIST_MESSAGE = 'User with such E-mail does not exist.';

/**
 * 0 - success
 * 1 - email config not set
 * 2 - server not reachable
 * 3 - user not exist
 */
const TEST_MODE: number = 0;

const ForgotPassword: FC = () => {
	const [email, setEmail] = useState('');
	const [emailError, setEmailError] = useState('');
	const [isSent, setIsSent] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const [toast, setToast] = useState<{ open: boolean; message: string }>({
		open: false,
		message: '',
	});

	const closeToast = useCallback(() => {
		setToast({ open: false, message: '' });
	}, []);

	const showToast = useCallback((message: string) => {
		setToast({ open: true, message });
	}, []);

	useEffect(() => {
		if (!toast.open) return;
		const t = setTimeout(() => closeToast(), 4000);
		return () => clearTimeout(t);
	}, [toast.open, closeToast]);

	const onSend = useCallback(async () => {
		setIsLoading(true);

		try {
			setEmailError('');

			if (TEST_MODE === 1) {
				showToast(EMAIL_CONFIG_MESSAGE);
				return;
			}

			if (TEST_MODE === 2) {
				showToast(SERVER_UNREACHABLE_MESSAGE);
				return;
			}

			if (TEST_MODE === 3) {
				setEmailError(USER_NOT_EXIST_MESSAGE);
				return;
			}

			setIsSent(true);
		} finally {
			setIsLoading(false);
		}
	}, [showToast]);

	const ToastNode = useMemo(() => {
		if (!toast.open) return null;

		return (
			<div style={{ position: 'fixed', right: 20, top: 20, zIndex: 9999 }}>
				<Toast isOpen={toast.open}>
					<ToastHeader toggle={closeToast}>Notice</ToastHeader>
					<ToastBody>{toast.message}</ToastBody>
				</Toast>
			</div>
		);
	}, [toast.open, toast.message, closeToast]);

	return (
		<>
			{ToastNode}

			<div style={{ display: 'flex', justifyContent: 'center', marginTop: 60 }}>
				<Card
					style={{
						minHeight: 360,
						padding: '0 30px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						background: '#fff',
						borderRadius: '5px',
					}}
				>
					{!isSent ? (
						<div
							style={{
								width: 420,
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
							}}
						>
							<div style={{ textAlign: 'center', fontSize: 18, marginBottom: 28 }}>
								Please, enter your email:
							</div>

							<InputText
								value={email}
								onChange={(e: any) => {
									setEmail(e.target.value);
									if (emailError) setEmailError('');
								}}
								placeholder='Email'
								background={ColorTheme.White}
								readOnly={isLoading}
								width='240px'
								error={emailError}
							/>

							<div style={{ alignSelf: 'flex-end', marginTop: 30, marginRight: 85 }}>
								<Button label='Send' handleClick={onSend} isDisabled={!email || isLoading} />
							</div>
						</div>
					) : (
						<div style={{ textAlign: 'center', fontSize: 18, width: 420, lineHeight: 1.6 }}>
							<p style={{ width: 320, margin: '0 auto' }}>
								Thank you. We have sent you an Email with a link to reset your password.
							</p>
						</div>
					)}
				</Card>
			</div>
		</>
	);
};

export default ForgotPassword;