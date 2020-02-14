##################
Configure Connectors
##################

Connector is the core component in Open Celium. It is a system to which we will send requests and get responses. They are can be different throw different protocols: HTTP, JSON-RPC, SOAP, and so on. Currently, HTTP and JSON-RPC are available.  When you create a new connector, you need to provide the general information: a title (required field), a description, and an invoker (required field). The invoker defined what kind of system the connector is. At the present time, it can be i-doit or SENSU. Depending on the invoker, the next step requires the corresponding credential data. If it is i-doit, then url and api-key. If SENSU, then login and password. For any invoker you need to input url. Before add the connector, you should test the connection with the entered credentials. You will see a notification if something is wrong or test was successfully completed. 
