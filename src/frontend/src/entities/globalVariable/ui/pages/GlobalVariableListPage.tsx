import React from 'react'
import PageWrapper from '@pages/PageWrapper/PageWrapper'
import { GenericEntityList } from '@/engine/entity/runtime/genererics/GenericEntityList'
import { GLOBAL_VARIABLE_ENTITY } from '../../globalVariable.constants'
import { GlobalValuesProvider } from '../live-values/GlobalValuesProvider'

export const GlobalVariableListPage: React.FC = () => (
    <PageWrapper>
        <GlobalValuesProvider>
            <GenericEntityList entityName={GLOBAL_VARIABLE_ENTITY} />
        </GlobalValuesProvider>
    </PageWrapper>
)
