import constants.Constants;
import tests.*;

import javax.xml.parsers.ParserConfigurationException;
import java.net.MalformedURLException;
import java.util.concurrent.ExecutionException;

public class TestStandalone {
    public static void main(String[] args) throws Exception {


        String testName = System.getProperty("test");

        String testLogin = System.getProperty("login");
        String testPassword = System.getProperty("pass");

        String testHubUrl = System.getProperty("hub");
        String testAppUrl = System.getProperty("url");


        if(testLogin==null){
            testLogin = Constants.USERNAME;
        }

        if(testPassword==null){
            testPassword = Constants.PASSWORD;
        }

        if(testHubUrl==null){
            testHubUrl = Constants.HUB_URL;
        }

        if(testAppUrl ==null){
            testAppUrl = Constants.APP_URL;
        }

        if ( testName != null )
        {
            if(testName.contentEquals("user_test")) {
                UserTest(testLogin,testPassword,testHubUrl,testAppUrl);
            }
            else if(testName.contentEquals("group_test")){
                GroupTest(testLogin,testPassword,testHubUrl,testAppUrl);
            }
            else if(testName.contentEquals("job_test")){
                JobTest();
            }
            else if(testName.contentEquals("connector_test")){
                ConnectorTest();
            }
        }
        else {
            JobTest();
        }



    }

    private static void LoginTest(String login, String password, String hubUrl, String appUrl) throws MalformedURLException, InterruptedException {
        TestLoginout testLogin = new TestLoginout();
        testLogin.setUp();
        testLogin.LoginTest();
    }

    private static void UserTest(String login, String password, String hubUrl, String appUrl) throws MalformedURLException, InterruptedException, ParserConfigurationException {
        TestUser testUser = new TestUser();

        testUser.setUp();

        testUser.SimpleTest();

        testUser.LoginTest();

        testUser.AddUserTest();

        testUser.UpdateUserTest();

        testUser.DeleteUserTest();

        testUser.afterTest();
    }

    private static void GroupTest(String login, String password, String hubUrl, String appUrl) throws MalformedURLException, InterruptedException, ParserConfigurationException {

        TestGroup testGroup = new TestGroup();
        testGroup.setUp();
        testGroup.SimpleTest();
        testGroup.LoginTest();
        testGroup.AddGroupTest();
        testGroup.UpdateGroupTest();
        testGroup.DeleteGroupTest();
        testGroup.afterTest();

    }

    private static void ConnectorTest() throws Exception{
        TestConnector testConnector = new TestConnector();
        testConnector.setUp();
        testConnector.SimpleTest();
        testConnector.ConnectorLoginTest();
        testConnector.AddConnectorTest();
    }

    private static void JobTest() throws Exception {
        TestJobScheduler test = new TestJobScheduler();

        test.setUp();
        test.SimpleTest();
        test.JobLoginTest();
        test.AddJobTest();
        test.StartJobTest();
        test.afterTest();

    }


}