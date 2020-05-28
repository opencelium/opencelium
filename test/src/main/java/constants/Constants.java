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

    //Invoker related constants
    public static String OTRS_URL = "https://mytest.managed-otrs.com/";  //http://oc-otrs.westeurope.cloudapp.azure.com/otrs/index.pl?Action=AgentITSMConfigItem
    public static String OTRS_LOGIN = "info@anymobile.uz"; //"root@localhost"
    public static String OTRS_PWD = "3Np3gTFOWYxfx4VzRk1Ro9jeg2q7NEIi"; //"init"
    public static String OTRS_WEBSERVICE = "OC-Connect1";


    public static String IDOIT_URL = "http://oc-idoit.westeurope.cloudapp.azure.com/?viewMode=1001&objTypeID=59";
    public static String IDOIT_KEY = "AWK123!";

    public static String SENSU_URL = "https://sensu.com";
    public static String SENSU_TOKEN = "sometoken";
    public static String SENSU_REFRESH_TOKEN = "somerefreshtoken";
    public static String SENSU_EXP = "exp date";

    public static String ICINGA2_URL = "https://icinga.com";
    public static String ICINGA2_LOGIN = "icingalogin";
    public static String ICINGA2_PWD = "icingapwd";

    public static String ZABBIX_URL = "https://zabbix.com";
    public static String ZABBIX_LOGIN = "zabbixlogin";
    public static String ZABBIX_PWD = "zabbixpwd";

    public static String OPENNMS_URL = "https://opennms.com";
    public static String OPENNMS_LOGIN = "opennmslogin";
    public static String OPENNMS_PWD = "opennmspwd";


}
