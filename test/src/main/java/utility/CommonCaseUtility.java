package utility;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.testng.Assert;

import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.testng.Assert.assertNotNull;

public class CommonCaseUtility {

    public static void Login(WebDriver driver, List<TestCases> testCases, String mLogin, String mPassword, String testID, String testName) throws InterruptedException {

        WebElement element_login=driver.findElement (By.id("login_email"));
        element_login.sendKeys(mLogin);
        TimeUnit.SECONDS.sleep(2);
        WebElement element_password=driver.findElement (By.id("login_password"));
        element_password.sendKeys(mPassword);
        TimeUnit.SECONDS.sleep(2);
        WebElement buttonConnect=driver.findElement(By.xpath("//button"));
        buttonConnect.click();
        TimeUnit.SECONDS.sleep(2);

        for (int second = 0;; second++) {
            if (second >= 5) Assert.fail("timeout");

            try {
                assertNotNull(driver.findElement(By.linkText("Users")));
                //add test case to the testcases list as pass
                testCases.add(new TestCases(testID,testName,"Pass"));
                break;
            }
            catch (Exception e) {
                //add test case to the testcases list as Fail
                testCases.add(new TestCases(testID,testName,"Fail"));
                throw e;
            }
        }
    }

    public static void Logout(WebDriver driver, List<TestCases> testCases,String testID, String testName){
        try {
            WebElement buttonLogout=driver.findElement (By.id("menu_logout"));
            Assert.assertNotNull(buttonLogout);
            buttonLogout.click();


            WebElement elementOk = driver.findElement(By.id("confirmation_ok"));

            Assert.assertNotNull(elementOk);
            elementOk.click();

            WebElement element_login=driver.findElement (By.id("login_email"));
            Assert.assertNotNull(element_login);

            testCases.add(new TestCases(testID,testName,"Pass"));

        } catch (Exception e) {
            testCases.add(new TestCases(testID,testName,"Fail"));
            e.printStackTrace();
        }
    }
}
