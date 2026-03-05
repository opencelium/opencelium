import React from 'react';
import {Step} from "react-joyride";

export const CategoryEmptyListSteps: Step[] = [
    {
        title: 'Category',
        content:
            <span>Categories are used to organize and group Connections and Schedules for better structure and navigation.</span>
        ,
        target: '#category-list-empty-header',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Add Category',
        content:
            'Press Add Category to create a new category.',
        target: '#category-list-add',
        placement: 'bottom',
        disableBeacon: true,
    },
]

export const CategoryListSteps: Step[] = [
    {
        title: 'Category',
        content:
            <span>Categories are used to organize and group Connections and Schedules for better structure and navigation.</span>
        ,
        target: '#category-list-header',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Add Category',
        content:
            'Press Add Category to create a new category.',
        target: '#category-list-add',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Delete Categories',
        content:
            'Select categories that you want to delete and press here to do an action.',
        target: '#category-list-delete-selected',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Search',
        content:
            'Type here to search for a category by name.',
        target: '#collection-search-input',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Sort',
        content:
            'Click the column header to sort categories by name in ascending or descending order.',
        target: '#sort_button_name',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'View',
        content:
            'Open the category in read-only mode to review its details.',
        target: '[id^="view_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
    {
        title: 'Update',
        content:
            'Update the category name and its parent.',
        target: '[id^="update_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
    {
        title: 'Delete',
        content:
            'Permanently remove the category from the system. This action cannot be undone.',
        target: '[id^="delete_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
]

export const CategoryFormSteps: Step[] = [
    {
        title: 'General Data',
        content:
            <span>
                Define the basic information for the new category.
                <br/>
                Select a parent category to create a nested (hierarchical) structure.
            </span>,
        target: '#category-form-general-data',
        placement: 'right',
        disableBeacon: true,
    },
]

export const CategoryParentInputStep: Step[] = [{
    title: 'Parent',
    content: `Select a parent category to create a nested (hierarchical) structure.`,
    target: '',
    placement: 'right',
    disableBeacon: true,
    hideCloseButton: true,
    hideFooter: true,
}]
