import java.net.MalformedURLException;

public class TestStandalone {
    public static void main(String[] args) throws MalformedURLException, InterruptedException {

        String testName = System.getProperty("test");

        if(testName.contentEquals("user_test")) {
            UserTest();
        }
        else if(testName.contentEquals("group_test")){
            GroupTest();
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