export const HelpBlockData = {
  nodeId: null,
  connectionId: null,
  title: "test",
  description: "",
  fromConnector: {
    nodeId: null,
    connectorId: 5,
    title: null,
    invoker: { name: "i-doit" },
    methods: [
      {
        name: "idoit.version",
        request: {
          endpoint: "{url}",
          body: {
            type: "object",
            format: "json",
            data: "raw",
            fields: {
              method: "idoit.version",
              id: "1",
              params: { apikey: "{apikey}", language: "de" },
              version: "2.0",
            },
          },
          method: "POST",
        },
        response: {
          success: {
            status: "200",
            body: {
              type: "object",
              format: "json",
              data: "raw",
              fields: { result: { version: "" } },
            },
          },
          fail: {
            status: "200",
            body: {
              type: "object",
              format: "json",
              data: "raw",
              fields: { error: { code: "", data: "", message: "" } },
            },
          },
        },
        index: "0",
        label: null,
        color: "#FFCFB5",
      },
      {
        name: "idoit.version",
        request: {
          endpoint: "{url}",
          body: {
            type: "object",
            format: "json",
            data: "raw",
            fields: {
              method: "idoit.version",
              id: "1",
              params: { apikey: "{apikey}", language: "de" },
              version: "2.0",
            },
          },
          method: "POST",
        },
        response: {
          success: {
            status: "200",
            body: {
              type: "object",
              format: "json",
              data: "raw",
              fields: { result: { version: "" } },
            },
          },
          fail: {
            status: "200",
            body: {
              type: "object",
              format: "json",
              data: "raw",
              fields: { error: { code: "", data: "", message: "" } },
            },
          },
        },
        index: "1_0",
        label: null,
        color: "#98BEC7",
      },
      {
        name: "idoit.version",
        request: {
          endpoint: "{url}",
          body: {
            type: "object",
            format: "json",
            data: "raw",
            fields: {
              method: "idoit.version",
              id: "1",
              params: { apikey: "{apikey}", language: "de" },
              version: "2.0",
            },
          },
          method: "POST",
        },
        response: {
          success: {
            status: "200",
            body: {
              type: "object",
              format: "json",
              data: "raw",
              fields: { result: { version: "" } },
            },
          },
          fail: {
            status: "200",
            body: {
              type: "object",
              format: "json",
              data: "raw",
              fields: { error: { code: "", data: "", message: "" } },
            },
          },
        },
        index: "1_1",
        label: null,
        color: "#C77E7E",
      },
      {
        name: "idoit.search",
        request: {
          endpoint: "{url}",
          body: {
            type: "object",
            format: "json",
            data: "raw",
            fields: {
              method: "idoit.search",
              id: "1",
              params: { q: "", apikey: "{apikeyd}", language: "" },
              version: "2.0",
            },
          },
          method: "POST",
        },
        response: {
          success: {
            status: "200",
            body: {
              type: "object",
              format: "json",
              data: "raw",
              fields: { result: [{ documentId: "", value: "", key: "" }] },
            },
          },
          fail: {
            status: "200",
            body: {
              type: "object",
              format: "json",
              data: "raw",
              fields: { error: { code: "", data: "", message: "" } },
            },
          },
        },
        index: "1_2",
        label: null,
        color: "#F0E4E4",
      },
      {
        name: "idoit.version",
        request: {
          endpoint: "{url}",
          body: {
            type: "object",
            format: "json",
            data: "raw",
            fields: {
              method: "idoit.version",
              id: "1",
              params: { apikey: "{apikey}", language: "de" },
              version: "2.0",
            },
          },
          method: "POST",
        },
        response: {
          success: {
            status: "200",
            body: {
              type: "object",
              format: "json",
              data: "raw",
              fields: { result: { version: "" } },
            },
          },
          fail: {
            status: "200",
            body: {
              type: "object",
              format: "json",
              data: "raw",
              fields: { error: { code: "", data: "", message: "" } },
            },
          },
        },
        index: "1_3_0",
        label: null,
        color: "#E6E6EA",
      },
      {
        name: "idoit.version",
        request: {
          endpoint: "{url}",
          body: {
            type: "object",
            format: "json",
            data: "raw",
            fields: {
              method: "idoit.version",
              id: "1",
              params: { apikey: "{apikey}", language: "de" },
              version: "2.0",
            },
          },
          method: "POST",
        },
        response: {
          success: {
            status: "200",
            body: {
              type: "object",
              format: "json",
              data: "raw",
              fields: { result: { version: "" } },
            },
          },
          fail: {
            status: "200",
            body: {
              type: "object",
              format: "json",
              data: "raw",
              fields: { error: { code: "", data: "", message: "" } },
            },
          },
        },
        index: "1_3_1",
        label: null,
        color: "#F4B6C2",
      },
      {
        name: "idoit.version",
        request: {
          endpoint: "{url}",
          body: {
            type: "object",
            format: "json",
            data: "raw",
            fields: {
              method: "idoit.version",
              id: "1",
              params: { apikey: "{apikey}", language: "de" },
              version: "2.0",
            },
          },
          method: "POST",
        },
        response: {
          success: {
            status: "200",
            body: {
              type: "object",
              format: "json",
              data: "raw",
              fields: { result: { version: "" } },
            },
          },
          fail: {
            status: "200",
            body: {
              type: "object",
              format: "json",
              data: "raw",
              fields: { error: { code: "", data: "", message: "" } },
            },
          },
        },
        index: "1_3_2",
        label: null,
        color: "#E41298",
      },
      {
        name: "idoit.version",
        request: {
          endpoint: "{url}",
          body: {
            type: "object",
            format: "json",
            data: "raw",
            fields: {
              method: "idoit.version",
              id: "1",
              params: { apikey: "{apikey}", language: "de" },
              version: "2.0",
            },
          },
          method: "POST",
        },
        response: {
          success: {
            status: "200",
            body: {
              type: "object",
              format: "json",
              data: "raw",
              fields: { result: { version: "" } },
            },
          },
          fail: {
            status: "200",
            body: {
              type: "object",
              format: "json",
              data: "raw",
              fields: { error: { code: "", data: "", message: "" } },
            },
          },
        },
        index: "1_4",
        label: null,
        color: "#BFC798",
      },
      {
        name: "idoit.version",
        request: {
          endpoint: "{url}",
          body: {
            type: "object",
            format: "json",
            data: "raw",
            fields: {
              method: "idoit.version",
              id: "1",
              params: { apikey: "{apikey}", language: "de" },
              version: "2.0",
            },
          },
          method: "POST",
        },
        response: {
          success: {
            status: "200",
            body: {
              type: "object",
              format: "json",
              data: "raw",
              fields: { result: { version: "" } },
            },
          },
          fail: {
            status: "200",
            body: {
              type: "object",
              format: "json",
              data: "raw",
              fields: { error: { code: "", data: "", message: "" } },
            },
          },
        },
        index: "2",
        label: null,
        color: "#9EC798",
      },
    ],
    operators: [
      {
        index: "1",
        type: "if",
        condition: {
          leftStatement: {
            color: "#FFCFB5",
            field: "success.result.version",
            type: "response",
            rightPropertyValue: "",
          },
          relationalOperator: "NotNull",
          rightStatement: null,
        },
        iterator: null,
      },
      {
        index: "1_3",
        type: "if",
        condition: {
          leftStatement: {
            color: "#C77E7E",
            field: "success.result.version",
            type: "response",
            rightPropertyValue: "",
          },
          relationalOperator: "IsNull",
          rightStatement: null,
        },
        iterator: null,
      },
    ],
  },
  toConnector: {
    nodeId: null,
    connectorId: 5,
    title: null,
    invoker: { name: "i-doit" },
    methods: [],
    operators: [],
  },
  fieldBinding: [],
};
