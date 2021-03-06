package tests;

import constants.Constants;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.logging.LogType;
import org.openqa.selenium.logging.LoggingPreferences;
import org.openqa.selenium.remote.CapabilityType;
import org.openqa.selenium.remote.DesiredCapabilities;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
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

public class TestGroup {

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


        DesiredCapabilities desiredCapabilities = new DesiredCapabilities();
        desiredCapabilities.setBrowserName("firefox");

        desiredCapabilities.setCapability(CapabilityType.LOGGING_PREFS, logs);


        driver = new RemoteWebDriver(new URL(mHubUrl),desiredCapabilities);

    }

    @Test(priority = 0)
    public void SimpleTest(){
        try {
            driver.get(mAppUrl);
            Assert.assertEquals("OpenCelium", driver.getTitle());
            testCases.add(new TestCases("009","Group Test Setup ","Pass"));
        } catch (Exception e) {
            testCases.add(new TestCases("009","Group Test Setup ","Fail"));
            e.printStackTrace();
            throw e;
        }

    }

    @Test(priority = 1)
    public void LoginTest() throws InterruptedException {
        CommonCaseUtility.Login(driver,testCases,mLogin,mPassword,"010","Group Test Login");
    }



    @Test(priority = 2)
    public void AddGroupTest() throws InterruptedException {
        try {
            WebDriverWait wait = new WebDriverWait(driver, 10);
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.linkText("Groups")));
            WebElement elementG = driver.findElement(By.linkText("Groups"));
            elementG.click();

            JavascriptExecutor js = (JavascriptExecutor) driver;
            js.executeScript("window.scrollBy(0,document.body.scrollHeight)");

            TimeUnit.SECONDS.sleep(2);

            WebElement addGroupButton = driver.findElement(By.id("button_add_group"));
            addGroupButton.click();

            TimeUnit.SECONDS.sleep(2);

            WebElement inputRole = driver.findElement(By.id("input_role"));
            inputRole.sendKeys("tests.TestGroup");

            WebElement inputDescription = driver.findElement(By.id("input_description"));
            inputDescription.sendKeys("Filling Test Description");

            WebElement buttonNext = driver.findElement(By.id("navigation_next"));
            buttonNext.click();

            TimeUnit.SECONDS.sleep(2);

            WebElement setRoles = driver.findElement(By.id("input_components"));
            setRoles.click();

            WebElement groupPermSchedule = driver.findElement(By.id("react-select-2-option-2"));
            groupPermSchedule.click();

            setRoles.click();

            WebElement groupPerm = driver.findElement(By.id("react-select-2-option-5"));
            groupPerm.click();

            WebElement buttonNext1 = driver.findElement(By.id("navigation_next"));
            buttonNext1.click();

            TimeUnit.SECONDS.sleep(2);
            WebElement checkBoxAdmin = driver.findElement(By.id("input_admin"));
            JavascriptExecutor executor = (JavascriptExecutor)driver;
            executor.executeScript("arguments[0].click();", checkBoxAdmin);

            WebElement buttonAdd = driver.findElement(By.id("button_add"));
            buttonAdd.click();

            TimeUnit.SECONDS.sleep(3);

            driver.navigate().to(mAppUrl+"usergroups");
            TimeUnit.SECONDS.sleep(3);
            Assert.assertNotNull(driver.findElement(By.xpath("//*[text()='tests.TestGroup']")));

            testCases.add(new TestCases("011","Group Create","Pass"));

            TimeUnit.SECONDS.sleep(3);
        } catch (Exception e) {
            testCases.add(new TestCases("011","Group Create","Fail"));
            e.printStackTrace();
            throw e;
        }

    }

    @Test(priority = 3)
    public void UpdateGroupTest() throws InterruptedException {

        try {
            WebElement buttonUpdate = driver.findElement(By.id("button_update_1"));
            buttonUpdate.click();
            TimeUnit.SECONDS.sleep(3);

            WebElement inputRole = driver.findElement(By.id("input_role"));
            inputRole.clear();
            inputRole.sendKeys("tests.TestGroup Edited");

            WebElement buttonNext = driver.findElement(By.id("navigation_next"));
            buttonNext.click();
            TimeUnit.SECONDS.sleep(3);

            WebElement setRoles = driver.findElement(By.id("input_components"));
            Actions act = new Actions(driver);

            act.clickAndHold(setRoles);

            setRoles.click();

            WebElement groupPermDashboard = driver.findElement(By.id("react-select-2-option-6"));
            groupPermDashboard.click();

            WebElement buttonNext1 = driver.findElement(By.id("navigation_next"));
            buttonNext1.click();

            TimeUnit.SECONDS.sleep(3);

            WebElement checkBoxAdmin = driver.findElement(By.id("input_admin"));
            JavascriptExecutor executor = (JavascriptExecutor)driver;
            executor.executeScript("arguments[0].click();", checkBoxAdmin);

            WebElement buttonSave = driver.findElement(By.id("button_update"));
            buttonSave.click();

            TimeUnit.SECONDS.sleep(3);

            Assert.assertNotNull(driver.findElement(By.xpath("//*[text()='tests.TestGroup Edited']")));

            TimeUnit.SECONDS.sleep(3);

            testCases.add(new TestCases("012","Group Update","Pass"));
        } catch (Exception e) {
            testCases.add(new TestCases("012","Group Update","Fail"));
            e.printStackTrace();
            throw e;
        }
    }

    @Test(priority = 4)
    public void DeleteGroupTest() throws InterruptedException {

        try {


        WebElement elementUsers=driver.findElement (By.linkText("Groups"));
        elementUsers.click();

        TimeUnit.SECONDS.sleep(2);

        WebElement buttonDelete = driver.findElement(By.id("button_delete_1"));
        buttonDelete.click();

        TimeUnit.SECONDS.sleep(2);

        WebElement elementOk = driver.findElement(By.id("confirmation_ok"));
        elementOk.click();

        TimeUnit.SECONDS.sleep(2);
            testCases.add(new TestCases("013","Group Delete","Pass"));
        } catch (Exception e) {
            testCases.add(new TestCases("013","Group Delete","Fail"));
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
