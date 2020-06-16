package tests;

import constants.Constants;
import net.lightbody.bmp.BrowserMobProxy;
import net.lightbody.bmp.BrowserMobProxyServer;
import net.lightbody.bmp.client.ClientUtil;
import net.lightbody.bmp.core.har.Har;
import net.lightbody.bmp.proxy.CaptureType;
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

import static org.testng.Assert.assertNotNull;

public class TestConnections {

    WebDriver driver;
    BrowserMobProxy proxy;

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



        // start the proxy
        proxy = new BrowserMobProxyServer();
        proxy.start(0);

        // get the Selenium proxy object
        Proxy seleniumProxy = ClientUtil.createSeleniumProxy(proxy);

        // configure it as a desired capability
        DesiredCapabilities capabilities = new DesiredCapabilities();
        capabilities.setCapability(CapabilityType.PROXY, seleniumProxy);

        capabilities.setBrowserName("firefox");
        capabilities.setPlatform(Platform.LINUX);


        //System.setProperty("webdriver.chrome.driver", "/home/selenium/Downloads/chromedriver");
        DesiredCapabilities desiredCapabilities = new DesiredCapabilities();
        desiredCapabilities.setBrowserName("firefox");
        desiredCapabilities.setPlatform(Platform.LINUX);
        desiredCapabilities.setCapability(CapabilityType.LOGGING_PREFS, logs);

        // enable more detailed HAR capture, if desired (see CaptureType for the complete list)
        proxy.enableHarCaptureTypes(CaptureType.REQUEST_CONTENT, CaptureType.RESPONSE_CONTENT);

        // create a new HAR with the label "yahoo.com"
        proxy.newHar(mHubUrl);



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

        CommonCaseUtility.Login(driver,testCases,mLogin,mPassword,"020","Connections Test Login");
        //Har har = proxy.getHar();
        //System.console().printf("HAR "+ har.getLog());
    }


    @Test(priority = 2)
    public void AddConnectionTest() throws Exception {

        try {
            driver.findElement(By.linkText("Connections")).click();

            //Successfully get connections list
            TimeUnit.SECONDS.sleep(4);
            //driver.findElement(By.xpath("//*[text()='Success']"));
            driver.findElement(By.id("button_add_connection")).click();

            TimeUnit.SECONDS.sleep(2);
            driver.findElement(By.id("input_connection_title")).sendKeys("TestConnection");

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

            TimeUnit.SECONDS.sleep(7);
            //Successfully get connections list
            //driver.findElement(By.xpath("//*[text()='Success']"));

            driver.findElement(By.id("button_update_0")).click();

            TimeUnit.SECONDS.sleep(3);

            driver.findElement(By.id("input_connection_title")).clear();
            driver.findElement(By.id("input_connection_title")).sendKeys("TestConnection Edited");

            JavascriptExecutor js = (JavascriptExecutor) driver;
            js.executeScript("window.scrollBy(0,document.body.scrollHeight)");

            driver.findElement(By.id("navigation_next")).click();
            TimeUnit.SECONDS.sleep(3);
            js.executeScript("window.scrollBy(0,document.body.scrollHeight)");
            driver.findElement(By.id("button_update")).click();
            TimeUnit.SECONDS.sleep(3);
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
            TimeUnit.SECONDS.sleep(5);

            //Successfully get connections list
            //driver.findElement(By.xpath("//*[text()='Success']"));
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
