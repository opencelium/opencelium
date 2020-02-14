-- MariaDB dump 10.17  Distrib 10.4.6-MariaDB, for osx10.14 (x86_64)
--
-- Host: localhost    Database: opencelium
-- ------------------------------------------------------
-- Server version	10.4.6-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `QRTZ_BLOB_TRIGGERS`
--

DROP TABLE IF EXISTS `QRTZ_BLOB_TRIGGERS`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `QRTZ_BLOB_TRIGGERS` (
  `SCHED_NAME` varchar(120) NOT NULL,
  `TRIGGER_NAME` varchar(190) NOT NULL,
  `TRIGGER_GROUP` varchar(190) NOT NULL,
  `BLOB_DATA` blob DEFAULT NULL,
  PRIMARY KEY (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`),
  KEY `SCHED_NAME` (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`),
  CONSTRAINT `qrtz_blob_triggers_ibfk_1` FOREIGN KEY (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`) REFERENCES `QRTZ_TRIGGERS` (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `QRTZ_BLOB_TRIGGERS`
--

LOCK TABLES `QRTZ_BLOB_TRIGGERS` WRITE;
/*!40000 ALTER TABLE `QRTZ_BLOB_TRIGGERS` DISABLE KEYS */;
/*!40000 ALTER TABLE `QRTZ_BLOB_TRIGGERS` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `QRTZ_CALENDARS`
--

DROP TABLE IF EXISTS `QRTZ_CALENDARS`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `QRTZ_CALENDARS` (
  `SCHED_NAME` varchar(120) NOT NULL,
  `CALENDAR_NAME` varchar(190) NOT NULL,
  `CALENDAR` blob NOT NULL,
  PRIMARY KEY (`SCHED_NAME`,`CALENDAR_NAME`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `QRTZ_CALENDARS`
--

LOCK TABLES `QRTZ_CALENDARS` WRITE;
/*!40000 ALTER TABLE `QRTZ_CALENDARS` DISABLE KEYS */;
/*!40000 ALTER TABLE `QRTZ_CALENDARS` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `QRTZ_CRON_TRIGGERS`
--

DROP TABLE IF EXISTS `QRTZ_CRON_TRIGGERS`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `QRTZ_CRON_TRIGGERS` (
  `SCHED_NAME` varchar(120) NOT NULL,
  `TRIGGER_NAME` varchar(190) NOT NULL,
  `TRIGGER_GROUP` varchar(190) NOT NULL,
  `CRON_EXPRESSION` varchar(120) NOT NULL,
  `TIME_ZONE_ID` varchar(80) DEFAULT NULL,
  PRIMARY KEY (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`),
  CONSTRAINT `qrtz_cron_triggers_ibfk_1` FOREIGN KEY (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`) REFERENCES `QRTZ_TRIGGERS` (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `QRTZ_CRON_TRIGGERS`
--

LOCK TABLES `QRTZ_CRON_TRIGGERS` WRITE;
/*!40000 ALTER TABLE `QRTZ_CRON_TRIGGERS` DISABLE KEYS */;
--INSERT INTO `QRTZ_CRON_TRIGGERS` VALUES ('quartzScheduler','30','698','0 0 0/10 * * ?','Europe/Berlin'),('quartzScheduler','36','698','0 0/50 * * * ?','Europe/Berlin'),('quartzScheduler','37','698','0 0/50 * * * ?','Europe/Berlin');
/*!40000 ALTER TABLE `QRTZ_CRON_TRIGGERS` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `QRTZ_FIRED_TRIGGERS`
--

DROP TABLE IF EXISTS `QRTZ_FIRED_TRIGGERS`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `QRTZ_FIRED_TRIGGERS` (
  `SCHED_NAME` varchar(120) NOT NULL,
  `ENTRY_ID` varchar(95) NOT NULL,
  `TRIGGER_NAME` varchar(190) NOT NULL,
  `TRIGGER_GROUP` varchar(190) NOT NULL,
  `INSTANCE_NAME` varchar(190) NOT NULL,
  `FIRED_TIME` bigint(13) NOT NULL,
  `SCHED_TIME` bigint(13) NOT NULL,
  `PRIORITY` int(11) NOT NULL,
  `STATE` varchar(16) NOT NULL,
  `JOB_NAME` varchar(190) DEFAULT NULL,
  `JOB_GROUP` varchar(190) DEFAULT NULL,
  `IS_NONCONCURRENT` varchar(1) DEFAULT NULL,
  `REQUESTS_RECOVERY` varchar(1) DEFAULT NULL,
  PRIMARY KEY (`SCHED_NAME`,`ENTRY_ID`),
  KEY `IDX_QRTZ_FT_TRIG_INST_NAME` (`SCHED_NAME`,`INSTANCE_NAME`),
  KEY `IDX_QRTZ_FT_INST_JOB_REQ_RCVRY` (`SCHED_NAME`,`INSTANCE_NAME`,`REQUESTS_RECOVERY`),
  KEY `IDX_QRTZ_FT_J_G` (`SCHED_NAME`,`JOB_NAME`,`JOB_GROUP`),
  KEY `IDX_QRTZ_FT_JG` (`SCHED_NAME`,`JOB_GROUP`),
  KEY `IDX_QRTZ_FT_T_G` (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`),
  KEY `IDX_QRTZ_FT_TG` (`SCHED_NAME`,`TRIGGER_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `QRTZ_FIRED_TRIGGERS`
--

LOCK TABLES `QRTZ_FIRED_TRIGGERS` WRITE;
/*!40000 ALTER TABLE `QRTZ_FIRED_TRIGGERS` DISABLE KEYS */;
/*!40000 ALTER TABLE `QRTZ_FIRED_TRIGGERS` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `QRTZ_JOB_DETAILS`
--

DROP TABLE IF EXISTS `QRTZ_JOB_DETAILS`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `QRTZ_JOB_DETAILS` (
  `SCHED_NAME` varchar(120) NOT NULL,
  `JOB_NAME` varchar(190) NOT NULL,
  `JOB_GROUP` varchar(190) NOT NULL,
  `DESCRIPTION` varchar(250) DEFAULT NULL,
  `JOB_CLASS_NAME` varchar(250) NOT NULL,
  `IS_DURABLE` varchar(1) NOT NULL,
  `IS_NONCONCURRENT` varchar(1) NOT NULL,
  `IS_UPDATE_DATA` varchar(1) NOT NULL,
  `REQUESTS_RECOVERY` varchar(1) NOT NULL,
  `JOB_DATA` blob DEFAULT NULL,
  PRIMARY KEY (`SCHED_NAME`,`JOB_NAME`,`JOB_GROUP`),
  KEY `IDX_QRTZ_J_REQ_RECOVERY` (`SCHED_NAME`,`REQUESTS_RECOVERY`),
  KEY `IDX_QRTZ_J_GRP` (`SCHED_NAME`,`JOB_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `QRTZ_JOB_DETAILS`
--

LOCK TABLES `QRTZ_JOB_DETAILS` WRITE;
/*!40000 ALTER TABLE `QRTZ_JOB_DETAILS` DISABLE KEYS */;
--INSERT INTO `QRTZ_JOB_DETAILS` VALUES ('quartzScheduler','698-30','connection','delete in otrs','com.oc.backend.prototype.execution.ConnectionJob','1','0','0','0','��\0sr\0org.quartz.JobDataMap���迩��\0\0xr\0&org.quartz.utils.StringKeyDirtyFlagMap�����](\0Z\0allowsTransientDataxr\0org.quartz.utils.DirtyFlagMap�.�(v\n�\0Z\0dirtyL\0mapt\0Ljava/util/Map;xpsr\0java.util.HashMap���`�\0F\0\nloadFactorI\0	thresholdxp?@\0\0\0\0\0w\0\0\0\0\0\0t\0\rexecutionTypet\0	schedulert\0schedulerIdsr\0java.lang.Integer⠤���8\0I\0valuexr\0java.lang.Number������\0\0xp\0\0\0t\0connectionIdsr\0java.lang.Long;��̏#�\0J\0valuexq\0~\0\0\0\0\0\0\0�x\0'),('quartzScheduler','698-36','connection','delete in otrs','com.oc.backend.prototype.execution.ConnectionJob','1','0','0','0','��\0sr\0org.quartz.JobDataMap���迩��\0\0xr\0&org.quartz.utils.StringKeyDirtyFlagMap�����](\0Z\0allowsTransientDataxr\0org.quartz.utils.DirtyFlagMap�.�(v\n�\0Z\0dirtyL\0mapt\0Ljava/util/Map;xpsr\0java.util.HashMap���`�\0F\0\nloadFactorI\0	thresholdxp?@\0\0\0\0\0w\0\0\0\0\0\0t\0\rexecutionTypet\0	schedulert\0schedulerIdsr\0java.lang.Integer⠤���8\0I\0valuexr\0java.lang.Number������\0\0xp\0\0\0$t\0connectionIdsr\0java.lang.Long;��̏#�\0J\0valuexq\0~\0\0\0\0\0\0\0�x\0'),('quartzScheduler','698-37','connection','delete in otrs','com.oc.backend.prototype.execution.ConnectionJob','1','0','0','0','��\0sr\0org.quartz.JobDataMap���迩��\0\0xr\0&org.quartz.utils.StringKeyDirtyFlagMap�����](\0Z\0allowsTransientDataxr\0org.quartz.utils.DirtyFlagMap�.�(v\n�\0Z\0dirtyL\0mapt\0Ljava/util/Map;xpsr\0java.util.HashMap���`�\0F\0\nloadFactorI\0	thresholdxp?@\0\0\0\0\0w\0\0\0\0\0\0t\0\rexecutionTypet\0	schedulert\0schedulerIdsr\0java.lang.Integer⠤���8\0I\0valuexr\0java.lang.Number������\0\0xp\0\0\0%t\0connectionIdsr\0java.lang.Long;��̏#�\0J\0valuexq\0~\0\0\0\0\0\0\0�x\0');
/*!40000 ALTER TABLE `QRTZ_JOB_DETAILS` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `QRTZ_LOCKS`
--

DROP TABLE IF EXISTS `QRTZ_LOCKS`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `QRTZ_LOCKS` (
  `SCHED_NAME` varchar(120) NOT NULL,
  `LOCK_NAME` varchar(40) NOT NULL,
  PRIMARY KEY (`SCHED_NAME`,`LOCK_NAME`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `QRTZ_LOCKS`
--

LOCK TABLES `QRTZ_LOCKS` WRITE;
/*!40000 ALTER TABLE `QRTZ_LOCKS` DISABLE KEYS */;
--INSERT INTO `QRTZ_LOCKS` VALUES ('quartzScheduler','TRIGGER_ACCESS');
/*!40000 ALTER TABLE `QRTZ_LOCKS` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `QRTZ_PAUSED_TRIGGER_GRPS`
--

DROP TABLE IF EXISTS `QRTZ_PAUSED_TRIGGER_GRPS`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `QRTZ_PAUSED_TRIGGER_GRPS` (
  `SCHED_NAME` varchar(120) NOT NULL,
  `TRIGGER_GROUP` varchar(190) NOT NULL,
  PRIMARY KEY (`SCHED_NAME`,`TRIGGER_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `QRTZ_PAUSED_TRIGGER_GRPS`
--

LOCK TABLES `QRTZ_PAUSED_TRIGGER_GRPS` WRITE;
/*!40000 ALTER TABLE `QRTZ_PAUSED_TRIGGER_GRPS` DISABLE KEYS */;
/*!40000 ALTER TABLE `QRTZ_PAUSED_TRIGGER_GRPS` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `QRTZ_SCHEDULER_STATE`
--

DROP TABLE IF EXISTS `QRTZ_SCHEDULER_STATE`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `QRTZ_SCHEDULER_STATE` (
  `SCHED_NAME` varchar(120) NOT NULL,
  `INSTANCE_NAME` varchar(190) NOT NULL,
  `LAST_CHECKIN_TIME` bigint(13) NOT NULL,
  `CHECKIN_INTERVAL` bigint(13) NOT NULL,
  PRIMARY KEY (`SCHED_NAME`,`INSTANCE_NAME`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `QRTZ_SCHEDULER_STATE`
--

LOCK TABLES `QRTZ_SCHEDULER_STATE` WRITE;
/*!40000 ALTER TABLE `QRTZ_SCHEDULER_STATE` DISABLE KEYS */;
/*!40000 ALTER TABLE `QRTZ_SCHEDULER_STATE` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `QRTZ_SIMPLE_TRIGGERS`
--

DROP TABLE IF EXISTS `QRTZ_SIMPLE_TRIGGERS`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `QRTZ_SIMPLE_TRIGGERS` (
  `SCHED_NAME` varchar(120) NOT NULL,
  `TRIGGER_NAME` varchar(190) NOT NULL,
  `TRIGGER_GROUP` varchar(190) NOT NULL,
  `REPEAT_COUNT` bigint(7) NOT NULL,
  `REPEAT_INTERVAL` bigint(12) NOT NULL,
  `TIMES_TRIGGERED` bigint(10) NOT NULL,
  PRIMARY KEY (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`),
  CONSTRAINT `qrtz_simple_triggers_ibfk_1` FOREIGN KEY (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`) REFERENCES `QRTZ_TRIGGERS` (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `QRTZ_SIMPLE_TRIGGERS`
--

LOCK TABLES `QRTZ_SIMPLE_TRIGGERS` WRITE;
/*!40000 ALTER TABLE `QRTZ_SIMPLE_TRIGGERS` DISABLE KEYS */;
/*!40000 ALTER TABLE `QRTZ_SIMPLE_TRIGGERS` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `QRTZ_SIMPROP_TRIGGERS`
--

DROP TABLE IF EXISTS `QRTZ_SIMPROP_TRIGGERS`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `QRTZ_SIMPROP_TRIGGERS` (
  `SCHED_NAME` varchar(120) NOT NULL,
  `TRIGGER_NAME` varchar(190) NOT NULL,
  `TRIGGER_GROUP` varchar(190) NOT NULL,
  `STR_PROP_1` varchar(512) DEFAULT NULL,
  `STR_PROP_2` varchar(512) DEFAULT NULL,
  `STR_PROP_3` varchar(512) DEFAULT NULL,
  `INT_PROP_1` int(11) DEFAULT NULL,
  `INT_PROP_2` int(11) DEFAULT NULL,
  `LONG_PROP_1` bigint(20) DEFAULT NULL,
  `LONG_PROP_2` bigint(20) DEFAULT NULL,
  `DEC_PROP_1` decimal(13,4) DEFAULT NULL,
  `DEC_PROP_2` decimal(13,4) DEFAULT NULL,
  `BOOL_PROP_1` varchar(1) DEFAULT NULL,
  `BOOL_PROP_2` varchar(1) DEFAULT NULL,
  PRIMARY KEY (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`),
  CONSTRAINT `qrtz_simprop_triggers_ibfk_1` FOREIGN KEY (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`) REFERENCES `QRTZ_TRIGGERS` (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `QRTZ_SIMPROP_TRIGGERS`
--

LOCK TABLES `QRTZ_SIMPROP_TRIGGERS` WRITE;
/*!40000 ALTER TABLE `QRTZ_SIMPROP_TRIGGERS` DISABLE KEYS */;
/*!40000 ALTER TABLE `QRTZ_SIMPROP_TRIGGERS` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `QRTZ_TRIGGERS`
--

DROP TABLE IF EXISTS `QRTZ_TRIGGERS`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `QRTZ_TRIGGERS` (
  `SCHED_NAME` varchar(120) NOT NULL,
  `TRIGGER_NAME` varchar(190) NOT NULL,
  `TRIGGER_GROUP` varchar(190) NOT NULL,
  `JOB_NAME` varchar(190) NOT NULL,
  `JOB_GROUP` varchar(190) NOT NULL,
  `DESCRIPTION` varchar(250) DEFAULT NULL,
  `NEXT_FIRE_TIME` bigint(13) DEFAULT NULL,
  `PREV_FIRE_TIME` bigint(13) DEFAULT NULL,
  `PRIORITY` int(11) DEFAULT NULL,
  `TRIGGER_STATE` varchar(16) NOT NULL,
  `TRIGGER_TYPE` varchar(8) NOT NULL,
  `START_TIME` bigint(13) NOT NULL,
  `END_TIME` bigint(13) DEFAULT NULL,
  `CALENDAR_NAME` varchar(190) DEFAULT NULL,
  `MISFIRE_INSTR` smallint(2) DEFAULT NULL,
  `JOB_DATA` blob DEFAULT NULL,
  PRIMARY KEY (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`),
  KEY `IDX_QRTZ_T_J` (`SCHED_NAME`,`JOB_NAME`,`JOB_GROUP`),
  KEY `IDX_QRTZ_T_JG` (`SCHED_NAME`,`JOB_GROUP`),
  KEY `IDX_QRTZ_T_C` (`SCHED_NAME`,`CALENDAR_NAME`),
  KEY `IDX_QRTZ_T_G` (`SCHED_NAME`,`TRIGGER_GROUP`),
  KEY `IDX_QRTZ_T_STATE` (`SCHED_NAME`,`TRIGGER_STATE`),
  KEY `IDX_QRTZ_T_N_STATE` (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`,`TRIGGER_STATE`),
  KEY `IDX_QRTZ_T_N_G_STATE` (`SCHED_NAME`,`TRIGGER_GROUP`,`TRIGGER_STATE`),
  KEY `IDX_QRTZ_T_NEXT_FIRE_TIME` (`SCHED_NAME`,`NEXT_FIRE_TIME`),
  KEY `IDX_QRTZ_T_NFT_ST` (`SCHED_NAME`,`TRIGGER_STATE`,`NEXT_FIRE_TIME`),
  KEY `IDX_QRTZ_T_NFT_MISFIRE` (`SCHED_NAME`,`MISFIRE_INSTR`,`NEXT_FIRE_TIME`),
  KEY `IDX_QRTZ_T_NFT_ST_MISFIRE` (`SCHED_NAME`,`MISFIRE_INSTR`,`NEXT_FIRE_TIME`,`TRIGGER_STATE`),
  KEY `IDX_QRTZ_T_NFT_ST_MISFIRE_GRP` (`SCHED_NAME`,`MISFIRE_INSTR`,`NEXT_FIRE_TIME`,`TRIGGER_GROUP`,`TRIGGER_STATE`),
  CONSTRAINT `qrtz_triggers_ibfk_1` FOREIGN KEY (`SCHED_NAME`, `JOB_NAME`, `JOB_GROUP`) REFERENCES `QRTZ_JOB_DETAILS` (`SCHED_NAME`, `JOB_NAME`, `JOB_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `QRTZ_TRIGGERS`
--

LOCK TABLES `QRTZ_TRIGGERS` WRITE;
/*!40000 ALTER TABLE `QRTZ_TRIGGERS` DISABLE KEYS */;
--INSERT INTO `QRTZ_TRIGGERS` VALUES ('quartzScheduler','30','698','698-30','connection',NULL,1567188000000,1567152000000,5,'WAITING','CRON',1567069140000,0,NULL,2,''),('quartzScheduler','36','698','698-36','connection',NULL,1567176600000,1567173600000,5,'WAITING','CRON',1567087155000,0,NULL,2,''),('quartzScheduler','37','698','698-37','connection',NULL,1567176600000,1567173600000,5,'WAITING','CRON',1567092130000,0,NULL,2,'');
/*!40000 ALTER TABLE `QRTZ_TRIGGERS` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activity`
--

DROP TABLE IF EXISTS `activity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity` (
  `user_id` int(11) NOT NULL,
  `token_id` varchar(45) DEFAULT NULL,
  `request_time` timestamp NULL DEFAULT NULL,
  `is_locked` char(1) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_activity_user1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity`
--

LOCK TABLES `activity` WRITE;
/*!40000 ALTER TABLE `activity` DISABLE KEYS */;
INSERT INTO `activity` VALUES (1,'f8282e20-de69-4d0e-9c36-3721cc5ab6ba','2019-08-30 14:16:32','0'),(2,NULL,NULL,'1'),(3,NULL,NULL,'1'),(4,NULL,NULL,'1');
/*!40000 ALTER TABLE `activity` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `component`
--

DROP TABLE IF EXISTS `component`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `component` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) DEFAULT NULL,
  `description` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `component`
--

LOCK TABLES `component` WRITE;
/*!40000 ALTER TABLE `component` DISABLE KEYS */;
INSERT INTO `component` VALUES (1,'CONNECTION','Connection description'),(2,'CONNECTOR','Connector description'),(3,'SCHEDULE','Event description'),(4,'USER','User description'),(5,'USERGROUP','User Group description'),(6,'MYPROFILE','My profile description'),(7,'DASHBOARD','Dashboard description'),(8,'APP','Application description'),(9,'INVOKER','Invoker description');
/*!40000 ALTER TABLE `component` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `connector`
--

DROP TABLE IF EXISTS `connector`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `connector` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `invoker` varchar(45) DEFAULT NULL,
  `description` varchar(2048) DEFAULT NULL,
  `source` varchar(256) DEFAULT NULL,
  `authentication` varchar(512) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  UNIQUE KEY `title_UNIQUE` (`title`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `connector`
--

LOCK TABLES `connector` WRITE;
/*!40000 ALTER TABLE `connector` DISABLE KEYS */;
INSERT INTO `connector` VALUES (15,'Becon.TEST.I-DOIT','i-doit','I-DOIT description','http://becon-rice-idoit.westeurope.cloudapp.azure.com/src/jsonrpc.php','{\"url\":\"http://becon-rice-idoit.westeurope.cloudapp.azure.com/src/jsonrpc.php\",\"api_key\":\"AWK123!\",\"username\":\"admin\",\"password\":\"admin\"}'),(16,'Becon.TEST.OTRS','otrs','OTRS description','http://becon-rice-webserver.westeurope.cloudapp.azure.com/otrs/nph-genericinterface.pl/Webservice','{\"url\":\"http://becon-rice-webserver.westeurope.cloudapp.azure.com/otrs/nph-genericinterface.pl/Webservice\",\"UserLogin\":\"root@localhost\",\"Password\":\"init\",\"WebService\":\"OC-Connector\"}');
/*!40000 ALTER TABLE `connector` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enhancement`
--

DROP TABLE IF EXISTS `enhancement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `enhancement` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `connection_id` bigint(20) DEFAULT NULL,
  `expert_code` varchar(1024) DEFAULT NULL,
  `simple_code` varchar(1024) DEFAULT NULL,
  `language` varchar(45) DEFAULT NULL,
  `expert_var` varchar(256) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `connection_id` (`connection_id`)
) ENGINE=InnoDB AUTO_INCREMENT=175 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enhancement`
--

LOCK TABLES `enhancement` WRITE;
/*!40000 ALTER TABLE `enhancement` DISABLE KEYS */;
--INSERT INTO `enhancement` VALUES (172,'Enhancement','Description',797,'var VAR_0, RESULT_VAR;\nif (VAR_0.type_title == \"Server\" || VAR_0.type_title == \"Client\" ) {\n  VAR_0.type_title = \"Hardware\";\n}\nif (VAR_0.cmdb_status_title == \"in operation\") {\n  VAR_0.cmdb_status_title = \"Operational\";\n}\nRESULT_VAR.Class = VAR_0.type_title;\nRESULT_VAR.Name = VAR_0.title;',NULL,'js','//var RESULT_VAR = #9EC798.(request).ConfigItem;\n//var VAR_0 = #FFCFB5.(response).result[];'),(173,'Enhancement','Description',797,'var VAR_0, VAR_1, RESULT_VAR;\nif (VAR_0.type_title == \"Server\" || VAR_0.type_title == \"Client\" ) {\n  VAR_0.type_title = \"Hardware\";\n}\nif (VAR_0.cmdb_status_title == \"in operation\") {\n  VAR_0.cmdb_status_title = \"Operational\";\n}  \nRESULT_VAR.Number = VAR_0.id;\nRESULT_VAR.Class = VAR_0.type_title;\nRESULT_VAR.Name = VAR_0.title;\nRESULT_VAR.DeplState = \"Production\";\nRESULT_VAR.InciState = VAR_0.cmdb_status_title;\nRESULT_VAR.CIXMLData.Vendor = VAR_1[0].manufacturer.title;',NULL,'js','//var RESULT_VAR = #E6E6EA.(request).ConfigItem;\n//var VAR_0 = #FFCFB5.(response).result[];\n//var VAR_1 = #6477AB.(response).result[];'),(174,'enhancement','description',698,'var VAR_0, RESULT_VAR;\nif (VAR_0.type_title == \"Server\" || VAR_0.type_title == \"Client\" ) {\n  VAR_0.type_title = \"Hardware\";\n}\nRESULT_VAR.Class = VAR_0.type_title;\nRESULT_VAR.Name = VAR_0.title;',NULL,'js','//var RESULT_VAR = #6477AB.(request).ConfigItem;\n//var VAR_0 = #FFCFB5.(response).result[];');
/*!40000 ALTER TABLE `enhancement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `execution`
--

DROP TABLE IF EXISTS `execution`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `execution` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `connection_id` bigint(20) NOT NULL,
  `scheduler_id` int(11) DEFAULT NULL,
  `ta_id` bigint(20) DEFAULT NULL,
  `req_type` varchar(45) DEFAULT NULL,
  `start_time` timestamp NULL DEFAULT NULL,
  `end_time` timestamp NULL DEFAULT NULL,
  `status` varchar(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `connection_id_INDEX` (`connection_id`),
  KEY `fk_execution_scheduler1_idx` (`scheduler_id`),
  CONSTRAINT `fk_execution_scheduler1` FOREIGN KEY (`scheduler_id`) REFERENCES `scheduler` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `execution`
--

LOCK TABLES `execution` WRITE;
/*!40000 ALTER TABLE `execution` DISABLE KEYS */;
--INSERT INTO `execution` VALUES (27,698,36,NULL,NULL,'2019-08-29 13:59:28','2019-08-29 13:59:37','S'),(28,698,36,NULL,NULL,'2019-08-29 14:00:00','2019-08-29 14:00:09','S'),(29,698,37,NULL,NULL,'2019-08-29 15:50:00','2019-08-29 15:50:10','S'),(30,698,36,NULL,NULL,'2019-08-29 15:50:00','2019-08-29 15:50:00','F'),(31,698,36,NULL,NULL,'2019-08-29 16:00:00','2019-08-29 16:00:00','F'),(32,698,37,NULL,NULL,'2019-08-29 16:00:00','2019-08-29 16:00:00','F'),(33,698,36,NULL,NULL,'2019-08-30 07:50:00','2019-08-30 07:50:00','F'),(34,698,37,NULL,NULL,'2019-08-30 07:50:00','2019-08-30 07:50:00','F'),(35,698,36,NULL,NULL,'2019-08-30 08:00:00','2019-08-30 08:00:01','F'),(36,698,37,NULL,NULL,'2019-08-30 08:00:00','2019-08-30 08:00:00','F'),(37,698,36,NULL,NULL,'2019-08-30 08:50:00','2019-08-30 08:50:00','F'),(38,698,37,NULL,NULL,'2019-08-30 08:50:00','2019-08-30 08:50:09','S'),(39,698,36,NULL,NULL,'2019-08-30 09:00:00','2019-08-30 09:00:00','F'),(40,698,37,NULL,NULL,'2019-08-30 09:00:00','2019-08-30 09:00:09','S'),(41,698,36,0,NULL,'2019-08-30 11:39:55','2019-08-30 11:40:07','S'),(42,698,36,0,NULL,'2019-08-30 11:57:36','2019-08-30 11:57:46','S'),(43,698,36,0,NULL,'2019-08-30 11:59:12','2019-08-30 11:59:19','S'),(44,698,36,0,NULL,'2019-08-30 11:59:32','2019-08-30 11:59:41','S'),(45,698,36,0,NULL,'2019-08-30 11:59:59','2019-08-30 12:00:00','F'),(46,698,36,0,NULL,'2019-08-30 12:00:00',NULL,NULL),(47,698,37,0,NULL,'2019-08-30 12:00:00','2019-08-30 12:00:00','F'),(48,698,36,0,NULL,'2019-08-30 12:01:24','2019-08-30 12:01:35','S'),(49,698,36,2,NULL,'2019-08-30 12:47:02','2019-08-30 12:48:12','S'),(50,698,36,4,NULL,'2019-08-30 12:48:45','2019-08-30 12:48:55','S'),(51,698,36,6,NULL,'2019-08-30 12:50:00','2019-08-30 12:50:13','S'),(52,698,37,2,NULL,'2019-08-30 12:50:00','2019-08-30 12:50:14','S'),(53,698,36,8,NULL,'2019-08-30 13:00:00','2019-08-30 13:00:00','F'),(54,698,37,4,NULL,'2019-08-30 13:00:00','2019-08-30 13:00:09','S'),(55,698,36,9,NULL,'2019-08-30 13:19:31','2019-08-30 13:19:41','S'),(56,698,36,10,NULL,'2019-08-30 13:19:54','2019-08-30 13:20:03','S'),(57,698,36,11,NULL,'2019-08-30 13:30:50','2019-08-30 13:30:51','F'),(58,698,37,5,NULL,'2019-08-30 13:52:21','2019-08-30 13:53:02','F'),(59,698,36,12,NULL,'2019-08-30 13:50:00','2019-08-30 13:53:02','F'),(60,698,36,13,NULL,'2019-08-30 13:58:44','2019-08-30 13:59:14','F'),(61,698,36,14,NULL,'2019-08-30 14:00:00','2019-08-30 14:00:00','F'),(62,698,37,6,NULL,'2019-08-30 14:00:00','2019-08-30 14:00:00','F'),(63,698,36,15,NULL,'2019-08-30 14:03:37','2019-08-30 14:03:53','S');
/*!40000 ALTER TABLE `execution` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `last_execution`
--

DROP TABLE IF EXISTS `last_execution`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `last_execution` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `connection_id` bigint(20) NOT NULL,
  `s_start_time` timestamp NULL DEFAULT NULL,
  `s_end_time` timestamp NULL DEFAULT NULL,
  `s_duration` bigint(20) DEFAULT NULL,
  `s_ta_id` bigint(20) DEFAULT NULL,
  `f_start_time` timestamp NULL DEFAULT NULL,
  `f_end_time` timestamp NULL DEFAULT NULL,
  `f_duration` bigint(20) DEFAULT NULL,
  `f_ta_id` bigint(20) DEFAULT NULL,
  `scheduler_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `fk_last_execution_scheduler1_idx` (`scheduler_id`),
  CONSTRAINT `fk_last_execution_scheduler1` FOREIGN KEY (`scheduler_id`) REFERENCES `scheduler` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `last_execution`
--

LOCK TABLES `last_execution` WRITE;
/*!40000 ALTER TABLE `last_execution` DISABLE KEYS */;
--INSERT INTO `last_execution` VALUES (7,698,'2019-08-30 14:03:37','2019-08-30 14:03:53',16571,63,'2019-08-30 14:00:00','2019-08-30 14:00:00',191,14,36),(8,698,'2019-08-30 13:00:00','2019-08-30 13:00:09',9762,54,'2019-08-30 14:00:00','2019-08-30 14:00:00',241,6,37);
/*!40000 ALTER TABLE `last_execution` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `periodicity`
--

DROP TABLE IF EXISTS `periodicity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `periodicity` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `description` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_UNIQUE` (`name`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `periodicity`
--

LOCK TABLES `periodicity` WRITE;
/*!40000 ALTER TABLE `periodicity` DISABLE KEYS */;
INSERT INTO `periodicity` VALUES (1,'daily','Iteration each day'),(2,'weekly','Iteration each week'),(3,'monthly','Iteration each month'),(4,'once','Runs only one time');
/*!40000 ALTER TABLE `periodicity` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permission`
--

DROP TABLE IF EXISTS `permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permission` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) DEFAULT NULL,
  `description` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permission`
--

LOCK TABLES `permission` WRITE;
/*!40000 ALTER TABLE `permission` DISABLE KEYS */;
INSERT INTO `permission` VALUES (1,'CREATE','Create operation'),(2,'UPDATE','Update operation'),(3,'DELETE','Delete operation'),(4,'READ','Read operation');
/*!40000 ALTER TABLE `permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `scheduler`
--

DROP TABLE IF EXISTS `scheduler`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `scheduler` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `connection_id` int(11) DEFAULT NULL,
  `title` varchar(45) DEFAULT NULL,
  `status` tinyint(4) NOT NULL,
  `time_zone` int(11) NOT NULL,
  `cron_exp` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scheduler`
--

LOCK TABLES `scheduler` WRITE;
/*!40000 ALTER TABLE `scheduler` DISABLE KEYS */;
--INSERT INTO `scheduler` VALUES (36,698,'delete in otrs',1,300,'0 0/50 * * * ?'),(37,698,'delete in otrs',1,300,'0 0/50 * * * ?');
/*!40000 ALTER TABLE `scheduler` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(45) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  UNIQUE KEY `unique_id_UNIQUE` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'admin@gmail.com','$2a$10$GNfcALk3n7wPr5MUqT2DBOCdbaKfDvFzud7B0ulq3RmtIF3fOGJkW','2018-06-27 12:16:17','2018-06-27 12:16:17'),(2,'test2@gmail.com','$2a$10$yALR8dWYD2ovL.vemQtIe.NTQUfO6GCs4dDfrdWAew/e4StIzgVve','2018-09-12 12:25:07','2018-09-12 12:30:10'),(3,'test@gmail.com','$2a$10$Qj8qtZRxandn7MURUS1qFOmv9Ha.2oOoJXGAsq8vcFMf0hcaH3DAW','2018-09-12 13:10:43','2018-09-12 13:10:43'),(4,'test3@gmail.com','$2a$10$jpn7J/TvANxkwJQf/ZDon.E0uYzVTTtnVIe8Bc0xqI2sVFOQbjzom','2018-09-12 14:14:32','2018-09-12 14:14:32');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_detail`
--

DROP TABLE IF EXISTS `user_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_detail` (
  `user_id` int(11) NOT NULL,
  `name` varchar(45) DEFAULT NULL,
  `surname` varchar(45) DEFAULT NULL,
  `department` varchar(45) DEFAULT NULL,
  `organisation` varchar(45) DEFAULT NULL,
  `salutation` varchar(45) DEFAULT NULL,
  `phone_number` varchar(45) DEFAULT NULL,
  `profile_picture` varchar(192) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `user_id_UNIQUE` (`user_id`),
  KEY `fk_user_detail_user1_idx` (`user_id`),
  CONSTRAINT `fk_user_detail_user1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_detail`
--

LOCK TABLES `user_detail` WRITE;
/*!40000 ALTER TABLE `user_detail` DISABLE KEYS */;
INSERT INTO `user_detail` VALUES (1,'John','Doe','Manager','Org','I freez you!','+99830 302 03 23',NULL,'2018-06-27 12:16:17','2018-06-27 12:16:17'),(2,'Johns Test Of','Does','Testissng','Org','I freez you!','+99830 302 03 23',NULL,'2018-09-12 12:25:07','2018-09-12 12:30:10'),(3,'Test','Malkovich','Manager','Org','I freez you!','+99830 302 03 23',NULL,'2018-09-12 13:10:44','2018-09-12 13:10:44'),(4,'Test','Malkovich','Manager','Org','I freez you!','+99830 302 03 23',NULL,'2018-09-12 14:14:32','2018-09-12 14:14:32');
/*!40000 ALTER TABLE `user_detail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_group`
--

DROP TABLE IF EXISTS `user_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_group` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role` varchar(45) DEFAULT NULL,
  `description` varchar(45) DEFAULT NULL,
  `icon` varchar(256) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_UNIQUE` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_group`
--

LOCK TABLES `user_group` WRITE;
/*!40000 ALTER TABLE `user_group` DISABLE KEYS */;
INSERT INTO `user_group` VALUES (1,'Admin','Admin role',NULL),(2,'Manager','Some description',NULL);
/*!40000 ALTER TABLE `user_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_group_has_component`
--

DROP TABLE IF EXISTS `user_group_has_component`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_group_has_component` (
  `user_group_id` int(11) NOT NULL,
  `component_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  PRIMARY KEY (`user_group_id`,`component_id`,`permission_id`),
  KEY `fk_table1_user_group1_idx` (`user_group_id`),
  KEY `fk_user_group_has_component_component1_idx` (`component_id`),
  KEY `fk_user_group_has_component_permission1_idx` (`permission_id`),
  CONSTRAINT `fk_table1_user_group1` FOREIGN KEY (`user_group_id`) REFERENCES `user_group` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_user_group_has_component_component1` FOREIGN KEY (`component_id`) REFERENCES `component` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_user_group_has_component_permission1` FOREIGN KEY (`permission_id`) REFERENCES `permission` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_group_has_component`
--

LOCK TABLES `user_group_has_component` WRITE;
/*!40000 ALTER TABLE `user_group_has_component` DISABLE KEYS */;
INSERT INTO `user_group_has_component` VALUES (1,1,1),(1,1,2),(1,1,3),(1,1,4),(1,2,1),(1,2,2),(1,2,3),(1,2,4),(1,3,1),(1,3,2),(1,3,3),(1,3,4),(1,4,1),(1,4,2),(1,4,3),(1,4,4),(1,5,1),(1,5,2),(1,5,3),(1,5,4),(1,6,1),(1,6,2),(1,6,3),(1,6,4),(1,7,1),(1,7,2),(1,7,3),(1,7,4),(1,8,1),(1,8,2),(1,8,3),(1,8,4),(1,9,1),(1,9,2),(1,9,3),(1,9,4),(2,4,3),(2,4,4);
/*!40000 ALTER TABLE `user_group_has_component` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_has_user_group`
--

DROP TABLE IF EXISTS `user_has_user_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_has_user_group` (
  `user_id` int(11) NOT NULL,
  `user_group_id` int(11) NOT NULL,
  PRIMARY KEY (`user_id`,`user_group_id`),
  KEY `fk_user_has_user_group_user_group1_idx` (`user_group_id`),
  KEY `fk_user_has_user_group_user1_idx` (`user_id`),
  CONSTRAINT `fk_user_has_user_group_user1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_user_has_user_group_user_group1` FOREIGN KEY (`user_group_id`) REFERENCES `user_group` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_has_user_group`
--

LOCK TABLES `user_has_user_group` WRITE;
/*!40000 ALTER TABLE `user_has_user_group` DISABLE KEYS */;
INSERT INTO `user_has_user_group` VALUES (1,1),(2,1),(3,1),(4,1);
/*!40000 ALTER TABLE `user_has_user_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `webhook`
--

DROP TABLE IF EXISTS `webhook`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `webhook` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(45) NOT NULL,
  `token` varchar(512) DEFAULT NULL,
  `scheduler_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  UNIQUE KEY `uuid_UNIQUE` (`uuid`),
  KEY `fk_webhook_scheduler1_idx` (`scheduler_id`),
  CONSTRAINT `fk_webhook_scheduler1` FOREIGN KEY (`scheduler_id`) REFERENCES `scheduler` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `webhook`
--

LOCK TABLES `webhook` WRITE;
/*!40000 ALTER TABLE `webhook` DISABLE KEYS */;
--INSERT INTO `webhook` VALUES (24,'24ccc87a-ba01-4227-814b-0abf4f6cd674','eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ3ZWJob29rIiwidXNlcklkIjoxLCJ1dWlkIjoiMjRjY2M4N2EtYmEwMS00MjI3LTgxNGItMGFiZjRmNmNkNjc0Iiwic2NoZWR1bGVySWQiOjM2LCJqdGkiOiIzNiJ9.Id_yitoN7k8ViDgeV3xvigaorKpThWKLbcutt0Amlrk',36);
/*!40000 ALTER TABLE `webhook` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2019-09-02 11:47:08
