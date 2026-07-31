import React, {useEffect} from 'react';
import {EntityWizard} from "@/engine/entity/runtime/EntityWizard.tsx";
import PageWrapper from "@pages/PageWrapper/PageWrapper.tsx";
import {useLdap} from "@entities/ldap/model/ldapSelectors.ts";
import {useLayoutStore} from "@app/layouts/AppLayout/layout.store.ts";

const CheckLdapPage = () => {

    const { isContentLoading, toggleIsContentLoading} = useLayoutStore();
    const {config, isLoading} = useLdap();
    useEffect(() => {
        toggleIsContentLoading(true);
        return () => {
            toggleIsContentLoading(false);
        }
    }, []);
    useEffect(() => {
        if (!isLoading) {
            toggleIsContentLoading(false);
        }
    }, [isLoading]);
    if (isContentLoading) {
        return null;
    }
    return (
        <PageWrapper>
            <EntityWizard
                entityName={'ldap'}
                mode="view"
                initialValues={{...config, password: 'password'}}
            />
        </PageWrapper>
    )
};

export default CheckLdapPage;
