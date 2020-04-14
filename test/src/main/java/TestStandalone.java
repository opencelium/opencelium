import java.net.MalformedURLException;

public class TestStandalone {
    public static void main(String[] args) throws MalformedURLException, InterruptedException {


        String testName = System.getProperty("test");

        String testLogin = System.getProperty("login");
        String testPassword = System.getProperty("pass");

        String testHubUrl = System.getProperty("hub");
        String testUrl = System.getProperty("url");

        if ( testName != null )
        {
        if(testName.contentEquals("user_test")) {
            UserTest();
        }
        else if(testName.contentEquals("group_test")){
            GroupTest();
        }
        }

        else {
            UserTest();
        }



    }


    private static void GroupTest() throws MalformedURLException, InterruptedException {

        TestGroup testGroup = new TestGroup();
        testGroup.setUp();

        testGroup.SimpleTest();
        testGroup.AddGroupTest();
        testGroup.UpdateGroupTest();
        testGroup.DeleteGroupTest();

        testGroup.afterTest();

    }

    private static void UserTest() throws MalformedURLException, InterruptedException {
        TestUser testUser = new TestUser();

        testUser.setUp();

        testUser.SimpleTest();

        testUser.LoginTest();

        testUser.AddUserTest();

        testUser.UpdateUserTest();

        testUser.DeleteUserTest();

        testUser.afterTest();
    }
}