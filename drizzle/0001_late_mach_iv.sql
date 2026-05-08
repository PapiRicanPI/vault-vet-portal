CREATE TABLE `access_tier_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tier` enum('Free','Supporter','Investigator') NOT NULL,
	`label` varchar(128) NOT NULL,
	`description` text,
	`downloadsPerMonth` int NOT NULL DEFAULT 0,
	`canSearch` boolean NOT NULL DEFAULT true,
	`canSave` boolean NOT NULL DEFAULT true,
	`canDownload` boolean NOT NULL DEFAULT false,
	`priorityAccess` boolean NOT NULL DEFAULT false,
	`kofiTier` varchar(128),
	`bmcTier` varchar(128),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `access_tier_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `access_tier_config_tier_unique` UNIQUE(`tier`)
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE `donor_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`donorName` varchar(255) NOT NULL,
	`email` varchar(320),
	`platform` varchar(64),
	`donationAmount` float,
	`territory` enum('Philippines','Puerto Rico','United States','Other') NOT NULL DEFAULT 'United States',
	`status` enum('Pending','Sent','Responded','Archived') NOT NULL DEFAULT 'Pending',
	`lastTemplateUsed` varchar(128),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `donor_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `media_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgName` varchar(255) NOT NULL,
	`contactName` varchar(255),
	`email` varchar(320),
	`country` varchar(128),
	`territory` enum('Philippines','Puerto Rico','United States','Other') NOT NULL DEFAULT 'Philippines',
	`status` enum('Pending','Sent','Responded','Archived') NOT NULL DEFAULT 'Pending',
	`daySequence` enum('Day 1','Day 2','Day 3','Complete') NOT NULL DEFAULT 'Day 1',
	`lastTemplateUsed` varchar(128),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `media_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `media_downloads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`researcherId` int NOT NULL,
	`researcherName` varchar(255),
	`fileUrl` text NOT NULL,
	`fileKey` text,
	`fileName` varchar(255),
	`fileType` varchar(64),
	`fileSizeBytes` bigint,
	`downloadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `media_downloads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE `outreach_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`module` enum('Vlogger','School','Media','Donor') NOT NULL,
	`contactId` int NOT NULL,
	`action` varchar(128) NOT NULL,
	`templateUsed` varchar(128),
	`performedBy` varchar(255),
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `outreach_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `school_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schoolName` varchar(255) NOT NULL,
	`principalName` varchar(255),
	`email` varchar(320),
	`phone` varchar(64),
	`region` varchar(128),
	`province` varchar(128),
	`municipality` varchar(128),
	`status` enum('Pending','Sent','Follow-up Sent','Responded','Archived') NOT NULL DEFAULT 'Pending',
	`lastTemplateUsed` varchar(128),
	`followUpCount` int NOT NULL DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `school_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vlogger_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inquiryId` int NOT NULL,
	`action` varchar(128) NOT NULL,
	`templateUsed` varchar(128),
	`performedBy` varchar(255),
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vlogger_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vlogger_inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorName` varchar(255) NOT NULL,
	`platform` varchar(64) NOT NULL,
	`channelUrl` text,
	`contactEmail` varchar(320),
	`status` enum('Pending','Sent','Responded','Archived') NOT NULL DEFAULT 'Pending',
	`deadlineDays` enum('7','14','21') NOT NULL DEFAULT '14',
	`deadlineAt` timestamp,
	`lastTemplateUsed` varchar(128),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vlogger_inquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `portalRole` enum('Observer','Researcher','Custodian','Admin') DEFAULT 'Observer' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `downloadTier` enum('Free','Supporter','Investigator') DEFAULT 'Free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `downloadsUsedThisMonth` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `tierResetAt` timestamp DEFAULT (now()) NOT NULL;