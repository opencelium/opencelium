import ActionCreators from "../../redux_toolkit/action_creators";

const {
    deleteTemplateById, updateTemplate, importTemplate, exportTemplate, updateTemplates,
    deleteTemplatesById, addTemplate, getAllTemplates, getTemplateById,
} = ActionCreators;

export default {
    fulfilled: {
        [deleteTemplateById.fulfilled.type]: "The template <1><0>{{name}}</0></1> was successfully removed",
        [deleteTemplatesById.fulfilled.type]: "The selected templates were successfully removed",
        [addTemplate.fulfilled.type]: "The template <1><0>{{name}}</0></1> of the <3><0>{{title}}</0></3> was successfully added",
        [updateTemplate.fulfilled.type]: "The template <1><0>{{name}}</0></1> was successfully updated",
        [updateTemplates.fulfilled.type]: "The templates were successfully updated",
        [importTemplate.fulfilled.type]: "The Template <1><0>{{name}}</0></1> was successfully imported",
        [exportTemplate.fulfilled.type]: "The Template <1><0>{{name}}</0></1> was successfully downloaded",
    },
    rejected: {
        [deleteTemplateById.rejected.type]: {
            "__DEFAULT__": "The template was not removed"
        },
        [deleteTemplatesById.rejected.type]: {
            "__DEFAULT__": "The selected templates were not removed"
        },
        [getTemplateById.rejected.type]: {
            "__DEFAULT__": "There is an error fetching template."
        },
        [getAllTemplates.rejected.type]: {
            "__DEFAULT__": "There is an error fetching templates."
        },
        [addTemplate.rejected.type]: {
            "__DEFAULT__": "The template was not added"
        },
        [updateTemplate.rejected.type]: {
            "__DEFAULT__": "The template was not updated"
        },
        [updateTemplates.rejected.type]: {
            "__DEFAULT__": "The templates were not updated"
        },
        [importTemplate.rejected.type]: {
            "__DEFAULT__": "The template was not imported"
        },
        [exportTemplate.rejected.type]: {
            "__DEFAULT__": "The template was not downloaded"
        },
    },
}