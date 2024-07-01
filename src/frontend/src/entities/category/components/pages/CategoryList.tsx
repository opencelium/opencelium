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

import React, {FC, useEffect} from 'react';
import {useAppDispatch} from "@application/utils/store";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {permission} from "@entity/application/utils/permission";
import CollectionView from "@app_component/collection/collection_view/CollectionView";
import { CategoryListProps } from '@entity/category/components/pages/intefaces';
import { Category } from '@entity/category/classes/Category';
import { CategoryPermissions } from '@entity/category/constants';
import Categories from '@entity/category/collections/Categories';
import { getAllCategories } from '@entity/category/redux_toolkit/action_creators/CategoryCreators';

const CategoryList: FC<CategoryListProps> = permission(CategoryPermissions.READ)(({}) => {
  const dispatch = useAppDispatch();
  const {gettingCategories, categories, deletingCategoriesById} = Category.getReduxState();

  useEffect(() => {
    dispatch(getAllCategories());
  }, [])

  const CCategories = new Categories(categories, dispatch, deletingCategoriesById);

  return (
    <CollectionView collection={CCategories} isLoading={gettingCategories === API_REQUEST_STATE.START} componentPermission={CategoryPermissions}/>
  )
})

CategoryList.defaultProps = {
}

export {
  CategoryList,
};
