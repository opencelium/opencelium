package utility;

import constants.Constants;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.testng.Assert;
import java.util.List;
import java.util.concurrent.TimeUnit;
import static org.testng.Assert.assertNotNull;

public class CommonCaseUtility {

    public static void Login(WebDriver driver, List<TestCases> testCases, String mLogin, String mPassword, String testID, String testName) throws InterruptedException {

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
                assertNotNull(driver.findElement(By.linkText("Users")));
                //add test case to the testcases list as pass
                testCases.add(new TestCases(testID,testName,"Pass"));
                break;
            }
            catch (Exception e) {
                //add test case to the testcases list as Fail
                testCases.add(new TestCases(testID,testName,"Fail"));
                throw e;
            }
        }
    }

    public static void Logout(WebDriver driver, List<TestCases> testCases,String testID, String testName){
        try {
            WebElement buttonLogout=driver.findElement (By.id("menu_logout"));
            Assert.assertNotNull(buttonLogout);
            buttonLogout.click();
            WebElement elementOk = driver.findElement(By.id("confirmation_ok"));
            Assert.assertNotNull(elementOk);
            elementOk.click();
            WebElement element_login=driver.findElement (By.id("login_email"));
            Assert.assertNotNull(element_login);
            testCases.add(new TestCases(testID,testName,"Pass"));
        } catch (Exception e) {
            testCases.add(new TestCases(testID,testName,"Fail"));
            e.printStackTrace();
        }
    }

    public static void CreateConnection(WebDriver driver, List<TestCases> testCases,String testID, String testName){
        try {
            driver.findElement(By.linkText("Connections")).click();
            //Successfully get connections list
            TimeUnit.SECONDS.sleep(4);
            driver.findElement(By.xpath("//*[text()='Success']"));
            driver.findElement(By.id("button_add_connection")).click();
            TimeUnit.SECONDS.sleep(2);
            driver.findElement(By.id("input_connection_title")).sendKeys("TestConnection"+ Math.random());
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
            testCases.add(new TestCases(testID,testName,"Pass"));
        } catch (Exception e) {
            testCases.add(new TestCases(testID,testName,"Fail"));
            e.printStackTrace();
        }
    }

    public static void AddOTRS(WebDriver driver){
        try {
            driver.findElement(By.id("input_title")).sendKeys("TestOTRS");
            driver.findElement(By.id("input_description")).sendKeys("TestOTRS Description");
            driver.findElement(By.id("input_invoker")).click();
            //Choosing OTRS
            driver.findElement(By.id("react-select-2-option-2")).click();
            TimeUnit.SECONDS.sleep(3);
            //Scrolling the page
            JavascriptExecutor js = (JavascriptExecutor) driver;
            js.executeScript("window.scrollBy(0,document.body.scrollHeight)");

            driver.findElement(By.id("navigation_next")).click();
            TimeUnit.SECONDS.sleep(3);
            driver.findElement(By.id("input_otrs__url")).sendKeys(Constants.OTRS_URL);
            driver.findElement(By.id("input_otrs__UserLogin")).sendKeys(Constants.OTRS_LOGIN);
            driver.findElement(By.id("input_otrs__Password")).sendKeys(Constants.OTRS_PWD);
            driver.findElement(By.id("input_otrs__WebService")).sendKeys(Constants.OTRS_WEBSERVICE);
            js.executeScript("window.scrollBy(0,document.body.scrollHeight)");
            driver.findElement(By.id("button_add")).click();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    public static void AddIdoit(WebDriver driver){
        try {
            driver.findElement(By.id("input_title")).sendKeys("Test iDoit");
            driver.findElement(By.id("input_description")).sendKeys("Test iDoit Description");
            driver.findElement(By.id("input_invoker")).click();
            //Choosing idoit
            driver.findElement(By.id("react-select-2-option-6")).click();
            TimeUnit.SECONDS.sleep(3);
            //Scrolling the page
            JavascriptExecutor js = (JavascriptExecutor) driver;
            js.executeScript("window.scrollBy(0,document.body.scrollHeight)");
            driver.findElement(By.id("navigation_next")).click();
            TimeUnit.SECONDS.sleep(3);
            driver.findElement(By.id("input_i-doit__url")).sendKeys(Constants.IDOIT_URL);
            driver.findElement(By.id("input_i-doit__apikey")).sendKeys(Constants.IDOIT_KEY);
            driver.findElement(By.id("button_add")).click();
        }catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    public static void AddSensu(WebDriver driver) throws InterruptedException{
        driver.findElement(By.id("input_title")).sendKeys("Test Sensu");
        driver.findElement(By.id("input_description")).sendKeys("Test Sensu Description");
        driver.findElement(By.id("input_invoker")).click();
        //Choosing sensu
        driver.findElement(By.id("react-select-2-option-5")).click();
        TimeUnit.SECONDS.sleep(3);
        //Scrolling the page
        JavascriptExecutor js = (JavascriptExecutor) driver;
        js.executeScript("window.scrollBy(0,document.body.scrollHeight)");
        driver.findElement(By.id("navigation_next")).click();
        TimeUnit.SECONDS.sleep(3);
        driver.findElement(By.id("input_sensu__url")).sendKeys(Constants.SENSU_URL);
        driver.findElement(By.id("input_sensu__token")).sendKeys(Constants.SENSU_TOKEN);
        driver.findElement(By.id("input_sensu__refresh_token")).sendKeys(Constants.SENSU_REFRESH_TOKEN);
        driver.findElement(By.id("input_sensu__expires_at")).sendKeys(Constants.SENSU_EXP);
        driver.findElement(By.id("button_add")).click();
    }

    public static void AddZabbix(WebDriver driver) throws InterruptedException{
        driver.findElement(By.id("input_title")).sendKeys("TestZabbix");
        driver.findElement(By.id("input_description")).sendKeys("TestZabbix Description");
        driver.findElement(By.id("input_invoker")).click();

        //Choosing Zabbix
        driver.findElement(By.id("react-select-2-option-3")).click();
        TimeUnit.SECONDS.sleep(3);

        //Scrolling the page
        JavascriptExecutor js = (JavascriptExecutor) driver;
        js.executeScript("window.scrollBy(0,document.body.scrollHeight)");

        driver.findElement(By.id("navigation_next")).click();
        TimeUnit.SECONDS.sleep(3);
        driver.findElement(By.id("input_zabbix__url")).sendKeys(Constants.ZABBIX_URL);
        driver.findElement(By.id("input_zabbix__user")).sendKeys(Constants.ZABBIX_LOGIN);
        driver.findElement(By.id("input_zabbix__password")).sendKeys(Constants.ZABBIX_PWD);
        driver.findElement(By.id("button_add")).click();
    }

    public static void AddIcinga2(WebDriver driver) throws InterruptedException {
        driver.findElement(By.id("input_title")).sendKeys("TestIcinga2");
        driver.findElement(By.id("input_description")).sendKeys("TestIcinga2 Description");
        driver.findElement(By.id("input_invoker")).click();

        //Choosing icinga
        driver.findElement(By.id("react-select-2-option-1")).click();
        TimeUnit.SECONDS.sleep(3);

        //Scrolling the page
        JavascriptExecutor js = (JavascriptExecutor) driver;
        js.executeScript("window.scrollBy(0,document.body.scrollHeight)");
        driver.findElement(By.id("navigation_next")).click();
        TimeUnit.SECONDS.sleep(3);
        driver.findElement(By.id("input_icinga2__url")).sendKeys(Constants.ICINGA2_URL);
        driver.findElement(By.id("input_icinga2__username")).sendKeys(Constants.ICINGA2_LOGIN);
        driver.findElement(By.id("input_icinga2__password")).sendKeys(Constants.ICINGA2_PWD);
        driver.findElement(By.id("button_add")).click();
    }

    public static void AddOpenNMS(WebDriver driver) throws InterruptedException{
        driver.findElement(By.id("input_title")).sendKeys("Test OpenNMS");
        driver.findElement(By.id("input_description")).sendKeys("Test OpenNMS Description");
        driver.findElement(By.id("input_invoker")).click();

        //Choosing openNMS
        driver.findElement(By.id("react-select-2-option-4")).click();
        TimeUnit.SECONDS.sleep(3);

        //Scrolling the page
        JavascriptExecutor js = (JavascriptExecutor) driver;
        js.executeScript("window.scrollBy(0,document.body.scrollHeight)");
        driver.findElement(By.id("navigation_next")).click();
        TimeUnit.SECONDS.sleep(3);
        driver.findElement(By.id("input_openNMS__url")).sendKeys(Constants.OPENNMS_URL);
        driver.findElement(By.id("input_openNMS__username")).sendKeys(Constants.OPENNMS_LOGIN);
        driver.findElement(By.id("input_openNMS__password")).sendKeys(Constants.OPENNMS_PWD);
        driver.findElement(By.id("button_add")).click();
    }

}
