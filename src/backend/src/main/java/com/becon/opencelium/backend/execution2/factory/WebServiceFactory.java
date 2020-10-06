package com.becon.opencelium.backend.execution2.factory;

import com.becon.opencelium.backend.execution2.http.RestClient;
import com.becon.opencelium.backend.execution2.http.SoapClient;
import com.becon.opencelium.backend.execution2.http.WebServiceClient;

public class WebServiceFactory<T> {

    public WebServiceClient<T> newService(String type){
        switch (type) {
            case "rest":
                return new RestClient<>();
            case "soap":
                return new SoapClient<>();
            default:
                throw new RuntimeException("Web service not found");
        }
    }
}
