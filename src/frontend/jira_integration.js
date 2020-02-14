jQuery.ajax({
    url: "https://becon88.atlassian.net/s/d41d8cd98f00b204e9800998ecf8427e-T/-qb6i7v/b/18/e73395c53c3b10fde2303f4bf74ffbf6/_/download/batch/com.atlassian.jira.collector.plugin.jira-issue-collector-plugin:issuecollector-embededjs/com.atlassian.jira.collector.plugin.jira-issue-collector-plugin:issuecollector-embededjs.js?locale=de-DE&collectorId=cb37ee4e",
    type: "get",
    cache: true,
    dataType: "script"
});
jQuery.ajax({
    url: "https://becon88.atlassian.net/s/d41d8cd98f00b204e9800998ecf8427e-T/-qb6i7v/b/18/e73395c53c3b10fde2303f4bf74ffbf6/_/download/batch/com.atlassian.jira.collector.plugin.jira-issue-collector-plugin:issuecollector-embededjs/com.atlassian.jira.collector.plugin.jira-issue-collector-plugin:issuecollector-embededjs.js?locale=de-DE&collectorId=02e86130",
    type: "get",
    cache: true,
    dataType: "script"
});
window.ATL_JQ_PAGE_PROPS = {};
window.ATL_JQ_PAGE_PROPS.fieldValues = {description: ''};
window.ATL_JQ_PAGE_PROPS.triggerFunction = function (showCollectorDialog) {
    jQuery(document).on('click', '#support_action', function (e) {
        e.preventDefault();
        showCollectorDialog();
    });
};
