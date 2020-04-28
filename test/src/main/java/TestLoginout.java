import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.logging.LogType;
import org.openqa.selenium.logging.LoggingPreferences;
import org.openqa.selenium.remote.CapabilityType;
import org.openqa.selenium.remote.DesiredCapabilities;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.testng.Assert;
import org.testng.annotations.AfterTest;
import org.testng.annotations.BeforeTest;
import org.testng.annotations.Test;

import javax.xml.parsers.ParserConfigurationException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;

import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertNotNull;

public class TestLoginout {

    WebDriver driver;

    String mLogin;
    String mPassword;
    String mHubUrl;
    String mAppUrl;

    TestResultXmlUtility testResultXmlUtility=new TestResultXmlUtility();
    //create a list object that will contain number of test cases
    List<TestCases> testcases=new ArrayList<TestCases>();


    @BeforeTest
    public void setUp() throws MalformedURLException {
        mLogin = Constants.USERNAME;
        mPassword = Constants.PASSWORD;
        mHubUrl = Constants.HUB_URL;
        mAppUrl = Constants.APP_URL;

        LoggingPreferences logs = new LoggingPreferences();
        logs.enable(LogType.BROWSER, Level.ALL);
        logs.enable(LogType.CLIENT, Level.ALL);
        logs.enable(LogType.DRIVER, Level.ALL);
        logs.enable(LogType.PERFORMANCE, Level.ALL);
        logs.enable(LogType.SERVER, Level.ALL);
        logs.enable(LogType.PROFILER, Level.ALL);

        DesiredCapabilities desiredCapabilities = new DesiredCapabilities();
        desiredCapabilities.setBrowserName("firefox");

        desiredCapabilities.setCapability(CapabilityType.LOGGING_PREFS, logs);


        try {
            driver = new RemoteWebDriver(new URL(mHubUrl),desiredCapabilities);

            driver.navigate().to(mAppUrl +"login");

            driver.manage().timeouts().implicitlyWait(10, TimeUnit.SECONDS);

            String windowsHandle=driver.getWindowHandle();
            //assert that a window has been launched
            assertEquals(true, windowsHandle.length()>0);
            //add a test case to the testcases list as pass
            testcases.add(new TestCases("001","Test Setup ","Pass"));
        } catch (Exception e) {
            e.printStackTrace();
            testcases.add(new TestCases("001","Login Setup ","Fail"));
        }


    }

    @Test(priority = 0)
    public void LoginTest(){
        WebElement element_login=driver.findElement (By.id("login_email"));
        element_login.sendKeys(mLogin);
        WebElement element_password=driver.findElement (By.id("login_password"));
        element_password.sendKeys(mPassword);
        WebElement buttonConnect=driver.findElement(By.xpath("//button"));

        buttonConnect.click();

        for (int second = 0;; second++) {
            if (second >= 20) Assert.fail("timeout");

            try {
                assertNotNull(driver.findElement(By.linkText("Users")));
                //add test case to the testcases list as pass
                testcases.add(new TestCases("002","Login Test","Pass"));
                break;
            }
            catch (Exception e) {
                //add test case to the testcases list as Fail
                testcases.add(new TestCases("002","Login Test","Fail"));
            }
        }

    }

    @Test(priority = 1)
    public void LogoutTest(){
        try {
        WebElement buttonLogout=driver.findElement (By.id("menu_logout"));
        Assert.assertNotNull(buttonLogout);
        buttonLogout.click();


        WebElement elementOk = driver.findElement(By.id("confirmation_ok"));

        Assert.assertNotNull(elementOk);
        elementOk.click();

        WebElement element_login=driver.findElement (By.id("login_email"));
        Assert.assertNotNull(element_login);

        testcases.add(new TestCases("003","Logout Test","Pass"));
        } catch (Exception e) {
            testcases.add(new TestCases("003","Logout Test","Fail"));
            e.printStackTrace();
        }

    }

    @AfterTest
    public void afterTest() throws ParserConfigurationException {
        driver.close();
        //write the test result to xml file with file name TestResult
        testResultXmlUtility.WriteTestResultToXml("TestResult.xml", testcases);
        //quit the driver
        //driver.quit();
    }
}
