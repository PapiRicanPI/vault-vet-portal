CREATE TABLE `media_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`source` enum('Google News','YouTube','Reddit','Google Web') NOT NULL,
	`platform` varchar(64),
	`publishedAt` timestamp,
	`snippet` text,
	`rightsStatus` enum('Unknown','Free to Use','Copyrighted','Fair Use') NOT NULL DEFAULT 'Unknown',
	`status` enum('Lead','Verified','Coded','Archived') NOT NULL DEFAULT 'Lead',
	`caseRef` varchar(128),
	`notes` text,
	`savedBy` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `media_leads_id` PRIMARY KEY(`id`)
);
