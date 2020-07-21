import React from 'react';
import Tag from "@basic_components/xml_editor/Tag";
import CXmlEditor from "@classes/components/general/basic_components/CXmlEditor";

const xml = `
<?xml version="1.0" encoding="UTF-8" ?>
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
                    <header>
                    </header>
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
                    <header>
                    </header>
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
                    <header>
                    </header>
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
                    <header>
                    </header>
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
                    <header>
                    </header>
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
                    <header>
                    </header>
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
                    <header>
                    </header>
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
                    <header>
                    </header>
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
</invoker>
`;

class XmlEditor extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            xml: CXmlEditor.createXmlEditor(xml),
        };
    }

    updateXml(){
        this.setState({xml: this.state.xml});
    }

    deleteCoreTag(){
        const {xml} = this.state;
        xml.removeCoreTag();
        this.updateXml();
    }

    deleteDeclaration(){
        const {xml} = this.state;
        xml.removeDeclaration();
        this.updateXml();
    }

    render() {
        const {xml} = this.state;
        return(
            <React.Fragment>
                {xml.declaration && <Tag tag={xml.declaration} isDeclaration update={::this.updateXml} deleteTag={::this.deleteDeclaration}/>}
                {xml.tag && <Tag tag={xml.tag} update={::this.updateXml} deleteTag={::this.deleteCoreTag}/>}
            </React.Fragment>
        );
    }

}

export default XmlEditor;