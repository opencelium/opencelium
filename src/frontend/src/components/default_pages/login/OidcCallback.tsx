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

import React, {useEffect, useState} from "react";
import {useNavigate, useSearchParams} from "react-router-dom";

import {useAppDispatch} from "@application/utils/store";
import {loginOidc} from "@application/redux_toolkit/action_creators/AuthCreators";
import Loading from "@app_component/base/loading/Loading";

const OidcCallback = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');
        if (errorParam) {
            setError(errorParam);
            return;
        }
        if (!code) {
            setError('missing_code');
            return;
        }
        dispatch(loginOidc(code)).then((result: any) => {
            if (loginOidc.fulfilled.match(result)) {
                navigate('/', {replace: true});
            } else {
                setError('login_failed');
            }
        });
    }, [dispatch, navigate, searchParams]);

    if (error) {
        return (
            <div style={{textAlign: 'center', marginTop: '120px'}}>
                <p>Single sign-on failed: {error}</p>
                <a href="/login">Back to login</a>
            </div>
        );
    }

    return <Loading top={'40vh'}/>;
};

export default OidcCallback;
