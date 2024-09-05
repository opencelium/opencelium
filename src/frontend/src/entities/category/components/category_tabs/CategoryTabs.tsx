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

import React, { FC, useEffect, useState } from "react";
// @ts-ignore
import styles from "./styles";
import { capitalize } from "@application/utils/utils";
import Dialog from "@entity/connection/components/components/general/basic_components/Dialog";
import { Category } from "@entity/category/classes/Category";
import { ICategory } from "@entity/category/interfaces/ICategory";
import { API_REQUEST_STATE, TRIPLET_STATE } from "@application/interfaces/IApplication";
import { useAppDispatch } from "@application/utils/store";
import {
  getAllCategories,
  addCategory,
  deleteCategoryById,
  deleteCategoryCascadeById
} from '@entity/category/redux_toolkit/action_creators/CategoryCreators';
import {setActiveCategory, setActiveTab} from "@entity/category/redux_toolkit/slices/CategorySlice";
import {CategoryModel, CategoryModelCreate} from "@entity/category/requests/models/CategoryModel";
import { CategoryTabsProps } from "./interfaces";
import Checkbox from "@entity/connection/components/components/general/basic_components/inputs/Checkbox";
import {getAllMetaConnections} from "@root/redux_toolkit/action_creators/ConnectionCreators";

const AllCategoriesTab: any = {name: 'All', parentCategory: null, subCategories: []};

