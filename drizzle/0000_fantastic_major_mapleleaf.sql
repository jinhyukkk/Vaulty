CREATE TABLE `accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`currency` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fx_rates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`base` text NOT NULL,
	`quote` text NOT NULL,
	`rate` integer NOT NULL,
	`ts` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fx_rates_base_quote_ts_unique` ON `fx_rates` (`base`,`quote`,`ts`);--> statement-breakpoint
CREATE TABLE `instruments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`symbol` text NOT NULL,
	`asset_class` text NOT NULL,
	`name` text NOT NULL,
	`currency` text NOT NULL,
	`provider` text NOT NULL,
	`provider_symbol` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `instruments_symbol_class_unique` ON `instruments` (`symbol`,`asset_class`);--> statement-breakpoint
CREATE TABLE `price_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`instrument_id` integer NOT NULL,
	`currency` text NOT NULL,
	`price` integer NOT NULL,
	`ts` integer NOT NULL,
	FOREIGN KEY (`instrument_id`) REFERENCES `instruments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `price_snapshots_instrument_ts_unique` ON `price_snapshots` (`instrument_id`,`ts`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`instrument_id` integer,
	`type` text NOT NULL,
	`ts` integer NOT NULL,
	`quantity` integer,
	`price` integer,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`fx_rate` integer,
	`note` text,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`instrument_id`) REFERENCES `instruments`(`id`) ON UPDATE no action ON DELETE no action
);
