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

--changeset 1.1:3 runOnChange:true stripComments:true splitStatements:true endDelimiter:;

alter table connector add column if not exists icon  varchar(128);

--changeset 1.1:4 runOnChange:true stripComments:true splitStatements:true endDelimiter:;
ALTER TABLE enhancement MODIFY expert_code varchar(1024);

--changeset 1.1:5 runOnChange:true stripComments:true splitStatements:true endDelimiter:;
ALTER TABLE enhancement MODIFY expert_code TEXT;

--changeset 1.3:1 runOnChange:true stripComments:true splitStatements:true endDelimiter:;
-- -----------------------------------------------------
-- Table `mydb`.`widget`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `widget` (
  `id` INT NOT NULL,
  `name` VARCHAR(45) NULL,
  `icon` VARCHAR(45) NULL,
  `tooltipTranslationKey` VARCHAR(45) NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `id_UNIQUE` (`id` ASC),
  UNIQUE INDEX `name_UNIQUE` (`name` ASC))
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `mydb`.`widget_setting`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `widget_setting` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `x_axis` INT NULL,
  `y_axis` INT NULL,
  `width` INT NULL,
  `height` INT NULL,
  `min_width` INT NULL,
  `min_height` INT NULL,
  `widget_id` INT NOT NULL,
  `user_id` INT(11) NOT NULL,
  PRIMARY KEY (`id`, `widget_id`),
  INDEX `fk_widget_setting_widget_idx` (`widget_id` ASC),
  INDEX `fk_widget_setting_user1_idx` (`user_id` ASC),
  CONSTRAINT `fk_widget_setting_widget`
    FOREIGN KEY (`widget_id`)
    REFERENCES `widget` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_widget_setting_user1`
    FOREIGN KEY (`user_id`)
    REFERENCES `opencelium`.`user` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

--changeset 1.3:2 runOnChange:true stripComments:true splitStatements:true endDelimiter:;
LOCK TABLES `widget` WRITE;
/*!40000 ALTER TABLE `event_notification_has_event_recipient` DISABLE KEYS */;
INSERT INTO `widget` VALUES (1,'CONNECTION_OVERVIEW','cable','Connection Overview'), (2,'CURRENT_SCHEDULER','date_range','Current Scheduler'), (3,'MONITORING_BOARDS','analytics','Monitoring Boards');
/*!40000 ALTER TABLE `event_notification_has_event_recipient` ENABLE KEYS */;
UNLOCK TABLES;

--changeset 2.0:1 runOnChange:true stripComments:true splitStatements:true endDelimiter:;
-- -----------------------------------------------------
-- Table `opencelium`.`business_layout`
-- -----------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `bl_svg_items` ;
DROP TABLE IF EXISTS `bl_arrows` ;
DROP TABLE IF EXISTS `business_layout` ;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE IF NOT EXISTS `business_layout` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NULL,
  `connection_id` INT(11) NOT NULL,
  PRIMARY KEY (`id`, `connection_id`),
  UNIQUE INDEX `id_UNIQUE` (`id` ASC),
  INDEX `fk_business_layout_connection_idx` (`connection_id` ASC),
  CONSTRAINT `fk_business_layout_connection`
    FOREIGN KEY (`connection_id`)
    REFERENCES `opencelium`.`connection` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `opencelium`.`bl_svg_items`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `bl_svg_items` (
  `id` INT NOT NULL,
  `name` VARCHAR(45) NULL,
  `x_axis` INT NULL,
  `y_axis` INT NULL,
  `items` LONGTEXT NULL,
  `business_layout_id` INT NOT NULL,
  PRIMARY KEY (`id`, `business_layout_id`),
  INDEX `fk_svg_items_business_layout1_idx` (`business_layout_id` ASC),
  CONSTRAINT `fk_svg_items_business_layout1`
    FOREIGN KEY (`business_layout_id`)
    REFERENCES `business_layout` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `opencelium`.`bl_arrows`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `bl_arrows` (
  `business_layout_id` INT NOT NULL,
  `arr_from` INT NOT NULL,
  `arr_to` INT NOT NULL,
  PRIMARY KEY (`business_layout_id`, arr_from, arr_to),
  UNIQUE KEY (`business_layout_id`,`arr_from`,`arr_to`),
  INDEX `fk_arrows_business_layout1_idx` (`business_layout_id`),
  CONSTRAINT `fk_arrows_business_layout1`
    FOREIGN KEY (`business_layout_id`)
    REFERENCES `business_layout` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

--changeset 2.0:2 runOnChange:true stripComments:true splitStatements:true endDelimiter:;
ALTER TABLE detail ADD COLUMN IF NOT EXISTS repo_user varchar(200);
ALTER TABLE detail ADD COLUMN IF NOT EXISTS repo_password varchar(200);

--changeset 2.0:3 runOnChange:true stripComments:true splitStatements:true endDelimiter:;
ALTER TABLE scheduler ADD COLUMN IF NOT EXISTS debug_mode tinyint(4);

--changeset 2.0:4 runOnChange:true stripComments:true splitStatements:true endDelimiter:;
UPDATE scheduler SET debug_mode = 1;

--changeset 2.0:5 runOnChange:true stripComments:true splitStatements:true endDelimiter:;
ALTER TABLE connector ADD COLUMN IF NOT EXISTS ssl_cert tinyint(4);
UPDATE connector SET ssl_cert = 0;

--changeset 2.1:1 runOnChange:true stripComments:true splitStatements:true endDelimiter:;
ALTER TABLE connector ADD COLUMN IF NOT EXISTS timeout INT NOT NULL;

--changeset 2.1:2 runOnChange:true stripComments:true splitStatements:true endDelimiter:;
ALTER TABLE detail CHANGE IF EXISTS organisation organization varchar(100);

--changeset 2.1:3 runOnChange:true stripComments:true splitStatements:true endDelimiter:;
ALTER TABLE enhancement MODIFY expert_var TEXT;

--changeset 2.3:1 runOnChange:true stripComments:true splitStatements:true endDelimiter:;
ALTER TABLE detail ADD COLUMN IF NOT EXISTS theme_sync tinyint(4);
UPDATE detail SET theme_sync = 0;

--changeset 3.0:1 runOnChange:true stripComments:true splitStatements:true endDelimiter:;
SELECT VERSION();

--changeset 3.1:1 runOnChange:true stripComments:true splitStatements:true endDelimiter:;
SELECT VERSION();

--changeset 3.1:2 runOnChange:true stripComments:true splitStatements:true endDelimiter:;
UPDATE event_content SET language="en" where language="eng";

--changeset 3.1.1:1 runOnChange:true stripComments:true splitStatements:true endDelimiter:;
SELECT VERSION();

--changeset 3.1.2:1 runOnChange:true stripComments:true splitStatements:true endDelimiter:;
SELECT VERSION();

--changeset 3.2:1 runOnChange:true stripComments:true splitStatements:true endDelimiter:;
CREATE TABLE data_aggregator (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    script LONGTEXT
);

--changeset 3.2:2 runOnChange:true stripComments:true splitStatements:true endDelimiter:;
CREATE TABLE aggregator_argument (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data_aggregator_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    UNIQUE KEY unique_aggregator_argument_per_aggregator (data_aggregator_id, name),
    FOREIGN KEY (data_aggregator_id) REFERENCES data_aggregator(id)
);

--changeset 3.2:3 runOnChange:true stripComments:true splitStatements:true endDelimiter:;
CREATE TABLE execution_argument (
    execution_id bigint(20) NOT NULL,
    aggregator_argument_id INT NOT NULL,
    arg_value VARCHAR(255),
    PRIMARY KEY (execution_id, aggregator_argument_id),
    FOREIGN KEY (execution_id) REFERENCES execution(id),
    FOREIGN KEY (aggregator_argument_id) REFERENCES aggregator_argument(id)
);

--changeset 3.2:4 runOnChange:true stripComments:true splitStatements:true endDelimiter:;
ALTER TABLE data_aggregator ADD CONSTRAINT unique_name UNIQUE (name);

--changeset 3.2:5 runOnChange:true stripComments:true splitStatements:true endDelimiter:;
ALTER TABLE data_aggregator ADD COLUMN is_active TINYINT(1);

--changeset 3.2:6 runOnChange:true stripComments:true splitStatements:true endDelimiter:;
ALTER TABLE data_aggregator ALTER COLUMN is_active SET DEFAULT 1;

--changeset 3.2:7 runOnChange:true stripComments:true splitStatements:true endDelimiter:;
ALTER TABLE webhook MODIFY COLUMN token LONGTEXT;

--changeset 3.2.1:1 runOnChange:true stripComments:true splitStatements:true endDelimiter:;
SELECT VERSION();

--changeset 3.2.1:2 runOnChange:true stripComments:true splitStatements:true endDelimiter:;
ALTER TABLE connector CHANGE ssl_cert ssl_validation tinyint(4);



