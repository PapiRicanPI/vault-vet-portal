CREATE TABLE `deped_schools` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schoolId` varchar(64),
	`schoolName` varchar(255) NOT NULL,
	`region` varchar(128),
	`province` varchar(128),
	`municipality` varchar(128),
	`programs` text,
	`tvlSpecializations` text,
	`importedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deped_schools_id` PRIMARY KEY(`id`)
);
