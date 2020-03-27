import org.openqa.selenium.By;
import org.openqa.selenium.Platform;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxDriverLogLevel;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.openqa.selenium.logging.LogEntries;
import org.openqa.selenium.logging.LogLevelMapping;
import org.openqa.selenium.logging.LogType;
import org.openqa.selenium.logging.LoggingPreferences;
import org.openqa.selenium.remote.BrowserType;
import org.openqa.selenium.remote.CapabilityType;
import org.openqa.selenium.remote.DesiredCapabilities;

import java.util.concurrent.TimeUnit;
import java.util.logging.Level;

public class TestStandalone {
    public static void main(String[] args){

        System.setProperty("webdriver.gecko.driver","/home/khmuminov/geckodriver");

        FirefoxOptions option = new FirefoxOptions();
        DesiredCapabilities cap = DesiredCapabilities.firefox();
        cap.setPlatform(Platform.LINUX);
        cap.setBrowserName(BrowserType.FIREFOX);

        cap.setCapability(FirefoxOptions.FIREFOX_OPTIONS, option);

        LoggingPreferences logPrefs = new LoggingPreferences();
        logPrefs.enable(LogType.PERFORMANCE, Level.ALL);

        cap.setCapability(CapabilityType.LOGGING_PREFS, logPrefs);

        FirefoxDriver driver=new FirefoxDriver(cap);
        driver.get("http://oc-demo.westeurope.cloudapp.azure.com:8888/login");
        driver.manage().timeouts().implicitlyWait(10, TimeUnit.SECONDS);
        WebElement element_login=driver.findElementById("login_email");
        element_login.sendKeys("khmuminov@gmail.com");
        WebElement element_password=driver.findElementById("login_password");
        element_password.sendKeys("12345678");
        WebElement buttonConnect=driver.findElement(By.xpath("//button"));

        buttonConnect.click();



        //System.out.print(driver.manage().logs().get(LogType.PROFILER));





      /* System.setProperty("webdriver.chrome.driver","/home/khmuminov/chromedriver");
        ChromeOptions options = new ChromeOptions();
        // add whatever extensions you need
        // for example I needed one of adding proxy, and one for blocking
        // images
        // options.addExtensions(new File&#40;file, "proxy.zip"&#41;);
        // options.addExtensions(new File&#40;"extensions",
        // "Block-image_v1.1.crx"&#41;);

        DesiredCapabilities cap = new DesiredCapabilities();
        cap.setBrowserName("chrome");
        cap.setCapability(ChromeOptions.CAPABILITY, options);

        // set performance logger
        // this sends Network.enable to chromedriver
        LoggingPreferences logPrefs = new LoggingPreferences();
        logPrefs.enable(LogType.PERFORMANCE, Level.ALL);
        cap.setCapability(CapabilityType.LOGGING_PREFS, logPrefs);

        ChromeDriver driver = new ChromeDriver();
        driver.get("http://oc-demo.westeurope.cloudapp.azure.com:8888/login");
        driver.manage().timeouts().implicitlyWait(10, TimeUnit.SECONDS);

        //LogEntries logs = driver.manage().logs().get(LogType.PERFORMANCE);

        //System.out.println(logs);*/

    }
}