import React from 'react'
import { useParams } from 'react-router-dom'
import PageWrapper from '@pages/PageWrapper/PageWrapper'
import { GlobalVariableDetail } from '../detail/GlobalVariableDetail'

export const GlobalVariableDetailPage: React.FC = () => {
    const id = Number(useParams().id)
    return (
        <PageWrapper>
            <GlobalVariableDetail id={id} />
        </PageWrapper>
    )
}
