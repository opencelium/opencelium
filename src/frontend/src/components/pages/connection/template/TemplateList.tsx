import React, {FC, useEffect} from 'react';
import {TemplateListProps} from "../interfaces";
import Templates from "@collection/Templates";
import {Template} from "@class/connection/Template";
import {CollectionView} from "@organism/collection_view/CollectionView";
import {useAppDispatch} from "../../../../hooks/redux";
import {getAllTemplates} from "@action/connection/TemplateCreators";
import {API_REQUEST_STATE} from "@interface/application/IApplication";
import {TemplatePermissions} from "@constants/permissions";
import {permission} from "../../../../decorators/permission";

const TemplateList: FC<TemplateListProps> = permission(TemplatePermissions.READ)(({}) => {
    const dispatch = useAppDispatch();
    const {gettingTemplates, templates, deletingTemplatesById} = Template.getReduxState();
    useEffect(() => {
        dispatch(getAllTemplates());
    }, [])
    const CTemplates = new Templates(templates, dispatch, deletingTemplatesById);
    return (
        <CollectionView collection={CTemplates} isLoading={gettingTemplates === API_REQUEST_STATE.START} componentPermission={TemplatePermissions}/>
    )
})

TemplateList.defaultProps = {
}

export {
    TemplateList,
};