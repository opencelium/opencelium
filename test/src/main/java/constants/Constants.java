package constants;

public interface Constants {

    //Path constants
    public static final String FIREFOX_DRIVER_PATH = "/home/khmuminov/geckodriver";
    public static final String CHROME_DRIVER_PATH = "/home/khmuminov/chromedriver";


    //Test user credentials
    public static final String USERNAME = "admin@opencelium.io";
    public static final String PASSWORD = "1234";


    //URL constants
    public static String APP_URL = "http://localhost:8888/";
    public static String HUB_URL = "http://localhost:4444/wd/hub";

    //Invoker templates credentials
    public static String OTRS_URL = "https://portal.otrs.com/external";  //http://oc-otrs.westeurope.cloudapp.azure.com/otrs/index.pl?Action=AgentITSMConfigItem
    public static String OTRS_LOGIN = "info@anymobile.uz"; //"root@localhost"
    public static String OTRS_PWD = "3Np3gTFOWYxfx4VzRk1Ro9jeg2q7NEIi"; //"init"


    public static String IDOIT_URL = "http://oc-idoit.westeurope.cloudapp.azure.com/?viewMode=1001&objTypeID=59";
    public static String IDOIT_KEY = "AWK123!";
}
