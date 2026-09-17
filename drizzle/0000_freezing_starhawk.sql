-- Idempotent: safe if tables already exist from the original manual SQL
-- (same names/columns: gps_consent, lit_locations).
CREATE TABLE IF NOT EXISTS `gps_consent` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`ip_address` varchar(45) NOT NULL,
	`consented` boolean NOT NULL,
	`latitude` double,
	`longitude` double,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gps_consent_id` PRIMARY KEY(`id`),
	CONSTRAINT `gps_consent_ip_address_unique` UNIQUE(`ip_address`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `lit_locations` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`latitude` double NOT NULL,
	`longitude` double NOT NULL,
	`city` varchar(255),
	`country` varchar(255),
	`country_code` varchar(8),
	`ip_address` varchar(45),
	`user_agent` varchar(1024),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lit_locations_id` PRIMARY KEY(`id`)
);
