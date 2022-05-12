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

import React, {FC, useEffect, useState} from 'react';
import {withTheme} from 'styled-components';
import {Application} from "@application/classes/Application";
import {useAppDispatch} from "@application/utils/redux";
import {getResources} from "@application/redux_toolkit/action_creators/ApplicationCreators";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import Loading from "@app_component/base/loading/Loading";
import { FileNamesProps } from './interfaces';
import {FileNamesStyled, FileNameStyled, FilesStyled, NoFilesStyled} from './styles';
import Hint from "../hint/Hint";

const FileNames: FC<FileNamesProps> =
    ({

    }) => {
    const dispatch = useAppDispatch();
    const {resources, gettingResources, updatingResources} = Application.getReduxState();
    useEffect(() => {
        dispatch(getResources({withoutNotification: true}));
    }, []);
    useEffect(() => {
        if(updatingResources === API_REQUEST_STATE.FINISH){
            dispatch(getResources({withoutNotification: true}));
        }
    }, [updatingResources]);
    if(gettingResources === API_REQUEST_STATE.START){
        return <Loading/>;
    }
    const fileNames = resources?.files_name || [];
    return (
        <FileNamesStyled>
            {fileNames.length === 0 && <NoFilesStyled>There are no new files</NoFilesStyled>}
            <FilesStyled>{fileNames.map((fileName: string) => <FileNameStyled key={fileName} title={fileName}>{fileName}</FileNameStyled>)}</FilesStyled>
            <Hint text={'This update overwrites all local template and invoker files provided from becon. Please, restart your server after update!'}/>
        </FileNamesStyled>
    )
}

FileNames.defaultProps = {
}


export {
    FileNames,
};

export default withTheme(FileNames);