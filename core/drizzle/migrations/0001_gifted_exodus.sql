CREATE TABLE `daily_stats` (
	`day` text NOT NULL,
	`metric` text NOT NULL,
	`country` text DEFAULT 'XX' NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`day`, `metric`, `country`)
);
--> statement-breakpoint
ALTER TABLE `activity_log` DROP COLUMN `ip`;