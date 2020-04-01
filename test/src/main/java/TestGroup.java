import com.sun.imageio.plugins.wbmp.WBMPImageReader;
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
import org.testng.Assert;
import org.testng.annotations.AfterTest;
import org.testng.annotations.BeforeTest;
import org.testng.annotations.Test;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;

public class TestGroup {

    WebDriver driver;

    @BeforeTest
    public void setUp() throws MalformedURLException {

        LoggingPreferences logs = new LoggingPreferences();
        logs.enable(LogType.BROWSER, Level.ALL);
        logs.enable(LogType.CLIENT, Level.ALL);
        logs.enable(LogType.DRIVER, Level.ALL);
        logs.enable(LogType.PERFORMANCE, Level.ALL);
        logs.enable(LogType.SERVER, Level.ALL);
        logs.enable(LogType.PROFILER, Level.ALL);


        DesiredCapabilities desiredCapabilities = new DesiredCapabilities();
        desiredCapabilities.setBrowserName("chrome");

        desiredCapabilities.setCapability(CapabilityType.LOGGING_PREFS, logs);


        driver = new RemoteWebDriver(new URL(Constants.NODE_URL),desiredCapabilities);

        driver.navigate().to(Constants.BASE_URL+"login");

        driver.manage().timeouts().implicitlyWait(10, TimeUnit.SECONDS);

        WebElement element_login=driver.findElement (By.id("login_email"));
        element_login.sendKeys(Constants.USERNAME);
        WebElement element_password=driver.findElement (By.id("login_password"));
        element_password.sendKeys(Constants.PASSWORD);
        WebElement buttonConnect=driver.findElement(By.xpath("//button"));

        buttonConnect.click();

    }

    @Test(priority = 0)
    public void SimpleTest(){
        WebElement elementUsers=driver.findElement (By.linkText("Groups"));
        elementUsers.click();
        Assert.assertNotNull(elementUsers);
    }

    @Test(priority = 1)
    public void AddGroupTest() throws InterruptedException {
        WebElement addGroupButton = driver.findElement(By.id("button_add_group"));
        addGroupButton.click();

        WebElement inputRole = driver.findElement(By.id("input_role"));
        inputRole.sendKeys("TestGroup");

        WebElement inputDescription = driver.findElement(By.id("input_description"));
        inputDescription.sendKeys("Filling Test Description");

        WebElement buttonNext = driver.findElement(By.id("navigation_next"));
        buttonNext.click();

        WebElement setRoles = driver.findElement(By.id("input_components"));
        Actions act = new Actions(driver);

        act.clickAndHold(setRoles);

        setRoles.click();

        WebElement groupPermSchedule = driver.findElement(By.id("react-select-2-option-2"));
        groupPermSchedule.click();

        setRoles.click();

        WebElement groupPerm = driver.findElement(By.id("react-select-2-option-5"));
        groupPerm.click();

        WebElement buttonNext1 = driver.findElement(By.id("navigation_next"));
        buttonNext1.click();

        WebElement checkBoxAdmin = driver.findElement(By.id("input_admin"));

        //act.moveToElement(checkBoxAdmin).perform();
        //act.contextClick(checkBoxAdmin);
        JavascriptExecutor executor = (JavascriptExecutor)driver;
        executor.executeScript("arguments[0].click();", checkBoxAdmin);

        WebElement buttonAdd = driver.findElement(By.id("button_add"));
        buttonAdd.click();

        TimeUnit.SECONDS.sleep(3);

        //driver.manage().timeouts().implicitlyWait(5, TimeUnit.SECONDS);

        driver.navigate().to("http://localhost:8888/usergroups");
        Assert.assertNotNull(driver.findElement(By.xpath("//*[text()='TestGroup']")));


    }

    @Test(priority = 2)
    public void UpdateGroupTest(){

        /*WebElement elementUsers=driver.findElement (By.linkText("Groups"));
        elementUsers.click();

        WebElement buttonUpdate = driver.findElement(By.id("button_update_2"));
        buttonUpdate.click();

        WebElement inputRole = driver.findElement(By.id("input_role"));
        inputRole.clear();
        inputRole.sendKeys("TestGroup");

        WebElement buttonNext = driver.findElement(By.id("navigation_next"));
        buttonNext.click();

        WebElement buttonNext1 = driver.findElement(By.id("navigation_next"));
        buttonNext1.click();

        WebElement buttonSave = driver.findElement(By.id("button_update"));
        buttonSave.click();*/

    }

    @Test(priority = 3)
    public void DeleteGroupTest(){

      /*  WebElement elementUsers=driver.findElement (By.linkText("Groups"));
        elementUsers.click();

        WebElement buttonDelete = driver.findElement(By.id("button_delete_2"));
        buttonDelete.click();

        WebElement elementOk = driver.findElement(By.id("confirmation_ok"));
        elementOk.click();*/

    }





    @AfterTest
    public void afterTest(){
       // driver.quit();
    }

}
