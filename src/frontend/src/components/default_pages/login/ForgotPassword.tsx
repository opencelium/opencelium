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

import InputText from '@app_component/base/input/text/InputText';
import { ColorTheme } from '@style/Theme';
import Button from '@app_component/base/button/Button';

import Request from '@entity/application/requests/classes/Request';
import { SimpleMessageResponse, ErrorResponse } from '@application/requests/classes/Auth';
import {Card} from "@app_component/base/card/Card";
import DefaultText from "@app_component/base/text/DefaultText";

const SERVER_UNREACHABLE_MESSAGE = 'Server is not reachable, check status of the server.';

const ForgotPassword: FC = () => {
	const [email, setEmail] = useState('');
	const [emailError, setEmailError] = useState('');
	const [isSent, setIsSent] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const [toast, setToast] = useState<{ open: boolean; message: string }>({
		open: false,
		message: '',
	});

	const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

	const onSend = useCallback(async () => {
		setEmailError('');
		const validationError = validateEmail(email);
		if (validationError) {
			setEmailError(validationError);
			return;
		}
		setIsLoading(true);

		try {
			const request = new Request({
				url: 'auth/forgot-password',
				hasAuthToken: false,
				isApi: false,
			});

			await request.post<SimpleMessageResponse>({
				email: email.trim(),
			});

			setIsSent(true);
		} catch (e: any) {
			const resp = e?.response;

			if (!resp) {
				showToast(SERVER_UNREACHABLE_MESSAGE);
				return;
			}

			const status: number = resp.status;
			const data: ErrorResponse = resp.data || {};
			const code = String(data.error || '');

			if (status === 400 && code === 'EMAIL_NOT_EXISTS') {
				setEmailError('User with such E-mail does not exist.');
				return;
			}

			if (status === 429 && code === 'TOO_MANY_ATTEMPTS') {
				setEmailError('Too many attempts, try later.');
				return;
			}

			if (status === 503 && code === 'EMAIL_RECOVERY_FAILED') {
				showToast(
					data.message ||
						'There is an issue with your email configuration. For security reasons, the detailed error message has been written to your Opencelium logs. Please review the logs for more information.',
				);
				return;
			}

			showToast(data.message || SERVER_UNREACHABLE_MESSAGE);
		} finally {
			setIsLoading(false);
		}
	}, [email, showToast]);

	const validateEmail = useCallback((value: string) => {
		const v = value.trim();

		if (!v) return 'Email is required.';
		if (!EMAIL_REGEX.test(v)) return 'Please enter a valid email address.';
		return '';
	}, []);

	return (
		<>
			{ToastNode}

			<div style={{
				display: 'flex',
				justifyContent: 'center',
				marginTop: 60,
			}}>
				<Card
					style={{
						width: 500,
						height: 300,
						padding: '0 30px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					{!isSent ? (
						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
							}}
						>
							<div style={{ textAlign: 'center', marginBottom: 28 }}>
								<DefaultText value={"Please, enter your email:"}/>
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
								width='260px'
								error={emailError}
								onBlur={() => {
									const err = validateEmail(email);
									setEmailError(err);
								}}
							/>

							<div
								style={{
									alignSelf: 'flex-end',
								}}
							>
								<Button
									label='Send'
									handleClick={onSend}
									isDisabled={isLoading}
								/>
							</div>
						</div>
					) : (
						<div
							style={{
								textAlign: 'center',
								fontSize: 18,
								width: 420,
								lineHeight: 1.6,
							}}
						>
							<p style={{ width: 320, margin: '0 auto' }}>
								Thank you. We have sent you an Email with a link to reset your
								password.
							</p>
						</div>
					)}
				</Card>
			</div>
		</>
	);
};

export default ForgotPassword;
