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
-- Tabellenstruktur für Tabelle `produkte`
--

CREATE TABLE `produkte` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `preis` decimal(5,2) NOT NULL,
  `kategorie` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `produkte`
--

INSERT INTO `produkte` (`id`, `name`, `preis`, `kategorie`) VALUES
(17, 'Wurst - Test', '3.50', 'Wurst'),
(18, 'Wurst - Schwein', '3.50', 'Wurst'),
(19, 'Currywurst - Rind', '4.00', 'Wurst'),
(20, 'Currywurst - Schwein', '4.00', 'Wurst'),
(21, 'Steak', '5.50', 'Fleisch'),
(22, 'Gyros', '4.50', 'Fleisch'),
(23, 'Hamburger', '6.00', 'Fast Food'),
(24, 'Cheeseburger', '6.50', 'Fast Food'),
(25, 'Pommes', '2.50', 'Beilage'),
(26, 'Brötchen', '0.50', 'Beilage'),
(27, 'Salat', '5.50', 'Vegetarisch'),
(28, 'Falafel', '3.50', 'Vegetarisch'),
(29, 'Pfand', '1.00', 'Pfand'),
(30, 'Pfand Rückgabe', '-1.00', 'Pfand'),
(31, 'Flammkuchen Speck', '7.00', 'Flammkuchen'),
(32, 'Flammkuchen Veg', '6.50', 'Flammkuchen');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `produkte`
--
ALTER TABLE `produkte`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `produkte`
--
ALTER TABLE `produkte`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
