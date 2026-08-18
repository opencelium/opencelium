package com.becon.opencelium.backend.utility;

import com.becon.opencelium.backend.constant.RegExpression;
import org.apache.commons.lang3.StringUtils;

import java.util.regex.Pattern;

public class TestNameUtils {

    private static final String TEST_CONN_PREFIX = "!*test_connection_";
    private static final String TEST_SCHEDULE_PREFIX = "!*test_schedule_";
    private static final String TEST_SCHEDULE_PREFIX_RGX = "^!\\*test_schedule_\\d+_";
    private static final Pattern TEST_CONNECTION_PATTERN = Pattern.compile(RegExpression.TEST_CONNECTION_REGEX);
    private static final Pattern TEST_SCHEDULER_PATTERN = Pattern.compile(RegExpression.TEST_SCHEDULE_REGEX);

    private TestNameUtils() {
    }

    public static String generateTestConnectionName(String title) {
        return TEST_CONN_PREFIX + System.currentTimeMillis() + "_" + (title == null ? StringUtils.EMPTY : title);
    }

    public static String generateTestSchedulerName(String title) {
        return TEST_SCHEDULE_PREFIX + System.currentTimeMillis() + "_" + (title == null ? StringUtils.EMPTY : title);
    }

    public static boolean isTestConnection(String title) {
        return title != null && TEST_CONNECTION_PATTERN.matcher(title).matches();
    }

    public static boolean isNotTestConnection(String title) {
        return title != null && !TEST_CONNECTION_PATTERN.matcher(title).matches();
    }

    public static boolean isTestScheduler(String title, String postfix) {
        return title != null && title.matches(TEST_SCHEDULE_PREFIX_RGX + postfix);
    }

    public static boolean isNotTestScheduler(String title) {
        return title != null && !TEST_SCHEDULER_PATTERN.matcher(title).matches();
    }
}
