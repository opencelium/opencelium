import java.net.MalformedURLException;

public class TestStandalone {
    public static void main(String[] args) throws MalformedURLException, InterruptedException {


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
        }
        else {
            UserTest(testLogin,testPassword,testHubUrl,testAppUrl);
        }



    }


    private static void GroupTest(String login, String password, String hubUrl, String appUrl) throws MalformedURLException, InterruptedException {

        TestGroup testGroup = new TestGroup();
        testGroup.setUp(login,password,hubUrl,appUrl);

        testGroup.SimpleTest();
        testGroup.AddGroupTest();
        testGroup.UpdateGroupTest();
        testGroup.DeleteGroupTest();

        testGroup.afterTest();

    }

    private static void UserTest(String login, String password, String hubUrl, String appUrl) throws MalformedURLException, InterruptedException {
        TestUser testUser = new TestUser();

        testUser.setUp(login,password,hubUrl,appUrl);

        testUser.SimpleTest();

        testUser.LoginTest();

        testUser.AddUserTest();

        testUser.UpdateUserTest();

        testUser.DeleteUserTest();

        testUser.afterTest();
    }
}