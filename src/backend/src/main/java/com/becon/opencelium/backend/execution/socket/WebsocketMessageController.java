package com.becon.opencelium.backend.execution.socket;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class WebsocketMessageController {

    @MessageMapping("/scheduler")
    @SendTo("/execution/logs")
    public String broadcastLogs(@Payload String message) {
        System.out.println(message + "hello");
        return message;
    }
}
