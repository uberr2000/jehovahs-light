-- Canonical MySQL schema matching src/lib/db/schema.ts (Drizzle).
-- Safe to re-run: CREATE TABLE IF NOT EXISTS. Does not ALTER existing tables
-- that were created by the original manual SQL with the same names/columns.

CREATE TABLE IF NOT EXISTS `gps_consent` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(45) NOT NULL,
  `consented` boolean NOT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `gps_consent_ip_address_unique` (`ip_address`)
);

CREATE TABLE IF NOT EXISTS `lit_locations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `latitude` double NOT NULL,
  `longitude` double NOT NULL,
  `city` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `country_code` varchar(8) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(1024) DEFAULT NULL,
  `visitor_id` varchar(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `lit_locations_visitor_id_unique` (`visitor_id`)
);

-- Existing databases created before visitor_id (drizzle/0001_visitor_id.sql):
-- ALTER TABLE `lit_locations` ADD `visitor_id` varchar(36);
-- ALTER TABLE `lit_locations` ADD CONSTRAINT `lit_locations_visitor_id_unique` UNIQUE(`visitor_id`);