const CategoryTabs: FC<CategoryTabsProps> = ({setCurrentPage, readOnly = false}) => {

  const [tabs, setTabs] = useState<CategoryModel[]>([]);
  const [visibleAddCategoryDialog, setVisibleAddCategoryDialog] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [tabForRemove, setTabForRemove] = useState<any>({});
  const [breadcrumbs, setBreadcrumbs] = useState([{name: 'All'}]);
  const [removeRecursively, setRemoveRecursively] = useState(false);
  const [categoriesOptions, setCategoriesOptions] = useState([]);
  const [startDeleting, setStartDeleting] = useState<boolean>(false);
  const {
    checkingCategoryName, isCurrentCategoryHasUniqueName, categories, activeCategory,
    gettingCategories, addingCategory, deletingCategoryById, activeTab,
      deletingCategoriesById,
  } = Category.getReduxState();

  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(getAllCategories());/*
    const categoriesWithNullParent = categories.filter(category => category.parentCategory === null);
    setTabs([{name: 'All'} , ...categoriesWithNullParent])*/
  }, [])
  useEffect(() => {
    if(gettingCategories === API_REQUEST_STATE.FINISH || addingCategory === API_REQUEST_STATE.FINISH || deletingCategoryById === API_REQUEST_STATE.FINISH) {
      const newTabs = activeCategory ? categories.filter((c: CategoryModel) => activeCategory.subCategories.indexOf(c.id) !== -1) : categories.filter((category: CategoryModel) => !category.parentCategory);
      setTabs([AllCategoriesTab, ...newTabs]);
    }
    if (addingCategory === API_REQUEST_STATE.FINISH) {
      category.name = '';
      category.parentSelect = null;
    }
  }, [gettingCategories, addingCategory, deletingCategoryById]);

  useEffect(() => {
    if (deletingCategoryById === API_REQUEST_STATE.FINISH && startDeleting) {
      dispatch(getAllCategories());
      dispatch(getAllMetaConnections());
      setStartDeleting(false);
    }
  }, [deletingCategoryById]);

  useEffect(() => {
    bc()
  }, [activeCategory, addingCategory]);
  useEffect(() => {
    if (!visibleAddCategoryDialog) {
      category.parentSelect = null;
    } else {
      if(activeCategory){
        //@ts-ignore
        category.updateParentSelect(category, Category.getOptionsForCategorySelect(categories, false).find(c => c.value === activeCategory.id));
      }
    }
  }, [visibleAddCategoryDialog]);
  useEffect(() => {
    setCategoriesOptions(Category.getOptionsForCategorySelect(categories));
  }, [categories]);
  const category = Category.createState<ICategory>();

  const NameInput = category.getText({
    propertyName: "name",
    props: {
      icon: 'title',
      label: 'Name',
      required: true,
      isLoading: checkingCategoryName === API_REQUEST_STATE.START,
      error: isCurrentCategoryHasUniqueName === TRIPLET_STATE.FALSE ? 'Must be unique' : '',

    }
  })
  const ParentCategory = category.getSelect({propertyName: 'parentSelect', props: {
    icon: 'category',
    label: 'Parent Category',
    options: categoriesOptions,
    required: false,
    categoryList: true,
  }})

  const removeTab = (data: any, removeRecursively = false) => {
    const removedTab = tabs[data.index].name;
    if(removeRecursively){
      dispatch(deleteCategoryCascadeById(data.id))
    }
    else{
      dispatch(deleteCategoryById(data.id))
    }
    if(activeTab === removedTab){
      //dispatch(setActiveTab('All'));
      //dispatch(setActiveCategory(null))
    }
    setShowConfirmDelete(false);
    setRemoveRecursively(false);
    setStartDeleting(true);
  };

  const handleTabClick = (tabName: any, tab: any) => {
    if(tabName !== 'All'){
      if(tab.subCategories){
        const matchedCategories = categories.filter((category: CategoryModel) => tab.subCategories.includes(category.id));
        setTabs([AllCategoriesTab, ...matchedCategories])
        dispatch(setActiveTab('All'));
      }
      else{
        dispatch(setActiveTab(tabName));
      }
      dispatch(setActiveCategory(categories.find((c: CategoryModel) => c.name === tabName)));
    }
    else{
      const newActiveCategory = activeCategory && activeCategory.parentCategory ? categories.find((c: CategoryModel) => c.id === activeCategory.parentCategory.id) : null;
      const categoriesWithNullParent = categories.filter((category: CategoryModel) => !category.parentCategory);
      const newTabs = !newActiveCategory ? categoriesWithNullParent : categories.filter((c: CategoryModel) => newActiveCategory.subCategories.indexOf(c.id) !== -1)
      setTabs([AllCategoriesTab, ...newTabs])
      dispatch(setActiveTab('All'));
      dispatch(setActiveCategory(newActiveCategory));
    }

  };

  const findParentCategories: any = (categories: any, id: any) => {
    const result = [];
    const category = categories.find((category: any) => category.id === id);
    if (category) {
      result.push(category);
      if (category.parentCategory) {
        const parentCategoryId = category.parentCategory?.id || category.parentCategory;
        result.push(
          ...findParentCategories(categories, parentCategoryId)
        );
      }
    }
    return result;
  };

  const bc = () => {
    let breadcrumbs = [{name: 'All'}];
    if(activeCategory){
      if(activeCategory.parentCategory){
        const category = findParentCategories(categories, activeCategory.id)
        category.reverse().forEach((element: any) => {
          breadcrumbs.push({name: element.name})
        });
      } else{
        breadcrumbs.push({name: activeCategory.name})
      }
    }
    setBreadcrumbs(breadcrumbs)
  }

  const handleBreadcrumbClick = (breadcrumb: any) => {
    setCurrentPage(1);
    const tab = categories.find((category: CategoryModel) => category.name === breadcrumb);
    if(breadcrumb !== 'All'){
      if(tab.subCategories){
        const matchedCategories = categories.filter((category: CategoryModel) => tab.subCategories.includes(category.id));
        setTabs([AllCategoriesTab, ...matchedCategories])
        dispatch(setActiveTab('All'));
      }
      else{
        dispatch(setActiveTab(breadcrumb));
      }
      dispatch(setActiveCategory(categories.find((c: CategoryModel) => c.name === breadcrumb)));
    }
    else{
      const categoriesWithNullParent = categories.filter((category: CategoryModel) => !category.parentCategory);
      setTabs([AllCategoriesTab, ...categoriesWithNullParent])
      dispatch(setActiveTab('All'));
      dispatch(setActiveCategory(null));
    }
  }

  const addCategoryName = () => {
    const data: CategoryModelCreate = {
      name: category.name,
      parentCategory: null,
    }
    if(category.parentSelect){
      data.parentCategory = (+category.parentSelect.value);
    }
    dispatch(addCategory(data));
    setVisibleAddCategoryDialog(!visibleAddCategoryDialog);
  }

  return (
    <div>
      <div className={styles.breadcrumbs}>
      {breadcrumbs.map((breadcrumb, index) => (
        breadcrumbs.length === index + 1 ?
        <div className={`${styles.breadcrumb} ${styles.breadcrumb_disabled}`} key={index}>
          {breadcrumb.name}
        </div>
        :
        <div className={styles.breadcrumb} key={index} onClick={() => handleBreadcrumbClick(breadcrumb.name)}>
        {breadcrumb.name}
      </div>
      ))}
      </div>
      <div className={styles.tab_panel}>
        {tabs.map((tab, index) => (
          <div className={`${styles.tab} ${activeTab === tab.name ? `${styles.active_tab}` : ''}`} key={index} onClick={() => {
            setCurrentPage(1);
            if(tab.name !== activeTab) {
              handleTabClick(tab.name, tab);
            }
          }}>
            {!readOnly && tab.name !== 'All' && (
              <span
              className={styles.close_icon}
                onClick={(e) => {
                    e.stopPropagation(),
                    setShowConfirmDelete(true),
                    setTabForRemove({index, id: tab.id})
                }}
              >
                &times;
              </span>
            )}
            {capitalize(tab.name)}
          </div>
        ))}
        {!readOnly && <div className={`${styles.tab} ${styles.add_tab}`} onClick={() => setVisibleAddCategoryDialog(!visibleAddCategoryDialog)}>
          +
        </div>
        }

        <Dialog
          actions={[{label: 'Add', onClick: () => addCategoryName(), id: 'add_category_ok'}, {label: 'Cancel', onClick: () => setVisibleAddCategoryDialog(!visibleAddCategoryDialog), id: 'add_category_cancel'}]}
          active={visibleAddCategoryDialog}
          toggle={() => setVisibleAddCategoryDialog(!visibleAddCategoryDialog)}
          title={'Add Category'}
        >
          <div>
            {NameInput}
            {ParentCategory}
          </div>
        </Dialog>
        <Dialog
          actions={[
            {label: 'Ok', onClick: () => removeTab(tabForRemove, removeRecursively), id: 'remove_category_ok'},
            {label: 'Cancel', onClick: () => setShowConfirmDelete(false), id: 'remove_category_cancel'}
          ]}
          active={showConfirmDelete}
          toggle={() => setVisibleAddCategoryDialog(!visibleAddCategoryDialog)}
          title={'Confirmation'}
        >
          <div>
            <p>Do you really want to remove?</p>
              <Checkbox
                className={styles.category_remove_checkbox}
                labelClassName={styles.category_remove_label}
                checked={removeRecursively}
                onChange={() => setRemoveRecursively(!removeRecursively)}
                label={<>check here to remove recursively (<strong>subcategories and assigned connections will be removed</strong>)</>}
                inputPosition={'left'}
              />
          </div>
        </Dialog>
      </div>
    </div>
  );
}

export default CategoryTabs;
