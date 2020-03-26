import org.openqa.selenium.By;
import org.openqa.selenium.Platform;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
//import org.openqa.selenium.devtools.DevTools;
import org.openqa.selenium.logging.*;
import org.openqa.selenium.remote.CapabilityType;
import org.openqa.selenium.remote.DesiredCapabilities;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Wait;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;
import org.testng.annotations.AfterTest;
import org.testng.annotations.BeforeTest;
import org.testng.annotations.Test;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;

public class TestWithServer {
    WebDriver driver;



    @BeforeTest
    public void setUp() throws MalformedURLException{

        LoggingPreferences logs = new LoggingPreferences();
        logs.enable(LogType.BROWSER,Level.ALL);
        logs.enable(LogType.CLIENT, Level.ALL);
        logs.enable(LogType.DRIVER, Level.ALL);
        logs.enable(LogType.PERFORMANCE, Level.ALL);
        logs.enable(LogType.SERVER, Level.ALL);
        logs.enable(LogType.PROFILER, Level.ALL);


        DesiredCapabilities desiredCapabilities = new DesiredCapabilities();
        desiredCapabilities.setBrowserName("chrome");

        desiredCapabilities.setCapability(CapabilityType.LOGGING_PREFS, logs);



        /*baseUrl = "http://oc-demo.westeurope.cloudapp.azure.com:8888/";
        nodeUrl = "http://localhost:4444/wd/hub";*/
        /*System.setProperty("webdriver.gecko.driver","/home/khmuminov/geckodriver");
        DesiredCapabilities capability = DesiredCapabilities.firefox();
        capability.setBrowserName("firefox");
        capability.setPlatform(Platform.LINUX);*/

        driver = new RemoteWebDriver(new URL(Constants.NODE_URL),desiredCapabilities);


    }

    @AfterTest
    public void afterTest(){
       // driver.quit();
    }

   @Test(priority = 0)
    public void SimpleTest(){
        driver.get(Constants.BASE_URL);
        Assert.assertEquals("OpenCelium", driver.getTitle());
    }

   @Test(priority = 1)
    public void LoginTest(){
        //driver.get(baseUrl+"login");

        driver.navigate().to(Constants.BASE_URL+"login");

        driver.manage().timeouts().implicitlyWait(10, TimeUnit.SECONDS);

        WebElement element_login=driver.findElement (By.id("login_email"));
        element_login.sendKeys(Constants.USERNAME);
        WebElement element_password=driver.findElement (By.id("login_password"));
        element_password.sendKeys(Constants.PASSWORD);
        WebElement buttonConnect=driver.findElement(By.xpath("//button"));

        buttonConnect.click();

        Logs logs = driver.manage().logs();
        LogEntries logEntries = logs.get(LogType.BROWSER);

        System.out.println("LogEntry count: "+logEntries.getAll().size());
        for (LogEntry logEntry : logEntries) {
            System.out.println(logEntry.getMessage());
        }


       driver.manage().timeouts().implicitlyWait(3, TimeUnit.SECONDS);

       WebElement elementUsers=driver.findElement (By.linkText("Users"));

       Assert.assertNotNull(elementUsers);



    }

   @Test(priority = 2)
    public void AddUSerTest(){

       /* driver.navigate().to(baseUrl+"login");

        driver.manage().timeouts().implicitlyWait(10, TimeUnit.SECONDS);

        WebElement element_login=driver.findElement (By.id("login_email"));
        element_login.sendKeys("khmuminov@gmail.com");
        WebElement element_password=driver.findElement (By.id("login_password"));
        element_password.sendKeys("12345678");
        WebElement buttonConnect=driver.findElement(By.xpath("//button"));

        buttonConnect.click();

        driver.manage().timeouts().implicitlyWait(3, TimeUnit.SECONDS);*/

       WebElement elementU = driver.findElement(By.linkText("Users"));

       elementU.click();

       driver.manage().timeouts().implicitlyWait(20, TimeUnit.SECONDS);


       //PRESS Add User button
       driver.navigate().to(Constants.BASE_URL+"users/add");

       driver.manage().timeouts().implicitlyWait(20, TimeUnit.SECONDS);

       WebElement emailField = driver.findElement(By.id("input_email"));
       emailField.sendKeys("test@test.io");

       WebElement passwordField = driver.findElement(By.id("input_password"));
       passwordField.sendKeys("12345678");


       WebElement repeatField = driver.findElement(By.id("input_repeatPassword"));
       repeatField.sendKeys("12345678");


       //PRESS -> button

       WebElement nameField = driver.findElement(By.id("input_name"));
       nameField.sendKeys("Selenium");

       WebElement surnameField = driver.findElement(By.id("input_surname"));
       surnameField.sendKeys("Tester");

       WebElement phoneField = driver.findElement(By.id("input_phoneNumber"));
       phoneField.sendKeys("++7777777");

       WebElement organisationField = driver.findElement(By.id("input_organisation"));
       organisationField.sendKeys("Becon");

       WebElement departmentField = driver.findElement(By.id("input_department"));
       organisationField.sendKeys("OpenCelium");

       //Select title

       //Press ->

       WebElement userGroup = driver.findElement(By.id("input_userGroup"));
       userGroup.sendKeys("User");


       //Press Add button
    }



}


