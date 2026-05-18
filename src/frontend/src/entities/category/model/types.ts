export interface Category {
    id: number
    name: string
    parentCategory?: Omit<Category, "parentCategory">
    subCategories: number[]
}

export type CategoryDto = Omit<Category, "parentCategory"> & {
    parentCategory?: number | null
}
