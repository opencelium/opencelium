package tests;

import constants.Constants;
import org.openqa.selenium.*;
import org.openqa.selenium.logging.LogType;
import org.openqa.selenium.logging.LoggingPreferences;
import org.openqa.selenium.remote.CapabilityType;
import org.openqa.selenium.remote.DesiredCapabilities;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.testng.Assert;
import org.testng.annotations.AfterTest;
import org.testng.annotations.BeforeTest;
import org.testng.annotations.Test;
import utility.TestCases;
import utility.TestResultXmlUtility;

import javax.xml.parsers.ParserConfigurationException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;

import static org.testng.Assert.assertNotNull;

public class TestConnections {

    WebDriver driver;

    String mLogin;
    String mPassword;
    String mHubUrl;
    String mAppUrl;

    TestResultXmlUtility testResultXmlUtility=new TestResultXmlUtility();
    //create a list object that will contain number of test cases
    List<TestCases> testCases =new ArrayList<TestCases>();

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


        //System.setProperty("webdriver.chrome.driver", "/home/selenium/Downloads/chromedriver");
        DesiredCapabilities desiredCapabilities = new DesiredCapabilities();
        desiredCapabilities.setBrowserName("firefox");
        desiredCapabilities.setPlatform(Platform.LINUX);
        desiredCapabilities.setCapability(CapabilityType.LOGGING_PREFS, logs);


        driver = new RemoteWebDriver(new URL(mHubUrl),desiredCapabilities);
    }



    @Test(priority = 0)
    public void SimpleTest() throws Exception{
        try {
            driver.get(mAppUrl);
            Assert.assertEquals("OpenCelium", driver.getTitle());
            testCases.add(new TestCases("019","Connection Test Setup ","Pass"));
        } catch (Exception e) {
            testCases.add(new TestCases("019","Connection Test Setup ","Fail"));
            e.printStackTrace();
            throw e;
        }

    }


    @Test(priority = 1)
    public void ConnectionLoginTest() throws Exception {
        //driver.get(baseUrl+"login");

        driver.navigate().to(mAppUrl +"login");

        driver.manage().timeouts().implicitlyWait(10, TimeUnit.SECONDS);

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
                assertNotNull(driver.findElement(By.linkText("Connections")));
                //add test case to the testcases list as pass
                testCases.add(new TestCases("020","Connections Test Login","Pass"));
                break;
            }
            catch (Exception e) {
                //add test case to the testcases list as Fail
                testCases.add(new TestCases("020","Connections Test Login","Fail"));
                throw e;
            }
        }
    }


    @Test(priority = 2)
    public void AddConnectionTest() throws Exception {

        try {
            driver.findElement(By.linkText("Connections")).click();

            //Successfully get connections list
            driver.findElement(By.xpath("//*[text()='Success']"));
            driver.findElement(By.id("button_add_connection")).click();

            driver.findElement(By.id("input_connection_title")).sendKeys("TestConnection");

            driver.findElement(By.id("from_connector")).findElement(By.xpath("//*[text()='Connector']")).click();
            driver.findElement(By.id("react-select-2-option-0")).click();
            TimeUnit.SECONDS.sleep(2);

            driver.findElement(By.id("to_connector")).findElement(By.xpath("//*[text()='Connector']")).click();
            driver.findElement(By.id("react-select-3-option-1")).click();
            TimeUnit.SECONDS.sleep(2);

            driver.findElement(By.id("navigation_next")).click();

            driver.findElement(By.id("navigation_next")).click();

            driver.findElement(By.id("add_item_fromConnector")).click();
            driver.findElement(By.id("items_menu_fromConnector")).click();
            driver.findElement(By.id("react-select-4-option-0")).click();

            driver.findElement(By.id("add_item_toConnector")).click();
            driver.findElement(By.id("items_menu_toConnector")).click();
            driver.findElement(By.id("react-select-5-option-1")).click();


            TimeUnit.SECONDS.sleep(1);

            JavascriptExecutor js = (JavascriptExecutor) driver;
            js.executeScript("window.scrollBy(0,document.body.scrollHeight)");

            driver.findElement(By.id("button_add")).click();
            TimeUnit.SECONDS.sleep(2);
            driver.findElement(By.xpath("//*[text()='Success']"));
            TimeUnit.SECONDS.sleep(3);

            testCases.add(new TestCases("021","Create Connection Test","Pass"));

        } catch (Exception e) {
            testCases.add(new TestCases("021","Create Connection Test","Fail"));
            e.printStackTrace();
            throw e;
        }

    }

    @Test(priority = 3)
    public void UpdateConnectionTest() throws Exception {

        try {
            driver.findElement(By.linkText("Connections")).click();

            //Successfully get connections list
            driver.findElement(By.xpath("//*[text()='Success']"));

            driver.findElement(By.id("button_update_0")).click();

            driver.findElement(By.id("input_connection_title")).clear();
            driver.findElement(By.id("input_connection_title")).sendKeys("TestConnection Edited");

            driver.findElement(By.id("navigation_next")).click();

            driver.findElement(By.id("button_update")).click();
            TimeUnit.SECONDS.sleep(2);
            driver.findElement(By.xpath("//*[text()='Success']"));

            testCases.add(new TestCases("022","Update Connection Test","Pass"));

        } catch (Exception e) {
            testCases.add(new TestCases("022","Update Connection Test","Fail"));
            e.printStackTrace();
            throw e;
        }
    }

    @Test(priority = 4)
    public void DeleteConnectionTest() throws InterruptedException {
        try {
            driver.findElement(By.linkText("Connections")).click();

            //Successfully get connections list
            driver.findElement(By.xpath("//*[text()='Success']"));
            TimeUnit.SECONDS.sleep(2);
            driver.findElement(By.id("button_delete_0")).click();
            TimeUnit.SECONDS.sleep(2);
            driver.findElement(By.id("confirmation_ok")).click();; //confirmation_ok
            TimeUnit.SECONDS.sleep(3);
            driver.findElement(By.xpath("//*[text()='Success']"));
            testCases.add(new TestCases("023","Connection Delete","Pass"));

        } catch (Exception e) {
            testCases.add(new TestCases("023","Connection Delete","Fail"));
            e.printStackTrace();
            throw e;
        }
    }


        @AfterTest
        public void afterTest() throws ParserConfigurationException {
        driver.close();
        //write the test result to xml file with file name TestResult
        testResultXmlUtility.WriteTestResultToXml("TestResult.xml", testCases);
    }
}
