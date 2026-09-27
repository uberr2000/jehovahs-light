ALTER TABLE `lit_locations` ADD `visitor_id` varchar(36);--> statement-breakpoint
ALTER TABLE `lit_locations` ADD CONSTRAINT `lit_locations_visitor_id_unique` UNIQUE(`visitor_id`);