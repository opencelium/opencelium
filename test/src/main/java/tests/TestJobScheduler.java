package tests;

import constants.Constants;
import org.openqa.selenium.By;
import org.openqa.selenium.Platform;
import org.openqa.selenium.WebDriver;
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

public class TestJobScheduler {
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
            testCases.add(new TestCases("024","Job Test Setup ","Pass"));
        } catch (Exception e) {
            testCases.add(new TestCases("024","Job Test Setup ","Fail"));
            e.printStackTrace();
            throw e;
        }

    }

    @Test(priority = 1)
    public void JobLoginTest() throws Exception {
        CommonCaseUtility.Login(driver,testCases,mLogin,mPassword,"025", "Job Test Login");

    }

    @Test(priority = 2)
    public void AddJobTest() throws Exception {
        try {
            driver.findElement(By.linkText("Scheduler")).click();
            TimeUnit.SECONDS.sleep(2);
            driver.findElement(By.xpath("//*[text()='Success']"));

            driver.findElement(By.id("add_title")).sendKeys("Test Job");
            TimeUnit.SECONDS.sleep(2);

            driver.findElement(By.id("input_connection")).click();
            TimeUnit.SECONDS.sleep(2);
            driver.findElement(By.id("react-select-2-option-0")).click();
            TimeUnit.SECONDS.sleep(2);
            driver.findElement(By.id("add_cron")).sendKeys("0 0 0 ? * * *"); //every month

            TimeUnit.SECONDS.sleep(2);
            driver.findElement(By.id("button_add_job")).click();


            TimeUnit.SECONDS.sleep(2);
            driver.findElement(By.xpath("//*[text()='Success']"));
            testCases.add(new TestCases("026","Create Job Test","Pass"));
        } catch (Exception e) {
            testCases.add(new TestCases("026","Create Job Test","Fail"));
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
