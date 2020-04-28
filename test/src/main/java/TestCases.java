public class TestCases {
    //test case Id string
    private String testCaseId;
    //test case name string
    private String testCaseName;
    //test result status string
    private String TestCaseResultStatus;
    //construct a test case object
    public TestCases(String testcaseid, String testcasename, String testresultstatus)
    {
        this.setTestCaseId(testcaseid);
        this.setTestCaseName(testcasename);
        this.setTestCaseResultStatus(testresultstatus);
    }
    /**
     * @return the testCaseResultStatus
     */
    public String getTestCaseResultStatus() {
        return TestCaseResultStatus;
    }

    /**
     * @param testCaseResultStatus the testCaseResultStatus to set
     */
    public void setTestCaseResultStatus(String testCaseResultStatus) {
        TestCaseResultStatus = testCaseResultStatus;
    }

    /**
     * @return the testCaseName
     */
    public String getTestCaseName() {
        return testCaseName;
    }

    /**
     * @param testCaseName the testCaseName to set
     */
    public void setTestCaseName(String testCaseName) {
        this.testCaseName = testCaseName;
    }

    /**
     * @return the testCaseId
     */
    public String getTestCaseId() {
        return testCaseId;
    }

    /**
     * @param testCaseId the testCaseId to set
     */
    public void setTestCaseId(String testCaseId) {
        this.testCaseId = testCaseId;
    }
}
