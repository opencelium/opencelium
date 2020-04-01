import java.net.MalformedURLException;

public class TestStandalone {
    public static void main(String[] args) throws MalformedURLException, InterruptedException {

        UserTest();

        GroupTest();

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