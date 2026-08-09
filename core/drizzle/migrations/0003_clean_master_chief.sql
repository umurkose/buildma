PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_exports` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`country` text,
	`blocks` integer DEFAULT 0 NOT NULL,
	`bytes` integer DEFAULT 0 NOT NULL,
	`html` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_exports`("id", "kind", "country", "blocks", "bytes", "html", "created_at") SELECT "id", "kind", "country", "blocks", "bytes", "html", "created_at" FROM `exports`;--> statement-breakpoint
DROP TABLE `exports`;--> statement-breakpoint
ALTER TABLE `__new_exports` RENAME TO `exports`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `exports_created_at` ON `exports` (`created_at`);