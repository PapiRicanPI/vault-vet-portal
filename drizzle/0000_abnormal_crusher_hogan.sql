CREATE TABLE `brain_exercise_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`exerciseType` enum('memory','pattern','word_association','breathing','gratitude') NOT NULL,
	`prompt` text,
	`userResponse` text,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `brain_exercise_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creator_scan_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` enum('youtube','google_news','reddit','vimeo') NOT NULL,
	`title` varchar(500) NOT NULL,
	`url` varchar(1000) NOT NULL,
	`channelOrAuthor` varchar(255),
	`description` text,
	`thumbnail` varchar(1000),
	`publishedAt` varchar(100),
	`keyword` varchar(255),
	`leadStatus` enum('new','reviewing','contacted','archived') NOT NULL DEFAULT 'new',
	`notes` text,
	`savedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `creator_scan_leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `donor_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`handle` varchar(255),
	`donorPlatform` enum('kofi','buymeacoffee','grant','individual','other') NOT NULL,
	`tier` varchar(100),
	`amountUSD` varchar(50),
	`donorStatus` enum('new','thanked','follow_up_sent','responded','declined','no_reply') NOT NULL DEFAULT 'new',
	`lastContactedAt` timestamp,
	`followUpDate` timestamp,
	`replyNotes` text,
	`replyReceivedAt` timestamp,
	`internalNotes` text,
	`grantOrg` varchar(255),
	`grantDeadline` varchar(10),
	`grantAmount` varchar(100),
	`grantUrl` varchar(1000),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `donor_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `export_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`researcherId` int NOT NULL,
	`researcherAlias` varchar(100) NOT NULL,
	`caseId` varchar(100) NOT NULL,
	`caseTitle` varchar(500),
	`documentId` varchar(36) NOT NULL,
	`fileUrl` varchar(1000),
	`fileKey` varchar(500),
	`exportedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `export_logs_id` PRIMARY KEY(`id`),
	CONSTRAINT `export_logs_documentId_unique` UNIQUE(`documentId`)
);
--> statement-breakpoint
CREATE TABLE `focus_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionDate` varchar(10) NOT NULL,
	`devotionVerseRef` varchar(100),
	`devotionVerseText` text,
	`devotionReflection` text,
	`prayerText` text,
	`devotionCompletedAt` timestamp,
	`sessionStartedAt` timestamp,
	`sessionEndedAt` timestamp,
	`totalMinutes` int DEFAULT 0,
	`endOfDayAnswer` text,
	`closingVerseRef` varchar(100),
	`closingVerseText` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `focus_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`personalMessage` text,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`sentBy` int,
	`token` varchar(64) NOT NULL,
	`usedAt` timestamp,
	CONSTRAINT `invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `invitations_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `media_outreach_status` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contactNum` int NOT NULL,
	`mediaStatus` enum('not_sent','sent','responded','no_reply','meeting') NOT NULL DEFAULT 'not_sent',
	`lastContactedAt` timestamp,
	`responseNotes` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `media_outreach_status_id` PRIMARY KEY(`id`),
	CONSTRAINT `media_outreach_status_contactNum_unique` UNIQUE(`contactNum`)
);
--> statement-breakpoint
CREATE TABLE `research_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` enum('investigation','interview','deadline','outreach','review','personal','other') NOT NULL DEFAULT 'other',
	`startDate` varchar(10) NOT NULL,
	`endDate` varchar(10) NOT NULL,
	`startTime` varchar(5),
	`endTime` varchar(5),
	`allDay` int NOT NULL DEFAULT 1,
	`caseRef` varchar(255),
	`completed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `research_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `researcher_bookmarks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`researcherId` int NOT NULL,
	`caseId` varchar(100) NOT NULL,
	`caseTitle` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `researcher_bookmarks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `researcher_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`researcherId` int NOT NULL,
	`caseId` varchar(100) NOT NULL,
	`note` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `researcher_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `researcher_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`researcherId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`caseIds` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `researcher_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `researcher_recently_viewed` (
	`id` int AUTO_INCREMENT NOT NULL,
	`researcherId` int NOT NULL,
	`caseId` varchar(100) NOT NULL,
	`caseTitle` varchar(500),
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `researcher_recently_viewed_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `researchers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vettingId` int,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`alias` varchar(100),
	`country` varchar(100),
	`bio` text,
	`organization` varchar(255),
	`passwordHash` varchar(255) NOT NULL,
	`role` enum('observer','researcher','custodian','admin') NOT NULL DEFAULT 'observer',
	`foundingInvestigator` int NOT NULL DEFAULT 0,
	`foundingInvestigatorYear` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastLoginAt` timestamp,
	CONSTRAINT `researchers_id` PRIMARY KEY(`id`),
	CONSTRAINT `researchers_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `school_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`principalName` varchar(255) NOT NULL,
	`schoolName` varchar(255) NOT NULL,
	`district` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`notes` text,
	`schoolOutreachStatus` enum('not_sent','sent','responded','no_reply','meeting') NOT NULL DEFAULT 'not_sent',
	`lastEmailedAt` timestamp,
	`followUpDate` timestamp,
	`followUpSent` boolean NOT NULL DEFAULT false,
	`followUpSentAt` timestamp,
	`replyNotes` text,
	`replyReceivedAt` timestamp,
	`finalNudgeSent` boolean NOT NULL DEFAULT false,
	`finalNudgeSentAt` timestamp,
	`internalNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `school_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pseudonym` varchar(100),
	`burnerEmail` varchar(320),
	`category` enum('fraud','misuse_of_funds','false_claims','identity','network','other') NOT NULL,
	`subject` varchar(500) NOT NULL,
	`message` text NOT NULL,
	`fileUrl` varchar(1000),
	`fileKey` varchar(500),
	`fileName` varchar(255),
	`ipHash` varchar(64),
	`status` enum('new','reviewing','actioned','closed') NOT NULL DEFAULT 'new',
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'low',
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tips_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `vetting_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`displayName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`profileUrl` text,
	`organization` varchar(255),
	`orgRole` varchar(255),
	`orgWebsite` text,
	`priorWork` json,
	`investigationProject` text NOT NULL,
	`geographicFocus` varchar(255) NOT NULL,
	`outputType` varchar(100) NOT NULL,
	`supportLink` text,
	`agreesToCredit` int NOT NULL DEFAULT 0,
	`underThreats` varchar(50),
	`useOpSec` int DEFAULT 0,
	`opSecTools` text,
	`previouslyDoxxed` varchar(50),
	`emergencyContact` text,
	`consentSafetyOutreach` int DEFAULT 0,
	`agreesToTerms` int NOT NULL DEFAULT 0,
	`agreesToPrivacy` int NOT NULL DEFAULT 0,
	`referralSource` varchar(255),
	`willShareRawData` int DEFAULT 0,
	`aiScore` int,
	`aiScoreIdentity` int,
	`aiScoreOrganization` int,
	`aiScorePurpose` int,
	`aiScoreSupport` int,
	`aiScoreRisk` int,
	`aiRationale` text,
	`aiRecommendation` varchar(20),
	`lastEmailId` varchar(64),
	`lastEmailType` varchar(30),
	`lastEmailSentAt` timestamp,
	`emailOpenedAt` timestamp,
	`status` enum('pending','approved','rejected','needs_info','user_downgraded') NOT NULL DEFAULT 'pending',
	`adminNotes` text,
	`assignedRole` varchar(50),
	`reviewedAt` timestamp,
	`reviewedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vetting_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vlogger_inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorName` varchar(255) NOT NULL,
	`channelName` varchar(255),
	`vloggerPlatform` enum('youtube','tiktok','facebook','instagram','other') NOT NULL DEFAULT 'youtube',
	`subscriberCount` varchar(100),
	`email` varchar(320),
	`evidenceTier` enum('confirmed_violation','documented_evidence','under_investigation') NOT NULL DEFAULT 'under_investigation',
	`violationDate` varchar(50),
	`agency` varchar(255),
	`violationSummary` text,
	`startYear` varchar(10),
	`estimatedRevenue` varchar(100),
	`inquiryStatus` enum('not_sent','sent','responded','no_reply','declined') NOT NULL DEFAULT 'not_sent',
	`dateSent` timestamp,
	`deadline` timestamp,
	`sentLetterText` text,
	`internalNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vlogger_inquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `volunteer_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`age` int NOT NULL,
	`schoolName` varchar(255) NOT NULL,
	`gradeLevel` varchar(50) NOT NULL,
	`strand` varchar(100),
	`city` varchar(100) NOT NULL,
	`volunteerRole` enum('osint_research_trainee','data_verification_trainee','digital_journalism_apprentice') NOT NULL,
	`teacherName` varchar(255) NOT NULL,
	`teacherEmail` varchar(320) NOT NULL,
	`teacherSubject` varchar(100),
	`whyApply` text NOT NULL,
	`relevantExperience` text,
	`availabilityHoursPerWeek` int NOT NULL,
	`parentalConsentGiven` int NOT NULL DEFAULT 0,
	`parentName` varchar(255),
	`parentEmail` varchar(320),
	`agreesToTerms` int NOT NULL DEFAULT 0,
	`agreesToConfidentiality` int NOT NULL DEFAULT 0,
	`aiScore` int,
	`aiScoreMotivation` int,
	`aiScoreReliability` int,
	`aiScoreSkillFit` int,
	`aiScoreAvailability` int,
	`aiRationale` text,
	`aiRecommendation` varchar(20),
	`volunteerStatus` enum('pending','approved','rejected','needs_info') NOT NULL DEFAULT 'pending',
	`adminNotes` text,
	`hoursCompleted` int DEFAULT 0,
	`contributionSummary` text,
	`certificateIssuedAt` timestamp,
	`certificateFileUrl` varchar(1000),
	`certificateDocId` varchar(20),
	`ipHash` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `volunteer_applications_id` PRIMARY KEY(`id`),
	CONSTRAINT `volunteer_applications_certificateDocId_unique` UNIQUE(`certificateDocId`)
);
--> statement-breakpoint
CREATE TABLE `weekly_ops_completions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`weekStart` varchar(10) NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weekly_ops_completions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weekly_ops_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`day` enum('monday','tuesday','wednesday','thursday','friday') NOT NULL,
	`block` enum('vetting','platform') NOT NULL,
	`label` varchar(255) NOT NULL,
	`description` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weekly_ops_tasks_id` PRIMARY KEY(`id`)
);
