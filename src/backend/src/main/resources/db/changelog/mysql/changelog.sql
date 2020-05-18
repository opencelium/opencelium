--liquibase formatted sql

--changeset 1.1:1
ALTER TABLE connection DROP COLUMN IF EXISTS name1;

--changeset 1.1:2
--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notification` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `scheduler_id` int(11) NOT NULL,
  `name` varchar(45) DEFAULT NULL,
  `event_type` varchar(45) DEFAULT NULL,
  `app` varchar(127) DEFAULT NULL,
  `text` varchar(1024) DEFAULT NULL,
  PRIMARY KEY (`id`,`scheduler_id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `fk_notification_scheduler1_idx` (`scheduler_id`),
  CONSTRAINT `fk_notification_scheduler1` FOREIGN KEY (`scheduler_id`) REFERENCES `scheduler` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification`
--

LOCK TABLES `notification` WRITE;
/*!40000 ALTER TABLE `notification` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recipient`
--

DROP TABLE IF EXISTS `recipient`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `recipient` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `destination` varchar(128) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recipient`
--

LOCK TABLES `recipient` WRITE;
/*!40000 ALTER TABLE `recipient` DISABLE KEYS */;
/*!40000 ALTER TABLE `recipient` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_has_recipient`
--

DROP TABLE IF EXISTS `notification_has_recipient`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notification_has_recipient` (
  `notification_id` int(11) NOT NULL,
  `recipient_id` int(11) NOT NULL,
  PRIMARY KEY (`notification_id`,`recipient_id`),
  KEY `fk_notification_has_recipient_notification1_idx` (`notification_id`),
  KEY `fk_notification_has_recipient_recipient1_idx` (`recipient_id`),
  CONSTRAINT `fk_notification_has_recipient_notification1` FOREIGN KEY (`notification_id`) REFERENCES `notification` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_notification_has_recipient_recipient1` FOREIGN KEY (`recipient_id`) REFERENCES `recipient` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_has_recipient`
--

LOCK TABLES `notification_has_recipient` WRITE;
/*!40000 ALTER TABLE `notification_has_recipient` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_has_recipient` ENABLE KEYS */;
UNLOCK TABLES;