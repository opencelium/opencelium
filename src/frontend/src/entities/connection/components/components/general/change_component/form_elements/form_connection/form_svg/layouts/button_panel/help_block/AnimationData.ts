import { IAnimationData } from "./interfaces";
import {
  enhancementInitialConnection,
  fieldMappingInitiaConnection
} from "@change_component/form_elements/form_connection/form_svg/layouts/button_panel/help_block/InitialConnections";


const animationData: IAnimationData = {
  apiMethods: {
    fromConnector: {
      invoker: {
        name: "otrs"
      },
      items: [
        {
          index: "0",
          type: "process",
          name: "TicketSearch",
          endpoint: {},
          body: [],
          response: true,
          scripts: [
            {
              functionId: "clickOnPanel",
              text: "You can create a method clicking on the connector box."
            },
            {
              functionId: "changeElementNameOrType",
              text: "Select name of the method.."
            },
            {
              functionId: "openUrlDialog",
              text: "Here, you can change the endpoint"
            },
            {
              functionId: "showPopoverForOpenBodyDialog",
              text: "Here, you can change the body."
            },
            {
              functionId: "showResponse",
              text: "Toggling the arrow, you can see the info about the response of the method."
            },
          ]
        },
        {
          index: "1",
          type: "process",
          name: "TicketGet",
          label: "Ticket"
        },
      ]
    },
    toConnector: {
      invoker: {
        name: "otrs"
      },
      items: [],
    }
  },
  operators: {
    fromConnector: {
      invoker: {
        name: "otrs",
      },
      items: [
        {
          index: "0",
          type: "process",
          name: "TicketSearch",
          label: "Tickets",
          scripts: [
            {
              functionId: "clickOnPanel",
              text: "Let's create a method for searching tickets."
            }
          ]
        },
        {
          index: "1",
          type: "operator",
          name: "loop",
          scripts: [
            {
              functionId: "showPopoverForCreateElement",
              text: "After we create a loop operator."
            },
            {
              functionId: "changeLeftMethod",
              text: "Select method."
            },
            {
              functionId: "setFocusOnLeftParam",
              text: "Select its params."
            }
          ],
          conditionForLoop: {
            leftStatement: {
              fromConnector: "fromConnector",
              leftMethodIndex: "0",
              leftParam: "TicketID[*]"
            }
          }
        },
        {
          index: "1_0",
          type: "operator",
          name: "if",
          toDown: true,
          scripts: [
            {
              functionId: "changeRelationalOperator",
              text: "In the loop we check if the ticket is not null"
            },
            {
              functionId: "",
              text: "After we get a detailed info of the ticket."
            },
          ],
          conditionForIf: {
            leftStatement: {
              fromConnector: "fromConnector",
              leftMethodIndex: "0",
              leftParam: "[0].id"
            },
            relationalOperator: "NotNull",
          }
        },
        {
          index: "1_0_0",
          name: "TicketGet",
          type: "process",
          toDown: true
        },
        {
          index: "1_1",
          type: "process",
          name: "TicketCreate",
          after: "1_0",
          afterElementType: "operator",
          scripts: [
            {
              functionId: "showPopoverForCreateElement",
              text: "After operator we also can define an element in his scope (down) or after (right)."
            }
          ]
        },
      ]
    },
    toConnector: {
      invoker: {
        name: "otrs"
      },
      items: []
    },
  },
  fieldMapping: {
    fromConnector: {
      invoker: {
        name: "otrs",
      },
      items: [
        {
          index: "0",
          name: "ConfigItemSearch",
          type: "process",
        }
      ]
    },
    toConnector: {
      invoker: {
        name: "otrs"
      },
      items: [
        {
          index: "0",
          type: "process",
          name: "ConfigItemSearch",
          scripts: [
            {
              functionId: "changeElementNameOrType",
              text: "Lets create a method to get all ids of config items."
            },
          ]
        },
        {
          index: "1",
          type: "process",
          name: "ConfigItemGet",
          scripts: [
            {
              functionId: "changeElementNameOrType",
              text: "After we can obtain the full info about each item with ConfigItemGet"
            },
            {
              functionId: "showPopoverForBodyRemoveKeysButton",
              text: "If the property is an array, please remove it and create again"
            },
            {
              functionId: "showPopoverForBodyAddKeysButton",
              text: "Create a reference in body"
            },
            {
              functionId: "showPopoverForAddBodyKeyValue",
              text: "Just type # and you will see a list of available methods"
            },
            {
              functionId: "changeBodyParam",
              text: "Select ConfigItemIDs[*]"
            },
          ],
          body: [
            {
              available: true,
              keyName: "ConfigItemID",
              deleteKey: true,
            },
            {
              keyName: "ConfigItemID",
              keyValue: "#",
              reference: [
                {
                  method: [
                    {
                      fromConnector: "toConnector",
                      index: "0",
                      param: "ConfigItemIDs[*]"
                    }
                  ]
                }
              ]
            },
          ]
        },
      ]
    }
  },
  enhancement: {
    fromConnector: {
      invoker: {
        name: "otrs",
      },
      items: [
        {
          index: "0",
          name: "ConfigItemSearch",
          type: "process",
        }
      ]
    },
    toConnector: {
      invoker: {
        name: "otrs"
      },
      items: [
        {
          index: "0",
          type: "process",
          name: "ConfigItemSearch",
          label: "ConfigItems"
        },
        {
          index: "1",
          type: "process",
          name: "ConfigItemGet",
          label: "GetItem",
          body: [
            {
              available: true,
              keyName: "ConfigItemID",
              deleteKey: true,
            },
            {
              keyName: "ConfigItemID",
              keyValue: "#",
              reference: [
                {
                  method: [
                    {
                      fromConnector: "toConnector",
                      index: "0",
                      param: "ConfigItemIDs[*]"
                    }
                  ]
                }
              ]
            },
          ]
        },
        {
          index: "2",
          name: "loop",
          type: "operator",
          scripts: [
            {
              functionId: "changeElementNameOrType",
              text: "Imagine we have all items info and want to delete all that tenant equals to i-doit"
            }
          ],
          conditionForLoop: {
            leftStatement: {
              fromConnector: "toConnector",
              leftMethodIndex: "1",
              leftParam: "ConfigItem[*]"
            }
          }
        },
        {
          index: "2_0",
          name: "if",
          type: "operator",
          after: "2",
          afterElementType: "operator",
          toDown: true,
          scripts: [
            {
              functionId: "openConditionDialog",
              text: "We create a condition"
            },
            {
              functionId: "setFocusOnLeftParam",
              text: "Here we define what should be compared"
            },
            {
              functionId: "setFocusOnRightParam",
              text: "Here we define the comparable value"
            },
          ],
          conditionForIf: {
            leftStatement: {
              fromConnector: "toConnector",
              leftMethodIndex: "1",
              leftParam: "ConfigItem[i].CIXMLData.Tenant"
            },
            relationalOperator: "=",
            rightStatement: {
              rightParam: "i-doit"
            }
          } 
        },
        {
          index: "2_0_0",
          name: "ConfigItemDelete",
          type: "process",
          toDown: true,
          after: "2_0",
          afterElementType: "operator",
          scripts: [
            {
              functionId: "changeElementNameOrType",
              text: "After we create a delete method"
            },
            {
              functionId: "showPopoverForOpenBodyDialog",
              text: "We open body"
            },
            {
              functionId: "showPopoverForBodyRemoveKeysButton",
              text: "If the property is an array, please remove it and create again"
            },
            {
              functionId: "showPopoverForBodyAddKeysButton",
              text: "For ConfigItemID we Create a reference"
            },
            {
              functionId: "clickOnReferenceElements",
              text: "Clicking on the reference we can define an enhancement"
            },
            {
              functionId: "changeReferenceContent",
              text: "Here we can manipulate with the data as needed."
            },
          ],
          body: [
            {
              available: true,
              keyName: "ConfigItemID",
              deleteKey: true,
            },
            {
              keyName: "ConfigItemID",
              keyValue: "#",
              reference: [
                {
                  method: [
                    {
                      fromConnector: "toConnector",
                      index: "1",
                      param: "ConfigItemIDs[*]"
                    }
                  ],
                  enhancementContent: "RESULT_VAR = [VAR_0.ConfigItemID];"
                }
              ]
            },
          ]
        },
        {
          index: "2_1",
          name: "if",
          type: "operator",
          after: "2_0",
          afterElementType: "operator",
          conditionForIf: {
            leftStatement: {
              fromConnector: "toConnector",
              leftMethodIndex: "1",
              leftParam: "ConfigItem[i].CIXMLData.Tenant"
            },
            relationalOperator: "=",
            rightStatement: {
              rightParam: "otrs"
            }
          }
        },
        {
          index: "2_1_0",
          name: "ConfigItemUpdate",
          type: "process",
          after: "2_1",
          afterElementType: "operator",
          toDown: true,
          body: [
            {
              available: true,
              keyName: "InciState",
              keyValue: "#",
              reference: [
                {
                  method: [
                    {
                      fromConnector: "toConnector",
                      index: "1",
                      param: "ConfigItem[i].InciState"
                    }
                  ],
                  enhancementContent: "RESULT_VAR = \"Operational\"\;\n\nif(VAR_0 != \"Operational\"){\n\tRESULT_VAR =\"Incident\";\n}",
                }
              ]
            },
            {
              available: true,
              keyName: "Name",
              keyValue: "#",
              reference: [
                {
                  method: [
                    {
                      fromConnector: "toConnector",
                      index: "1",
                      param: "ConfigItem[i].Name"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
  }
};

export default animationData;
