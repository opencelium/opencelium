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

public class TestConnector {

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
            testCases.add(new TestCases("014","Connector Test Setup ","Pass"));
        } catch (Exception e) {
            testCases.add(new TestCases("014","Connector Test Setup ","Fail"));
            e.printStackTrace();
            throw e;
        }

    }

    @Test(priority = 1)
    public void ConnectorLoginTest() throws Exception {
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
                assertNotNull(driver.findElement(By.linkText("Connectors")));
                //add test case to the testcases list as pass
                testCases.add(new TestCases("015","Connector Test Login","Pass"));
                break;
            }
            catch (Exception e) {
                //add test case to the testcases list as Fail
                testCases.add(new TestCases("015","Connector Test Login","Fail"));
                throw e;
            }
        }
    }


    @Test(priority = 2)
    public void AddConnectorTest() throws Exception {
        try {
            driver.findElement(By.linkText("Connectors")).click();

            //Successfully get connections list
            driver.findElement(By.xpath("//*[text()='Success']"));


            driver.findElement(By.id("button_add_connector")).click();

            driver.findElement(By.id("input_title")).sendKeys("TestOTRS");
            driver.findElement(By.id("input_description")).sendKeys("TestOTRS Description");

            driver.findElement(By.id("input_invoker")).click();

            //Choosing OTRS
            driver.findElement(By.id("react-select-2-option-2")).click();
            TimeUnit.SECONDS.sleep(3);

            driver.findElement(By.id("navigation_next")).click();

            driver.findElement(By.id("input_otrs__url")).sendKeys("http://oc-otrs.westeurope.cloudapp.azure.com/otrs/index.pl?Action=AgentITSMConfigItem");
            driver.findElement(By.id("input_otrs__UserLogin")).sendKeys("root@localhost");
            driver.findElement(By.id("input_otrs__Password")).sendKeys("init");
            driver.findElement(By.id("input_otrs__WebService")).sendKeys("OC-Connector1");

            driver.findElement(By.id("button_test")).click();

            TimeUnit.SECONDS.sleep(5);

            //Connection successfully tested
            driver.findElement(By.xpath("//*[text()='Success']"));
            //http://oc-otrs.westeurope.cloudapp.azure.com/otrs/index.pl?Action=AgentITSMConfigItem

            //root@localhost
            //init


            testCases.add(new TestCases("016","Connector Create","Pass"));
        } catch (Exception  e) {
            testCases.add(new TestCases("016","Connector Create","Fail"));
            e.printStackTrace();
            throw e;
        }
    }

    @Test(priority = 3)
    public void UpdateConnectorTest() throws InterruptedException {
        try {
            driver.findElement(By.linkText("Connectors")).click();

            //Successfully get connections list
            driver.findElement(By.xpath("//*[text()='Success']"));


            driver.findElement(By.id("button_update_0")).click();

            //driver.findElement(By.id("input_title")).sendKeys("TestOTRS");
            driver.findElement(By.id("input_description")).sendKeys(" Description Edited");

            driver.findElement(By.id("input_invoker")).click();

            //Choosing OTRS
            //driver.findElement(By.id("react-select-2-option-2")).click();
            TimeUnit.SECONDS.sleep(3);

            driver.findElement(By.id("navigation_next")).click();

           /* driver.findElement(By.id("input_otrs__url")).sendKeys("http://oc-otrs.westeurope.cloudapp.azure.com/otrs/index.pl?Action=AgentITSMConfigItem");
            driver.findElement(By.id("input_otrs__UserLogin")).sendKeys("root@localhost");
            driver.findElement(By.id("input_otrs__Password")).sendKeys("init");
            driver.findElement(By.id("input_otrs__WebService")).sendKeys("OC-Connector1");*/

            driver.findElement(By.id("button_test")).click();

            TimeUnit.SECONDS.sleep(5);

            //Connection successfully tested
            driver.findElement(By.xpath("//*[text()='Success']"));
            //http://oc-otrs.westeurope.cloudapp.azure.com/otrs/index.pl?Action=AgentITSMConfigItem

            //root@localhost
            //init
            driver.findElement(By.xpath("//*[text()='Success']"));
            testCases.add(new TestCases("017","Connector Upgrade","Pass"));
        } catch (Exception e) {
            testCases.add(new TestCases("017","Connector Upgrade","Fail"));
            throw e;
        }
    }

    @Test(priority = 4)
    public void DeleteConnectorTest() throws InterruptedException {
        try {
            driver.findElement(By.linkText("Connectors")).click();

            //Successfully get connections list
            driver.findElement(By.xpath("//*[text()='Success']"));

            driver.findElement(By.id("button_delete_0")).click();

            driver.findElement(By.id("confirmation_cancel")); //confirmation_ok
            testCases.add(new TestCases("018","Connector Delete","Pass"));

        } catch (Exception e) {
            testCases.add(new TestCases("018","Connector Delete","Fail"));
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
