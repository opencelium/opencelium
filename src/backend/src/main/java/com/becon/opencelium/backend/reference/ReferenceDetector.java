package com.becon.opencelium.backend.reference;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.becon.opencelium.backend.constant.RegExpression.directRef;
import static com.becon.opencelium.backend.constant.RegExpression.enhancement;
import static com.becon.opencelium.backend.constant.RegExpression.pageRef;
import static com.becon.opencelium.backend.constant.RegExpression.requestData;
import static com.becon.opencelium.backend.constant.RegExpression.webhook;
import static com.becon.opencelium.backend.constant.RegExpression.wrappedDirectRef;

public class ReferenceDetector {
    public static boolean containsReference(String expression) {
        if (expression == null) {
            return false;
        }

        Pattern pattern = Pattern.compile(directRef + "|" + wrappedDirectRef + "|" + enhancement + "|" + webhook + "|" + pageRef + "|" + requestData);
        Matcher matcher = pattern.matcher(expression);

        return matcher.find();
    }
}
