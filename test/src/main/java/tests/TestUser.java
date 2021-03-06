package tests;

import constants.Constants;
import org.openqa.selenium.By;
import org.openqa.selenium.Platform;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.logging.*;
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

public class TestUser {
    WebDriver driver;

    String mLogin;
    String mPassword;
    String mHubUrl;
    String mAppUrl;

    TestResultXmlUtility testResultXmlUtility=new TestResultXmlUtility();
    //create a list object that will contain number of test cases
    List<TestCases> testCases =new ArrayList<TestCases>();

    @BeforeTest
    public void setUp() throws MalformedURLException{

        mLogin = Constants.USERNAME;
        mPassword = Constants.PASSWORD;
        mHubUrl = Constants.HUB_URL;
        mAppUrl = Constants.APP_URL;


        LoggingPreferences logs = new LoggingPreferences();
        logs.enable(LogType.BROWSER,Level.ALL);
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
    public void SimpleTest(){
        try {
            driver.get(mAppUrl);
            Assert.assertEquals("OpenCelium", driver.getTitle());
            testCases.add(new TestCases("004","User Test Setup ","Pass"));
        } catch (Exception e) {
            testCases.add(new TestCases("004","User Test Setup ","Fail"));
            e.printStackTrace();
            throw e;
        }

    }

   @Test(priority = 1)
    public void LoginTest() throws InterruptedException {
       CommonCaseUtility.Login(driver,testCases,mLogin,mPassword,"005","User Test Login");
    }

   @Test(priority = 2)
   public void AddUserTest() throws InterruptedException {

        try {
            WebDriverWait wait = new WebDriverWait(driver, 10);

            WebElement elementU = driver.findElement(By.linkText("Users"));
            elementU.click();
            driver.manage().timeouts().implicitlyWait(20, TimeUnit.SECONDS);
            TimeUnit.SECONDS.sleep(2);
            //PRESS Add User button
           WebElement addUserButton = driver.findElement(By.id("button_add_user"));
           addUserButton.click();


           //driver.navigate().to(constants.Constants.BASE_URL+"users/add");

            wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("input_email")));

           WebElement emailField = driver.findElement(By.id("input_email"));
           emailField.sendKeys("test@test.io");
           TimeUnit.SECONDS.sleep(2);

           WebElement passwordField = driver.findElement(By.id("input_password"));
           passwordField.sendKeys("12345678");

           WebElement repeatField = driver.findElement(By.id("input_repeatPassword"));
           repeatField.sendKeys("12345678");
           TimeUnit.SECONDS.sleep(2);

           //PRESS -> button
           WebElement nextArrow = driver.findElement(By.id("navigation_next"));
           nextArrow.click();


           wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("input_name")));
           WebElement nameField = driver.findElement(By.id("input_name"));
           nameField.sendKeys("Selenium");
           TimeUnit.SECONDS.sleep(1);

           WebElement surnameField = driver.findElement(By.id("input_surname"));
           surnameField.sendKeys("Tester");
           TimeUnit.SECONDS.sleep(1);

           WebElement phoneField = driver.findElement(By.id("input_phoneNumber"));
           phoneField.sendKeys("+7777777");
           TimeUnit.SECONDS.sleep(1);

           WebElement organisationField = driver.findElement(By.id("input_organisation"));
           organisationField.sendKeys("Becon");
           TimeUnit.SECONDS.sleep(1);

           WebElement departmentField = driver.findElement(By.id("input_department"));
           departmentField.sendKeys("OpenCelium");
           TimeUnit.SECONDS.sleep(1);

           //Select title

           //Press ->
           WebElement nextArrow1 = driver.findElement(By.id("navigation_next"));
           nextArrow1.click();

           wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("input_userGroup")));
           //Set user group
           WebElement userGroup = driver.findElement(By.id("input_userGroup"));

           Actions act = new Actions(driver);

           act.clickAndHold(userGroup);

           userGroup.click();

           WebElement userRole = driver.findElement(By.id("react-select-2-option-2"));
           userRole.click();
           TimeUnit.SECONDS.sleep(1);
           //System.out.println("VALUE "+userGroup.getAttribute("value"));


           //Press Add button

           WebElement buttonAdd = driver.findElement(By.id("button_add"));
           buttonAdd.click();
           TimeUnit.SECONDS.sleep(1);
           WebElement elementUsers=driver.findElement (By.linkText("Users"));

           Assert.assertNotNull(elementUsers);
           testCases.add(new TestCases("006","User Create","Pass"));
        } catch (Exception e) {
            testCases.add(new TestCases("006","User Create","Fail"));
            e.printStackTrace();
            throw e;
        }

       //Check if user added successfully
    }

    @Test(priority = 3)
    public void UpdateUserTest() throws InterruptedException {

        try {
            WebElement elementU = driver.findElement(By.linkText("Users"));

            elementU.click();

            driver.manage().timeouts().implicitlyWait(20, TimeUnit.SECONDS);

            //Find "Selenium Tester" user div
            TimeUnit.SECONDS.sleep(2);
            //Find update button for selected user
            WebElement elementUpdate = driver.findElement(By.id("button_update_1"));
            elementUpdate.click();

            //Change Fields if needed
            WebElement emailField = driver.findElement(By.id("input_email"));
            emailField.clear();
            emailField.sendKeys("test123@test.io");
            TimeUnit.SECONDS.sleep(1);

            WebElement passwordField = driver.findElement(By.id("input_password"));
            passwordField.sendKeys("12345678");


            WebElement repeatField = driver.findElement(By.id("input_repeatPassword"));
            repeatField.sendKeys("12345678");
            TimeUnit.SECONDS.sleep(1);

            //PRESS -> button
            WebElement nextArrow = driver.findElement(By.id("navigation_next"));
            nextArrow.click();

            WebElement nameField = driver.findElement(By.id("input_name"));
            nameField.clear();
            nameField.sendKeys("SeleniumEdited123");
            TimeUnit.SECONDS.sleep(1);

            WebElement surnameField = driver.findElement(By.id("input_surname"));
            surnameField.clear();
            surnameField.sendKeys("Tester");
            TimeUnit.SECONDS.sleep(1);

            WebElement phoneField = driver.findElement(By.id("input_phoneNumber"));
            phoneField.clear();
            phoneField.sendKeys("+999999999");

            WebElement organisationField = driver.findElement(By.id("input_organisation"));
            organisationField.clear();
            organisationField.sendKeys("Becon Edited");
            TimeUnit.SECONDS.sleep(1);

            WebElement departmentField = driver.findElement(By.id("input_department"));
            departmentField.clear();
            departmentField.sendKeys("OpenCelium Edited");
            TimeUnit.SECONDS.sleep(1);

            //PRESS -> button
            WebElement nextArrowNext = driver.findElement(By.id("navigation_next"));
            nextArrowNext.click();

            //Set User group
            //Set user group
            WebElement userGroup = driver.findElement(By.id("input_userGroup"));

            Actions act = new Actions(driver);

            act.clickAndHold(userGroup);

            userGroup.click();

            //Change to Moderator
            WebElement userRole = driver.findElement(By.id("react-select-3-option-1"));
            userRole.click();

            //Press Update Button
            WebElement buttonUpdate = driver.findElement(By.id("button_update"));
            buttonUpdate.click();
            //Check if succesfully modified
            Assert.assertNotNull(driver.findElement(By.xpath("//*[text()='SeleniumEdited123 Tester']")));

            testCases.add(new TestCases("007","User Update","Pass"));
            TimeUnit.SECONDS.sleep(2);

        } catch (Exception e) {
            testCases.add(new TestCases("007","User Update","Fail"));
            e.printStackTrace();
            throw e;
        }

    }

    @Test(priority = 4)
    public void DeleteUserTest() throws InterruptedException {

        try {


        WebElement elementU = driver.findElement(By.linkText("Users"));

        elementU.click();

        driver.manage().timeouts().implicitlyWait(20, TimeUnit.SECONDS);

        TimeUnit.SECONDS.sleep(1);

        WebElement elementDel = driver.findElement(By.id("button_delete_1"));

        elementDel.click();

        TimeUnit.SECONDS.sleep(2);
        //Find "Selenium Tester" user div

        //Find delete button for selected user
        WebElement elementOk = driver.findElement(By.id("confirmation_ok"));
        elementOk.click();

        TimeUnit.SECONDS.sleep(3);
        //Assert.assertNotNull(driver.findElement(By.xpath("//*[text()='SeleniumEdited123 Tester']")));

            testCases.add(new TestCases("008","User Delete","Pass"));
        } catch (Exception e) {
            testCases.add(new TestCases("008","User Delete","Fail"));
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


