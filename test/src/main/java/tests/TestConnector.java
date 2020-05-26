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
import utility.CommonCaseUtility;
import utility.TestCases;
import utility.TestResultXmlUtility;

import javax.xml.parsers.ParserConfigurationException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;
import static utility.CommonCaseUtility.*;

public class TestConnector {

    WebDriver driver;

    String mLogin;
    String mPassword;
    String mHubUrl;
    String mAppUrl;
    String mInvoker;

    TestResultXmlUtility testResultXmlUtility=new TestResultXmlUtility();
    //create a list object that will contain number of test cases
    List<TestCases> testCases =new ArrayList<TestCases>();

    @BeforeTest
    public void setUp() throws MalformedURLException {

        mLogin = Constants.USERNAME;
        mPassword = Constants.PASSWORD;
        mHubUrl = Constants.HUB_URL;
        mAppUrl = Constants.APP_URL;

        /*if(invokerName!=null)
            mInvoker = invokerName;
        else {
            mInvoker = "otrs";
        }*/
        mInvoker = "otrs";

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
        CommonCaseUtility.Login(driver,testCases,mLogin,mPassword,"015","Connector Test Login");
    }


    @Test(priority = 2)
    public void AddConnectorTest() throws Exception {
        try {
            driver.findElement(By.linkText("Connectors")).click();
            TimeUnit.SECONDS.sleep(3);
            //Successfully get connections list
            //driver.findElement(By.xpath("//*[text()='Success']"));

            driver.findElement(By.id("button_add_connector")).click();
            TimeUnit.SECONDS.sleep(3);

            switch (mInvoker){
                case "otrs":
                    AddOTRS(driver);
                    break;
                case "idoit":
                    AddIdoit(driver);
                    break;
                case "sensu":
                    AddSensu(driver);
                    break;
                case "zabbix":
                    AddZabbix(driver);
                    break;
                case "icinga2":
                    AddIcinga2(driver);
                    break;
                case "opennms":
                    AddOpenNMS(driver);
                    break;
                default:
                    AddOTRS(driver);
            }

            TimeUnit.SECONDS.sleep(5);

            //Connection successfully tested
            driver.findElement(By.xpath("//*[text()='TestOTRS']"));
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
            /*TimeUnit.SECONDS.sleep(3);
            //Successfully get connections list
            driver.findElement(By.xpath("//*[text()='Success']"));*/

            driver.findElement(By.id("button_update_0")).click();

            TimeUnit.SECONDS.sleep(3);

            //driver.findElement(By.id("input_title")).sendKeys("TestOTRS");
            driver.findElement(By.id("input_description")).sendKeys(" Description Edited Success");

            driver.findElement(By.id("input_invoker")).click();

            TimeUnit.SECONDS.sleep(3);

            driver.findElement(By.id("navigation_next")).click();


            driver.findElement(By.id("button_test")).click();

            TimeUnit.SECONDS.sleep(3);

            //Connection successfully tested
            //driver.findElement(By.xpath("//*[text()='Success']"));

            driver.findElement(By.xpath("//*[text()='Success']"));
            testCases.add(new TestCases("017","Connector Update","Pass"));
        } catch (Exception e) {
            testCases.add(new TestCases("017","Connector Update","Fail"));
            throw e;
        }
    }

    @Test(priority = 4)
    public void DeleteConnectorTest() throws InterruptedException {
        try {
            driver.findElement(By.linkText("Connectors")).click();
            TimeUnit.SECONDS.sleep(3);
            //Successfully get connections list
            //driver.findElement(By.xpath("//*[text()='Success']"));

            driver.findElement(By.id("button_delete_0")).click();

            driver.findElement(By.id("confirmation_ok")).click(); //change to confirmation_ok for deleting
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
