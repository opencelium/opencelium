package com.becon.opencelium.backend.execution.oc721;

import com.becon.opencelium.backend.constant.RegExpression;
import com.becon.opencelium.backend.enums.RelationalOperator;
import com.becon.opencelium.backend.resource.execution.OperatorEx;
import com.becon.opencelium.backend.reference.utility.ReferenceUtility;

import static com.becon.opencelium.backend.enums.RelationalOperator.FOR;
import static com.becon.opencelium.backend.enums.RelationalOperator.FOR_IN;
import static com.becon.opencelium.backend.enums.RelationalOperator.SPLIT_STRING;

public class Loop {
    private String ref;
    private String delimiter;
    private String iterator;
    private int index;
    private String value;
    private RelationalOperator operator;

    public static Loop fromOperator(OperatorEx operatorEx) {
        Loop loop = new Loop();
        loop.setIterator(operatorEx.getIterator());

        String expression = operatorEx.getExpression();
        String wrappedDirectRef = ReferenceUtility.extractReference(expression, RegExpression.wrappedDirectRef);

        if (expression.startsWith(FOR_IN.getName())) {
            configureForInLoop(loop, expression, wrappedDirectRef);
            return loop;
        }

        if (expression.startsWith(FOR.getName())) {
            loop.setOperator(FOR);
            loop.setRef(wrappedDirectRef);
            return loop;
        }

        configureSplitStringLoop(loop, expression, wrappedDirectRef);
        return loop;
    }

    public static boolean isIterator(String str) {
        return str != null && str.length() == 1 && Character.isLetter(str.charAt(0));
    }

    public String getRef() {
        return ref;
    }

    private void setRef(String ref) {
        this.ref = ref;
    }

    public String getDelimiter() {
        return delimiter;
    }

    private void setDelimiter(String delimiter) {
        this.delimiter = delimiter;
    }

    public String getIterator() {
        return iterator;
    }

    private void setIterator(String iterator) {
        this.iterator = iterator;
    }

    public int getIndex() {
        return index;
    }

    public void setIndex(int index) {
        this.index = index;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public RelationalOperator getOperator() {
        return operator;
    }

    private void setOperator(RelationalOperator operator) {
        this.operator = operator;
    }

    private static void configureForInLoop(Loop loop, String expression, String wrappedDirectRef) {
        loop.setOperator(FOR_IN);

        String ref = wrappedDirectRef != null
                ? buildIterableDirectRef(wrappedDirectRef)
                : buildIterableWebhookRef(expression);

        loop.setRef(ref); // ['*']~ - is appended automatically
    }

    private static String buildIterableDirectRef(String wrappedDirectRef) {
        return wrappedDirectRef.substring(2, wrappedDirectRef.length() - 2) + "['*']~";
    }

    private static String buildIterableWebhookRef(String expression) {
        String webhookRef = ReferenceUtility.extractReference(expression, RegExpression.webhook);

        int colonIndex = webhookRef.contains(":")
                ? webhookRef.indexOf(":")
                : webhookRef.length() - 1;

        return webhookRef.substring(0, colonIndex) + "['*']~" + webhookRef.substring(colonIndex);
    }

    private static void configureSplitStringLoop(Loop loop, String expression, String wrappedDirectRef) {
        if (wrappedDirectRef == null) {
            throw new IllegalArgumentException(
                    ReferenceUtility.getContainedReferenceAndType(expression) + " is not supported for SPLIT_STRING"
            );
        }

        loop.setOperator(SPLIT_STRING);
        loop.setRef(wrappedDirectRef);

        String delimiter = expression.replace(wrappedDirectRef, "")
                .replace(SPLIT_STRING.getName(), "")
                .replace("'", "")
                .trim();

        loop.setDelimiter(delimiter);
    }
}
