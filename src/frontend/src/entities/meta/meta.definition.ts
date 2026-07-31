import type {EntityDefinition} from "@/engine/entity/EntityDefinition.ts";
import metaWizardImage from '@/assets/images/wizard/meta.gif'

export const metaEntityDefinition: EntityDefinition = {
    name: 'MetaEntity',
    api: {
        baseUrl: 'http://localhost:3001/api/generate-entity', // POST target
        identifierField: 'name',
        resolveIdentifier: async () => [], // No suggestions needed
    },
    fields: [
        {
            name: 'name',
            type: 'string',
            label: 'Entity Name',
            defaultValue: 'child',
            ui: { component: 'input', props: { placeholder: 'e.g., Product' } },
            validation: { required: true }
        },
        {
            name: 'plural',
            type: 'string',
            defaultValue: 'children',
            label: 'Plural Name (Optional)',
            ui: { component: 'input', props: { placeholder: 'e.g., categories (default: +s)' } }
        },
        //api
        {
            name: 'api.baseUrl', // Note the nesting (dot notation for mapToApi)
            type: 'string',
            defaultValue: '/api/child',
            label: 'API Base URL',
            ui: { component: 'input', props: { placeholder: '/api/v1/products' } },
            validation: { required: true }
        },
        {
            name: 'api.identifierField',
            type: 'string',
            defaultValue: '_id',
            label: 'Identifier Field',
            ui: { component: 'input', props: { placeholder: 'email, id, slug (default: id)' } },
        },
        { name: 'api.primaryKey', type: 'string', label: 'Primary Key (URL ID)', ui: { component: 'input' } },

        {
            name: 'api.resolveIdentifier',
            type: 'other',
            label: 'Resolve Identifier Logic',
            ui: { component: 'input', overrideKey: 'codeEditor', props: { mode: 'javascript', height: '150px' } }
        },
        {
            name: 'api.mapToForm',
            type: 'other',
            label: 'Map API to Form (Read)',
            ui: { component: 'input', overrideKey: 'codeEditor', props: { mode: 'javascript', height: '100px' } }
        },
        {
            name: 'api.mapToApi',
            type: 'other',
            label: 'Map Form to API (Write)',
            ui: { component: 'input', overrideKey: 'codeEditor', props: { mode: 'javascript', height: '100px' } }
        },
        //fields
        {
            name: 'fields', // Array of FieldDefinition objects
            type: 'other',
            ui: {
                component: 'input', // fallback if overrideKey is not found
                overrideKey: 'fieldEditor' // 🟢 Key for overrideRegistry
            }
        },
        //access
        {
            name: 'access',
            type: 'other',
            label: 'Policy Rules',
            ui: {
                component: 'input',
                overrideKey: 'policyEditor',
            }
        },
        //cross validations
        {
            name: 'crossValidations',
            type: 'other',
            label: 'Cross-Field Validations',
            ui: {
                component: 'input',
                overrideKey: 'crossValidationEditor',
            }
        },
        //sections
        {
            name: 'sections',
            type: 'other',
            label: 'Form Layout Sections',
            ui: {
                component: 'input',
                overrideKey: 'sectionEditor'
            }
        },
        // wizard
        {
            name: 'wizard.overrideKey',
            type: 'string',
            label: 'Override key',
            ui: { component: 'input' }
        },
        {
            name: 'wizard.image',
            type: 'other',
            label: 'Wizard Image',
            ui: { component: 'file-dropzone' }
        },
        {
            name: 'wizard.modes',
            type: 'other',
            label: 'Active Modes & UI',
            ui: {
                component: 'input',
                overrideKey: 'wizardModeEditor'
            }
        },
        {
            name: 'wizard.recommendations',
            type: 'other',
            label: 'Help Recommendations',
            ui: {
                component: 'input',
                overrideKey: 'recommendationEditor' // Could be a mini version of FieldEditor
            }
        },

        {
            name: 'wizard.steps',
            type: 'other',
            label: 'Steps',
            ui: {
                component: 'input',
                overrideKey: 'wizardEditor' // The key for OverrideRegistry
            }
        },
    ],
    // Configure the Wizard for data collection
    sections: [
        { id: 'main', fields: ['name', 'plural'] },
        { id: 'schema', fields: ['fields'] },
        { id: 'cross-validation', fields: ['crossValidations'] },
        { id: 'api', fields: ['api.baseUrl', 'api.identifierField', 'api.primaryKey', 'api.resolveIdentifier', 'api.mapToForm', 'api.mapToApi'] },
        { id: 'access', fields: ['access'] },
        { id: 'section', fields: ['sections'] },
        {
            id: 'wizard',
            title: 'Wizard Flow & UX',
            description: 'Configure how the end-user will interact with the form steps.',
            fields: ['wizard.modes', 'wizard.recommendations', 'wizard.steps', 'wizard.image', 'wizard.overrideKey', ]
        },
    ],
    wizard: {
        image: metaWizardImage as string,
        modes: {
            create: {
                header: 'Entity Blueprint Designer',
                subheader: 'Define the structure, logic, and security of your new system entity',
            }
        },
        steps: [
            { id: 'fields-step', header: 'Field', subheader: 'Define data types, UI components, and basic validation rules for each field.', sectionIds: ['schema'] },
            { id: 'meta-step', header: 'General Info', subheader: 'Set the entity name, plural form, and core identification settings.', sectionIds: ['main'] },
            { id: 'cross-validation-step', header: 'Cross Validations', subheader: 'Configure complex validation logic that depends on multiple fields at once.', sectionIds: ['cross-validation'] },
            { id: 'api-step', header: 'API & Mapping', subheader: 'Configure backend endpoints, primary keys, and data transformation logic.', sectionIds: ['api'] },
            { id: 'access-step', header: 'Access Policy', subheader: 'Define RBAC and ABAC rules to control who can view or manage this entity.', sectionIds: ['access'] },
            { id: 'section-step', header: 'Form Section', subheader: 'Organize your fields into logical groups and layout blocks for the UI.', sectionIds: ['section'] },
            { id: 'wizard-step', header: 'Wizard UX', subheader: 'Finalize the step-by-step user flow, including images and success messages.', sectionIds: ['wizard'] },
        ]
    },
};
