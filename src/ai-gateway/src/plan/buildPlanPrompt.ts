import type { WorkflowConnectors } from '../dsl/buildConstrainedSchema.ts'
import { describeConnector } from '../workflow/buildWorkflowPrompt.ts'

/**
 * The sync skeleton is OpenCelium's "config item create/update" template in general terms. Small models do not infer
 * this structure from "sync A to B"; given the skeleton they only have to fill in operations and fields.
 */
const SYNC_SKELETON = `pattern "sync" (keep the target in step with the source: create what is missing, update what exists).
Lines marked [optional] are left out when the request does not need them; every other line is required.
depth 0: Read the source items with <source list operation> (<filter>).
depth 0: [optional] For each source item (loop over the <source list operation> result):
depth 1:   [optional] Read <detail> with <source detail operation>, using the item's <id field>. One such step per detail the request names (e.g. location, contacts).
depth 0: After that loop: search the existing target items with <target search/list operation>.
depth 0: If the <target search operation> result <id list field> exists:
depth 1:   [optional] Get the existing items with <target get operation> using the <id list field> (when the search returns ids only).
depth 1:   For each source item (a new loop over the <source list operation> result):
depth 2:     If the existing items' <match field>s do not contain the item's <source match field>: create it with <target create operation>.
depth 2:     If the existing items' <match field>s contain the item's <source match field>: update it with <target update operation>.
depth 0: If the <target search operation> result <id list field> is empty:
depth 1:   For each source item (a new loop over the <source list operation> result): create it with <target create operation>.
(then "fieldRules" for the create and update operations: the match field plus every mapping the request names)`

export function buildPlanSystemPrompt(connectors: WorkflowConnectors): string {
    const sections = [describeConnector('from', connectors.from)]
    if (connectors.to) sections.push(describeConnector('to', connectors.to))

    return `You plan integration workflows for OpenCelium. Answer with JSON only.

Turn the user's request into a short plan of steps in plain language, for a person to review before the workflow is built.
Steps describe the flow only; the values written into fields go into "fieldRules", never into the steps.
- Each step is one action and names the exact operation it uses (as listed below).
- "depth" is nesting: a step runs inside the closest loop or condition above it with a smaller depth.
- A loop's items are only available inside it; to go over the same list again later, start a new loop over the same operation result.
- Name the fields that are compared or copied, using the field names listed below.

"fieldRules" lists what each target operation sets, one entry per field: {"operations":[...],"field":"<request body
field>","value":"<value>"}. Give every field the request mentions, for every operation that writes it (create and
update). A field may also be a new attribute below an object field listed for the operation (e.g.
ConfigItem.CIXMLData.<Attribute>) when the request names it. "value" is one of:
  item <source field>             copy a value from the current source item (or "<Operation> <field>" for another step's result)
  "<text>"                        a fixed value
  script: <what it computes>      when the value must be computed: mapping one value to another, finding an item in a
                                  list, combining several values or building an object. Say in plain words which values
                                  it reads and what it returns, e.g. script: "Operational" when the item cmdb_status_title
                                  is "in operation", otherwise "Incident".
An update usually also needs the id of the existing item it changes: a script that finds the existing item whose match
field equals the source item's match field and returns its id.
- Do not invent operations or fields. Keep the plan as short as the request allows.

Choose "pattern":
- "sync" when the request keeps a target in step with a source (sync, mirror, create or update, upsert). Follow this skeleton,
  filled with real operation and field names, keeping every required line:
${SYNC_SKELETON}
- "custom" for anything else; plan the steps freely.

${sections.join('\n\n')}`
}

