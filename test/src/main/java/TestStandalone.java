import java.net.MalformedURLException;

public class TestStandalone {
    public static void main(String[] args) throws MalformedURLException {

        UserTest();

        GroupTest();

    }


    private static void GroupTest() throws MalformedURLException {

        TestGroup testGroup = new TestGroup();
        testGroup.setUp();

        testGroup.afterTest();

    }

    private static void UserTest() throws MalformedURLException {
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