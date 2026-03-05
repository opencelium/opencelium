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
import { useNavigate } from 'react-router';
import { Toast, ToastBody, ToastHeader } from 'reactstrap';

import {Card} from "@app_component/base/card/Card";
import InputText from '@app_component/base/input/text/InputText';
import { InputTextType } from '@app_component/base/input/text/interfaces';
import { ColorTheme } from '@style/Theme';
import Button from '@app_component/base/button/Button';

import Request from '@entity/application/requests/classes/Request';
import { SimpleMessageResponse, ErrorResponse } from '@application/requests/classes/Auth';
import DefaultText from "@app_component/base/text/DefaultText";

const SERVER_UNREACHABLE_MESSAGE = 'Server is not reachable, check status of the server.';
const PASSWORD_LENGTH_MESSAGE = 'Password must contain at least 8 symbols.';
const PASSWORD_MATCH_MESSAGE = 'Passwords do not match.';

const EXPIRED_TOKEN_TEXT = 'The link to reset your password was expired. Please, try again.';

const SetPassword: FC = () => {
	const navigate = useNavigate();
	const [password, setPassword] = useState('');
	const [repeatPassword, setRepeatPassword] = useState('');

	const [passwordError, setPasswordError] = useState<string>('');
	const [repeatPasswordError, setRepeatPasswordError] = useState<string>('');

	const [isLoading, setIsLoading] = useState(false);

	const [isSuccess, setIsSuccess] = useState(false);
	const [seconds, setSeconds] = useState(5);

	const [expired, setExpired] = useState(false);

	const token = useMemo(() => {
		try {
			const params = new URLSearchParams(window.location.search);
			return params.get('token') || '';
		} catch {
			return '';
		}
	}, []);

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

	useEffect(() => {
		if (!isSuccess) return;

		if (seconds === 0) {
			navigate('/login');
			return;
		}

		const timer = setTimeout(() => {
			setSeconds((prev) => prev - 1);
		}, 1000);

		return () => clearTimeout(timer);
	}, [isSuccess, seconds, navigate]);

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

	const clearErrors = useCallback(() => {
		setPasswordError('');
		setRepeatPasswordError('');
	}, []);

	const onSet = useCallback(async () => {
		clearErrors();

		let hasError = false;

		if (password.length < 8) {
			setPasswordError(PASSWORD_LENGTH_MESSAGE);
			hasError = true;
		}

		if (password !== repeatPassword) {
			setRepeatPasswordError(PASSWORD_MATCH_MESSAGE);
			hasError = true;
		}

		if (hasError) return;

		if (!token) {
			setExpired(true);
			return;
		}

		setIsLoading(true);

		try {
			const request = new Request({
				url: 'auth/reset-password',
				hasAuthToken: false,
				isApi: false,
			});

			await request.post<SimpleMessageResponse>({
				token,
				newPassword: password,
				confirmPassword: repeatPassword,
			});

			setIsSuccess(true);
		} catch (e: any) {
			const resp = e?.response;

			if (!resp) {
				showToast(SERVER_UNREACHABLE_MESSAGE);
				return;
			}

			const status: number = resp.status;
			const data: ErrorResponse = resp.data || {};
			const code = String(data.error || '');

			if (status === 400 && code === 'INVALID_TOKEN') {
				setExpired(true);
				return;
			}

			showToast(data.message || SERVER_UNREACHABLE_MESSAGE);
		} finally {
			setIsLoading(false);
		}
	}, [clearErrors, password, repeatPassword, token, showToast]);

	const ExpiredNode = useMemo(() => {
		const parts = EXPIRED_TOKEN_TEXT.split('try again');
		return (
			<div
				style={{
					textAlign: 'center',
					fontSize: 16,
					width: 520,
					lineHeight: 1.6,
				}}
			>
				{parts[0]}
				<span
					style={{
						color: ColorTheme.Blue,
						cursor: 'pointer',
						userSelect: 'none',
					}}
					onClick={() => navigate('/forgot-password')}
				>
					try again
				</span>
				{parts[1] || ''}
			</div>
		);
	}, [navigate]);

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
					{expired ? (
						ExpiredNode
					) : !isSuccess ? (
						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
							}}
						>
							<p
								style={{ textAlign: 'center', marginBottom: 28 }}
							>
								<DefaultText value={"Please, enter your new password here:"}/>
							</p>

							<InputText
								type={InputTextType.Password}
								value={password}
								onChange={(e: any) => {
									setPassword(e.target.value);
									if (passwordError) setPasswordError('');
									if (
										repeatPassword &&
										e.target.value === repeatPassword &&
										repeatPasswordError
									) {
										setRepeatPasswordError('');
									}
								}}
								placeholder='Password'
								background={ColorTheme.White}
								width='260px'
								readOnly={isLoading}
								error={passwordError}
							/>

							<div style={{ height: 20 }} />

							<InputText
								type={InputTextType.Password}
								value={repeatPassword}
								onChange={(e: any) => {
									setRepeatPassword(e.target.value);
									if (repeatPasswordError) setRepeatPasswordError('');
									if (
										password &&
										e.target.value === password &&
										repeatPasswordError
									) {
										setRepeatPasswordError('');
									}
								}}
								placeholder='Repeat Password'
								background={ColorTheme.White}
								width='260px'
								readOnly={isLoading}
								error={repeatPasswordError}
							/>

							<div
								style={{
									alignSelf: 'flex-end',
								}}
							>
								<Button
									label='Set'
									handleClick={onSet}
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
							<p style={{ width: 350, margin: '0 auto' }}>
								Your password was successfully reset.
								<br />
								You will be automatically redirected in {seconds} sec...
							</p>
						</div>
					)}
				</Card>
			</div>
		</>
	);
};

export default SetPassword;
