import { parseInvoker } from '../src/invokers/parseInvoker.ts'

export const sourceXml = `<?xml version="1.0" encoding="UTF-8"?>
<invoker type="RESTful">
    <name>Tracker</name>
    <description>Issue tracker</description>
    <requiredData>
        <item name="url" type="string" visibility="public">https://example.test</item>
        <item name="token" type="string" visibility="private"/>
    </requiredData>
    <operations>
        <operation name="ping" type="test">
            <request><method>GET</method><endpoint>{url}/ping</endpoint></request>
        </operation>
        <operation name="ListIssues" type="">
            <request>
                <method>get</method>
                <endpoint>{url}/projects/{PROJECT}/issues</endpoint>
                <body data="raw" format="json" type="object"></body>
            </request>
            <response>
                <success status="200">
                    <body data="raw" format="json" type="object">
                        <field name="issues" type="array">
                            <field name="key" type="string"/>
                            <field name="fields" type="object">
                                <field name="summary" type="string"/>
                                <field name="priority" type="object">
                                    <field name="name" type="string"/>
                                </field>
                            </field>
                        </field>
                    </body>
                </success>
            </response>
        </operation>
    </operations>
</invoker>`

export const targetXml = `<?xml version="1.0" encoding="UTF-8"?>
<invoker type="RESTful">
    <name>Helpdesk</name>
    <description>Ticket system</description>
    <requiredData><item name="url" type="string"/><item name="apikey" type="string"/></requiredData>
    <operations>
        <operation name="CreateTicket" type="">
            <request>
                <method>POST</method>
                <endpoint>{url}/tickets</endpoint>
                <body data="raw" format="json" type="object">
                    <field name="title" type="string"/>
                    <field name="apikey" type="string">{apikey}</field>
                    <field name="article" type="object">
                        <field name="body" type="string"/>
                    </field>
                </body>
            </request>
            <response>
                <success status="201">
                    <body data="raw" format="json" type="object">
                        <field name="id" type="string"/>
                    </body>
                </success>
            </response>
        </operation>
    </operations>
</invoker>`

export const tracker = parseInvoker(sourceXml)
export const helpdesk = parseInvoker(targetXml)
export const connectors = { from: tracker, to: helpdesk }

/** "Create a ticket for every issue" — valid against the fixtures. */
export const validWorkflow = {
    steps: [
        {
            id: 's1',
            kind: 'method',
            connector: 'from',
            operation: 'ListIssues',
            params: [{ name: 'PROJECT', value: { literal: 'OC' } }],
            fields: [],
        },
        {
            id: 's2',
            kind: 'loop',
            over: { step: 's1', path: 'issues' },
            body: [
                {
                    id: 's3',
                    kind: 'method',
                    connector: 'to',
                    operation: 'CreateTicket',
                    params: [],
                    fields: [{ name: 'title', value: { ref: { step: 's2', path: 'fields.summary' } } }],
                },
            ],
        },
    ],
}
