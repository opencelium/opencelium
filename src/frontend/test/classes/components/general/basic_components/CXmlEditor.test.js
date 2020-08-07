import CXmlEditor from "@classes/components/general/basic_components/xml_editor/CXmlEditor.js";
const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<invoker type="RESTful">
    <name>trello</name>
    <description>trello description</description>
    <hint>This interface provides the apikey auth. First you need to create a apikey token (https://trello.com/app-key/). Check out the documentation https://developer.atlassian.com/cloud/trello/rest/</hint>
    <requiredData>
        <item name="url" type="string" visibility="private">https://api.trello.com</item>
        <item name="username" type="string" visibility="public"/>
        <item name="key" type="string" visibility="public"/>
        <item name="token" type="string" visibility="protected"/>
    </requiredData>
    <authType>endpointAuth</authType>
    <operations>
        <operation name="GetBoards" type="test">
            <request>
                <method>GET</method>
                <endpoint>{url}/1/members/{username}/boards?key={key}&amp;token={token}</endpoint>
                <header>
                    <item name="Content-Type" type="string">application/json</item>
                </header>
                <body/>
            </request>
            <response>
                <success status="200">
                    <header/>
                    <body/>
                </success>
                <fail status="401">
                    <header/>
                    <body/>
                </fail>
            </response>
        </operation>
        <operation name="GetBoardList" type="">
            <request>
                <method>GET</method>
                <endpoint>{url}/1/boards/{BOARDID}/lists?key={key}&amp;token={token}"</endpoint>
                <header>
                    <item name="Content-Type" type="string">application/json</item>
                </header>
                <body/>
            </request>
            <response>
                <success status="200">
                    <header/>
                    <body>
                        <field name="id" type="string"/>
                        <field name="name" type="string"/>
                        <field name="closed" type="string"/>
                        <field name="pos" type="string"/>
                        <field name="softLimit" type="string"/>
                        <field name="idBoard" type="string"/>
                        <field name="subscribed" type="string"/>
                    </body>
                </success>
                <fail status="400">
                    <header/>
                    <body/>
                </fail>
            </response>
        </operation>
        <operation name="GetLabelsList" type="">
            <request>
                <method>GET</method>
                <endpoint>{url}/1/boards/{BOARDID}/lists?key={key}&amp;token={token}"</endpoint>
                <header>
                    <item name="Content-Type" type="string">application/json</item>
                </header>
                <body/>
            </request>
            <response>
                <success status="200">
                    <header/>
                    <body>
                        <field name="id" type="string"/>
                        <field name="idBoard" type="string"/>
                        <field name="name" type="string"/>
                        <field name="pos" type="string"/>
                        <field name="color" type="string"/>
                    </body>
                </success>
                <fail status="400">
                    <header/>
                    <body/>
                </fail>
            </response>
        </operation>
        <operation name="GetListCards" type="">
            <request>
                <method>GET</method>
                <endpoint>{url}/1/list/{LISTID}/cards?key={key}&amp;token={token}"</endpoint>
                <header>
                    <item name="Content-Type" type="string">application/json</item>
                </header>
                <body/>
            </request>
            <response>
                <success status="200">
                    <header/>
                    <body>
                        <field name="id" type="string"/>
                        <field name="name" type="string"/>
                        <field name="shortUrl" type="string"/>
                        <field name="dateLastActivity" type="string"/>
                        <field name="desc" type="string"/>
                        <field name="badges" type="object">
                            <field name="comments" type="string"/>
                            <field name="labels" type="array">
                                <field name="id" type="string"/>
                                <field name="idBoard" type="string"/>
                                <field name="name" type="string"/>
                                <field name="color" type="string"/>
                            </field>
                        </field>
                    </body>
                </success>
                <fail status="400">
                    <header/>
                    <body/>
                </fail>
            </response>
        </operation>
        <operation name="GetCardAttachments" type="">
            <request>
                <method>GET</method>
                <endpoint>{url}/1/cards/{CARDID}/attachments?key={key}&amp;token={token}"</endpoint>
                <header>
                    <item name="Content-Type" type="string">application/json</item>
                </header>
                <body/>
            </request>
            <response>
                <success status="200">
                    <header/>
                    <body>
                        <field name="id" type="string"/>
                        <field name="name" type="string"/>
                        <field name="date" type="string"/>
                        <field name="url" type="string"/>
                        <field name="edgeColor" type="string"/>
                        <field name="previews" type="array">
                            <field name="id" type="string"/>
                            <field name="url" type="string"/>
                            <field name="scaled" type="string"/>
                            <field name="bytes" type="string"/>
                            <field name="height" type="string"/>
                            <field name="width" type="string"/>
                        </field>
                    </body>
                </success>
                <fail status="400">
                    <header/>
                    <body/>
                </fail>
            </response>
        </operation>
        <operation name="GetCardComments" type="">
            <request>
                <method>GET</method>
                <endpoint>{url}/1/cards/{CARDID}/actions?key={key}&amp;token={token}&amp;filter=commentCard"</endpoint>
                <header>
                    <item name="Content-Type" type="string">application/json</item>
                </header>
                <body/>
            </request>
            <response>
                <success status="200">
                    <header/>
                    <body>
                        <field name="id" type="string"/>
                        <field name="date" type="string"/>
                        <field name="idMemberCreator" type="string"/>
                        <field name="data" type="object">
                            <field name="text" type="string"/>
                        </field>
                    </body>
                </success>
                <fail status="400">
                    <header/>
                    <body/>
                </fail>
            </response>
        </operation>
        <operation name="AddCard" type="">
            <request>
                <method>POST</method>
                <endpoint>{url}/1/cards?key={key}&amp;token={token}&amp;idList={LISTID}&amp;name={NAME}&amp;idMembers={MEMBERID}&amp;idLabels={LABELID}&amp;"</endpoint>
                <header>
                    <item name="Content-Type" type="string">application/json</item>
                </header>
                <body/>
            </request>
            <response>
                <success status="200">
                    <header/>
                    <body>
                        <field name="id" type="string"/>
                        <field name="dateLastActivity" type="string"/>
                    </body>
                </success>
                <fail status="400">
                    <header/>
                    <body/>
                </fail>
            </response>
        </operation>
        <operation name="AddCardAttachment" type="">
            <request>
                <method>POST</method>
                <endpoint>{url}/1/cards/{CARDID}/attachments?key={key}&amp;token={token}&amp;name={NAME}&amp;url={URL}"</endpoint>
                <header>
                    <item name="Content-Type" type="string">multipart/form-data</item>
                </header>
                <body/>
            </request>
            <response>
                <success status="200">
                    <header/>
                    <body>
                        <field name="id" type="string"/>
                        <field name="date" type="string"/>
                    </body>
                </success>
                <fail status="400">
                    <header/>
                    <body/>
                </fail>
            </response>
        </operation>
        <operation name="AddCardComment" type="">
            <request>
                <method>POST</method>
                <endpoint>{url}/1/cards/{CARDID}/actions/comments?key={key}&amp;token={token}&amp;text={TEXT}"</endpoint>
                <header>
                    <item name="Content-Type" type="string">application/json</item>
                </header>
                <body/>
            </request>
            <response>
                <success status="200">
                    <header/>
                    <body>
                        <field name="id" type="string"/>
                        <field name="date" type="string"/>
                        <field name="idMemberCreator" type="string"/>
                        <field name="data" type="object">
                            <field name="text" type="string"/>
                        </field>
                    </body>
                </success>
                <fail status="400">
                    <header/>
                    <body/>
                </fail>
            </response>
        </operation>
    </operations>
</invoker>`;
describe.only('CXmlEditor class', () => {

    test.only('Check convertToXml', () => {
        const received = CXmlEditor.createXmlEditor(xml).convertToXml();
        const expected = xml;
        expect(received).toBe(expected);
    });
});