--liquibase formatted sql

--changeset 1.1:1 runOnChange:true stripComments:true splitStatements:true endDelimiter:;

--
-- Table structure for table `event_message`
--

DROP TABLE IF EXISTS `notification_has_recipient`;
DROP TABLE IF EXISTS `notification`;
DROP TABLE IF EXISTS `content`;
DROP TABLE IF EXISTS `message`;
DROP TABLE IF EXISTS `recipient`;
DROP TABLE IF EXISTS `event_notification_has_event_recipient`;
DROP TABLE IF EXISTS `event_notification`;
DROP TABLE IF EXISTS `event_content`;
DROP TABLE IF EXISTS `event_message`;
DROP TABLE IF EXISTS `event_recipient`;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `event_message` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL,
  `type` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_message`
--

LOCK TABLES `event_message` WRITE;
/*!40000 ALTER TABLE `event_message` DISABLE KEYS */;
/*!40000 ALTER TABLE `event_message` ENABLE KEYS */;
UNLOCK TABLES;


--
-- Table structure for table `event_content`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `event_content` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subject` varchar(128) NOT NULL,
  `body` varchar(1024) DEFAULT NULL,
  `language` varchar(128) NOT NULL,
  `event_message_id` int(11) NOT NULL,
  PRIMARY KEY (`id`, `event_message_id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `fk_event_content_event_message1_idx` (`event_message_id`),
  CONSTRAINT `fk_event_content_event_message1` FOREIGN KEY (`event_message_id`) REFERENCES `event_message` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_content`
--

LOCK TABLES `event_content` WRITE;
/*!40000 ALTER TABLE `event_message` DISABLE KEYS */;
/*!40000 ALTER TABLE `event_event_message` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_notification`
--


/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `event_notification` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `scheduler_id` int(11) NOT NULL,
  `name` varchar(45) DEFAULT NULL,
  `event_type` varchar(45) DEFAULT NULL,
  `event_message_id` int(11) NOT NULL,
  PRIMARY KEY (`id`,`scheduler_id`,`event_message_id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `fk_event_notification_scheduler1_idx` (`scheduler_id`),
  KEY `fk_event_notification_event_message1_idx` (`event_message_id`),
  CONSTRAINT `fk_event_notification_scheduler1` FOREIGN KEY (`scheduler_id`) REFERENCES `scheduler` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_event_notification_event_message1` FOREIGN KEY (`event_message_id`) REFERENCES `event_message` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;



--
-- Dumping data for table `event_notification`
--

LOCK TABLES `event_notification` WRITE;
/*!40000 ALTER TABLE `event_notification` DISABLE KEYS */;
/*!40000 ALTER TABLE `event_notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_recipient`
--


/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `event_recipient` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `destination` varchar(128) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_recipient`
--

LOCK TABLES `event_recipient` WRITE;
/*!40000 ALTER TABLE `event_recipient` DISABLE KEYS */;
/*!40000 ALTER TABLE `event_recipient` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_notification_has_event_recipient`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `event_notification_has_event_recipient` (
  `event_notification_id` int(11) NOT NULL,
  `event_recipient_id` int(11) NOT NULL,
  PRIMARY KEY (`event_notification_id`,`event_recipient_id`),
  KEY `fk_notification_has_recipient_notification1_idx` (`event_notification_id`),
  KEY `fk_notification_has_recipient_recipient1_idx` (`event_recipient_id`),
  CONSTRAINT `fk_notification_has_recipient_notification1` FOREIGN KEY (`event_notification_id`) REFERENCES `event_notification` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_notification_has_recipient_recipient1` FOREIGN KEY (`event_recipient_id`) REFERENCES `event_recipient` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_notification_has_event_recipient`
--

LOCK TABLES `event_notification_has_event_recipient` WRITE;
/*!40000 ALTER TABLE `event_notification_has_event_recipient` DISABLE KEYS */;
/*!40000 ALTER TABLE `event_notification_has_event_recipient` ENABLE KEYS */;
UNLOCK TABLES;


--changeset 1.1:2 runOnChange:true stripComments:true splitStatements:true endDelimiter:;

alter table detail add column if not exists lang varchar(3) not null default 'eng';
