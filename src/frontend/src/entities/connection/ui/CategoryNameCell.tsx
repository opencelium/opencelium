import React from 'react'
import { useGetCategoriesQuery } from '@entities/category/api/categoryApi'

type Props = {
    categoryId: number | null
}

export const CategoryNameCell: React.FC<Props> = ({ categoryId }) => {
    const { data: categories = [] } = useGetCategoriesQuery()

    if (categoryId == null) return null
    return <>{categories.find((category) => category.id === categoryId)?.name ?? ''}</>
}
