package utility;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.testng.Assert;

import java.util.List;
import java.util.Random;
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

    public static void CreateConnection(WebDriver driver, List<TestCases> testCases,String testID, String testName){
        try {
            driver.findElement(By.linkText("Connections")).click();

            //Successfully get connections list
            TimeUnit.SECONDS.sleep(4);
            driver.findElement(By.xpath("//*[text()='Success']"));
            driver.findElement(By.id("button_add_connection")).click();

            TimeUnit.SECONDS.sleep(2);
            driver.findElement(By.id("input_connection_title")).sendKeys("TestConnection"+ Math.random());

            driver.findElement(By.id("from_connector")).findElement(By.xpath("//*[text()='Connector']")).click();
            driver.findElement(By.id("react-select-2-option-0")).click();
            TimeUnit.SECONDS.sleep(2);

            driver.findElement(By.id("to_connector")).findElement(By.xpath("//*[text()='Connector']")).click();
            driver.findElement(By.id("react-select-3-option-1")).click();
            TimeUnit.SECONDS.sleep(2);

            JavascriptExecutor js = (JavascriptExecutor) driver;
            js.executeScript("window.scrollBy(0,document.body.scrollHeight)");
            driver.findElement(By.id("navigation_next")).click();

            TimeUnit.SECONDS.sleep(3);
            js.executeScript("window.scrollBy(0,document.body.scrollHeight)");
            driver.findElement(By.id("navigation_next")).click();

            driver.findElement(By.id("add_item_fromConnector")).click();
            driver.findElement(By.id("items_menu_fromConnector")).click();
            driver.findElement(By.id("react-select-4-option-0")).click();

            driver.findElement(By.id("add_item_toConnector")).click();
            driver.findElement(By.id("items_menu_toConnector")).click();
            driver.findElement(By.id("react-select-5-option-1")).click();


            TimeUnit.SECONDS.sleep(1);

            //JavascriptExecutor js = (JavascriptExecutor) driver;
            js.executeScript("window.scrollBy(0,document.body.scrollHeight)");

            driver.findElement(By.id("button_add")).click();
            TimeUnit.SECONDS.sleep(2);
            driver.findElement(By.xpath("//*[text()='Success']"));
            TimeUnit.SECONDS.sleep(3);

            testCases.add(new TestCases(testID,testName,"Pass"));
        } catch (Exception e) {
            testCases.add(new TestCases(testID,testName,"Fail"));
            e.printStackTrace();
        }
    }

}
