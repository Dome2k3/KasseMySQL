-- phpMyAdmin SQL Dump
-- version 4.9.11
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Erstellungszeit: 31. Mrz 2025 um 18:56
-- Server-Version: 10.11.8-MariaDB-0ubuntu0.24.04.1-log
-- PHP-Version: 7.4.33-nmm7

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Datenbank: `d0431c45`
--

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `bon_items`
--

CREATE TABLE `bon_items` (
  `id` int(11) NOT NULL,
  `bon_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `price` decimal(5,2) NOT NULL,
  `quantity` int(11) NOT NULL,
  `total` decimal(5,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `bon_items`
--
ALTER TABLE `bon_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bon_id` (`bon_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `bon_items`
--
ALTER TABLE `bon_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=171;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `bon_items`
--
ALTER TABLE `bon_items`
  ADD CONSTRAINT `bon_items_ibfk_1` FOREIGN KEY (`bon_id`) REFERENCES `bon` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
