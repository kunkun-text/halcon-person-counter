CREATE TABLE `recognition_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`totalPeople` int NOT NULL,
	`confidence` float NOT NULL,
	`detections` json NOT NULL,
	`processingTime` float NOT NULL,
	`imageUrl` text NOT NULL,
	`imageKey` varchar(255) NOT NULL,
	`imageName` varchar(255),
	`imageSize` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recognition_results_id` PRIMARY KEY(`id`)
);
