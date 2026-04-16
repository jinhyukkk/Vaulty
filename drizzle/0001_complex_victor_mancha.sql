CREATE TABLE `target_allocations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`asset_class` text NOT NULL,
	`target_bps` integer NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `target_allocations_class_unique` ON `target_allocations` (`asset_class`);--> statement-breakpoint
ALTER TABLE `instruments` ADD `kind` text DEFAULT 'asset' NOT NULL;