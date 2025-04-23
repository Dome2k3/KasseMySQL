require('dotenv').config({ path: './Umgebung.env' });

// MYSQL
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");

// Drucker
const { SerialPort } = require('serialport'); // Für den SerialPort weiterhin CommonJS
const esc = '\x1B'; // ESC-Zeichen für Steuerbefehle
const setEncoding = esc + '\x1B\x74' + '\x02'; // CP850 aktivieren (falls benötigt)
const FEED = '\x1B\x64\x03'; // ESC d 3: Papierzufuhr (weiterer Abstand)
// ESC/POS-Befehl für den Abschneider
const CUT = '\x1B\x69'; // ESC i: Befehl zum Abschneiden

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// // 🔹 MySQL-Verbindung
// const db = mysql.createConnection({
//     host: "localhost",
//     user: "Kasse",
//     password: "Kasse",
//     database: "kasse"
// });


const db = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
});


// // 🔹 Route zum Speichern der Daten
// app.post('/saveReceipts', (req, res) => {
//     console.log("Empfangener Request Body:", req.body);
//     const { receipts } = req.body;
//     if (!receipts || receipts.length === 0) {
//         console.error("Fehler: Kein einziger Datensatz zum Einfügen!");
//         return res.status(400).json({ error: "Keine Daten zum Einfügen" });
//     }
//
//     // Erzeuge ein Array von Arrays – jede innere Zeile entspricht einer Datenzeile für die DB.
//     const values = receipts.map(item => [
//         item.bonNumber,
//         item.product_id,  // Beachte: Hier muss die Produkt-ID übermittelt werden
//         item.quantity,
//         item.price
//     ]);
//
//     // Verwende eine parameterisierte Query, um alle Zeilen in einem INSERT zu schreiben
//     const sql = "INSERT INTO receipts (bonNumber, product_id, quantity, price) VALUES ?";
//     console.log("SQL Query:", sql, values);
//
//     db.query(sql, [values], function (err, result) {
//         if (err) {
//             console.error("Fehler beim SQL-Insert:", err);
//             return res.status(500).json({ error: "Fehler beim Speichern der Daten" });
//         }
//         console.log("Daten erfolgreich gespeichert.");
//         return res.status(200).json({ success: true, result });
//     });
// });

app.post("/finalize-bon", (req, res) => {
    console.log("📥 Eingehende Bon-Daten:", req.body);

    const { bonDetails } = req.body;  // Extrahiere bonDetails aus dem Request-Body

    // Sicherstellen, dass die Bon-Daten korrekt übermittelt wurden
    if (!bonDetails || !bonDetails.items || !bonDetails.totalAmount) {
        console.error("🚨 Fehlende oder ungültige Bon-Daten:", bonDetails);
        return res.status(400).send({ success: false, message: "Fehlende Daten" });
    }

    console.log("✅ Erhaltene totalAmount:", bonDetails.totalAmount);
    const totalAmount = parseFloat(bonDetails.totalAmount); // Umwandlung von '7.00' -> 7.00
    console.log("🎯 Nach Umwandlung totalAmount:", totalAmount);

    if (isNaN(totalAmount)) {
        console.error("❌ Ungültiger Wert für totalAmount:", bonDetails.totalAmount);
        return res.status(400).send({ success: false, message: "Ungültiger Gesamtbetrag" });
    }

    if (!Array.isArray(bonDetails.items) || bonDetails.items.length === 0) {
        console.error("⚠️ Fehlende oder ungültige Artikel:", bonDetails.items);
        return res.status(400).send({ success: false, message: "Fehlende oder ungültige Artikel" });
    }

    console.log("📦 Artikel zum Speichern:", JSON.stringify(bonDetails.items, null, 2));

    // Bon-Daten in der "bon"-Tabelle speichern
    const query = "INSERT INTO bon (totalAmount) VALUES (?)";

    db.query(query, [totalAmount], (err, result) => {
        if (err) {
            console.error("🔥 Fehler beim Speichern des Bons:", err);
            return res.status(500).send({ success: false, message: "Fehler beim Speichern des Bons" });
        }

        const receiptId = result.insertId;
        console.log("✅ Bon erfolgreich gespeichert, ID:", receiptId);

        // Artikel vorbereiten
        const items = bonDetails.items.map(item => [
            receiptId,
            item.name,
            item.price,
            item.quantity,
            item.total
        ]);

        console.log("📝 Items zum Speichern:", JSON.stringify(items, null, 2));

        const itemQuery = "INSERT INTO bon_items (bon_id, name, price, quantity, total) VALUES ?";

        db.query(itemQuery, [items], (err) => {
            if (err) {
                console.error("🔥 Fehler beim Speichern der Artikel:", err);
                return res.status(500).send({ success: false, message: "Fehler beim Speichern der Artikel" });
            }

            console.log("✅ Alle Artikel erfolgreich gespeichert!");
            res.send({ success: true, message: "Bon erfolgreich gespeichert" });
        });
    });
});


// API-Endpunkt, um Artikel abzurufen
app.get('/items', (req, res) => {
    const query = 'SELECT name, preis, kategorie FROM produkte'; // Abfrage der Produkte aus der Tabelle "produkte"
    db.query(query, (err, results) => {
        if (err) throw err;
        res.json(results); // Gibt die Produktauswahl als JSON zurück
    });
});

// Server starten
app.listen(3000, () => console.log("Server läuft auf http://localhost:3000"));

// SerialPort zum Drucken
const port = new SerialPort({
    path: 'COM4',
    baudRate: 9600
});

let isPortOpen = false;
port.on('open', () => {
    console.log('Port COM4 geöffnet');
    isPortOpen = true;
});
port.on('error', (err) => {
    console.error('Fehler:', err.message);
});

// Sleep-Funktion, um eine Verzögerung zu erzeugen (in Millisekunden)
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Sonderzeichen ersetzen
function replaceSpecialChars(text) {
    return text
        .replace(/€/g, "[EUR]")
        .replace(/ü/g, "ue")
        .replace(/Ü/g, "UE")
        .replace(/ö/g, "oe")
        .replace(/ä/g, "ae")
        .replace(/ß/g, "ss");
}

// Hilfsfunktion: Daten schreiben und auf drain warten
function writeData(data) {
    return new Promise((resolve, reject) => {
        port.write(data, (err) => {
            if (err) {
                return reject(err);
            }
            port.drain((err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    });
}

// Funktion zum Drucken und Schneiden des Kassenbons
async function printCashReceipt(bonDetails) {
    if (!isPortOpen) {
        console.error('Port ist nicht geöffnet!');
        return;
    }
    let receiptText = `
*** Kassenbon ***

Bon Nr. ${bonDetails.id}
${bonDetails.timestamp}

--------------------------
Artikel                Preis
--------------------------
${bonDetails.items.map((item, index) => {
        const priceMatch = item.match(/€(\d+\.\d+)/);
        const price = priceMatch ? priceMatch[1] : '0.00';
        let itemText = `${index + 1}. ${item.replace(/^\d+\.\s*/, '')}`;
        // Hier den Preis nur einmal anzeigen – falls nötig, kannst du den Preis-Teil anpassen
        return `${itemText}`;
    }).join('\n')}

--------------------------
Gesamt: €${bonDetails.total}
--------------------------

Der Foerderverein dankt dir fuer 
deinen Einkauf!Save the Date:
BVT 38 - 3.-5. Juli 2026!
\n
`;
    receiptText = replaceSpecialChars(receiptText);
    try {
        await writeData(receiptText);
        console.log("Kassenbon erfolgreich gesendet");
        await writeData(FEED);
        console.log("Papierzufuhr für Küchenbon durchgeführt");
        await writeData(CUT);
        console.log("Kassenbon abgeschnitten");
    } catch (err) {
        console.error("Fehler beim Kassenbon: " + err.message);
    }
}

// Funktion zum Drucken und Schneiden des Küchenbons
async function printKitchenReceipt(bonDetails, kitchenItems) {
    let kitchenReceipt = `
*** KÜCHE ***

Bon Nr. ${bonDetails.id}
${bonDetails.timestamp}

--------------------------
Artikel
--------------------------
${kitchenItems.map((item, index) => `${index + 1}. ${item}`).join('\n')}
--------------------------
\n\n
`;
    kitchenReceipt = replaceSpecialChars(kitchenReceipt);
    try {
        await writeData(kitchenReceipt);
        console.log("Küchenbon erfolgreich gesendet");
        // Papierzufuhr (Leerraum) hinzufügen
        await writeData(FEED);
        console.log("Papierzufuhr für Küchenbon durchgeführt");
        await writeData(CUT);
        console.log("Küchenbon abgeschnitten");
    } catch (err) {
        console.error("Fehler beim Küchenbon: " + err.message);
    }
}

// Funktion zum Drucken und Schneiden des Flammkuchenbons
async function printFlammkuchenReceipt(bonDetails) {
    if (!isPortOpen) {
        console.error('Port ist nicht geöffnet!');
        return;
    }

    // console.log("bonDetails.items (Original):", bonDetails.items);

    // Filtere die Items, die 'Flammkuchen' im Namen haben
    const flammkuchenItems = bonDetails.items.filter(item => item.includes('Flammkuchen'));

    // console.log("Flammkuchen-Artikel gefunden:", flammkuchenItems);

    if (flammkuchenItems.length === 0) {
        console.warn("Kein Flammkuchen in der Bestellung – Bon wird NICHT erstellt!");
    } else {
        console.log("Flammkuchen-Bon wird gedruckt...");
        // Hier dein Code zum Drucken des Flammkuchen-Bons
    }

    if (flammkuchenItems.length > 0) {
        let flammkuchenReceipt = `
*** FLAMMKUCHEN ***

Bon Nr. ${bonDetails.id}
${bonDetails.timestamp}

--------------------------
Flammkuchen
--------------------------
${flammkuchenItems.map((item, index) => `${index + 1}. ${item}`).join('\n')}

--------------------------
\n\n\n\n
`;
        flammkuchenReceipt = replaceSpecialChars(flammkuchenReceipt);
        try {
            await writeData(flammkuchenReceipt);
            console.log("Flammkuchenbon erfolgreich gesendet");
            // Papierzufuhr (Leerraum) hinzufügen
            await writeData(FEED);
            console.log("Papierzufuhr für Flammkuchenbon durchgeführt");
            await writeData(CUT);
            console.log("Flammkuchenbon abgeschnitten");
        } catch (err) {
            console.error("Fehler beim Flammkuchenbon: " + err.message);
        }
    }
}

// Funktion zum Drucken aller Bons
async function printReceipt(bonDetails) {
    if (!isPortOpen) {
        console.error('Port ist nicht geöffnet!');
        return;
    }
    const flammkuchenItems = bonDetails.items.filter(item => item.includes('Flammkuchen'));
    const kitchenItems = bonDetails.items.filter(item => !item.includes('Flammkuchen'));

    // Bon für die Kasse drucken
    await printCashReceipt(bonDetails);

    // Drucke die Küche, falls es solche Artikel gibt
    if (kitchenItems.length > 0) {
        await printKitchenReceipt(bonDetails, kitchenItems);
    }

    // Drucke den Flammkuchen-Bon
    if (flammkuchenItems.length > 0) {
        await printFlammkuchenReceipt(bonDetails, flammkuchenItems);
    }
}

// ➤ API-Route zum Drucken aus dem Client (script.js)
// POST-Route für Druckanforderung
app.post('/print', (req, res) => {
    const { bonDetails } = req.body;
    if (!bonDetails) {
        return res.status(400).json({ error: "Bon Details fehlen" });
    }
    // console.log("Druckauftrag erhalten:", bonDetails);
    printReceipt(bonDetails);
    return res.status(200).json({ success: true });
});




// 🔹 Route zur Abrufung von Verkaufsstatistiken mit optionalem Zeitfilter
app.get("/statistics", (req, res) => {
    const { date, startTime, endTime } = req.query;

    let whereClause = "";
    let params = [];

    if (date) {
        whereClause += "WHERE DATE(b.created_at) = ?";
        params.push(date);
    }

    if (startTime && endTime) {
        whereClause += whereClause ? " AND " : "WHERE ";
        whereClause += "TIME(b.created_at) BETWEEN ? AND ?";
        params.push(startTime, endTime);
    }

    const statsQuery = `
        SELECT
            DATE(b.created_at) AS date,
            COUNT(b.id) AS total_bons,
            SUM(b.totalAmount) AS total_revenue,
            (SUM(b.totalAmount) / COUNT(b.id)) AS avg_bon_value
        FROM bon b
            ${whereClause}
        GROUP BY DATE(b.created_at)
        ORDER BY DATE(b.created_at) DESC;
    `;

    db.query(statsQuery, params, (err, bonStats) => {
        if (err) {
            console.error("Fehler beim Abrufen der Statistik:", err);
            return res.status(500).json({ error: "Fehler beim Abrufen der Statistik" });
        }

        const productStatsQuery = `
            SELECT
                bi.name AS product_name,
                SUM(bi.quantity) AS total_sold,
                SUM(bi.total) AS total_revenue
            FROM bon_items bi
                     JOIN bon b ON bi.bon_id = b.id
                ${whereClause}
            GROUP BY bi.name
            ORDER BY total_sold DESC
                LIMIT 20;
        `;

        db.query(productStatsQuery, params, (err, productStats) => {
            if (err) {
                console.error("Fehler beim Abrufen der Produktstatistik:", err);
                return res.status(500).json({ error: "Fehler beim Abrufen der Produktstatistik" });
            }

            const intervalStatsQuery = `
                SELECT
                    CONCAT(HOUR(b.created_at), ':', LPAD(FLOOR(MINUTE(b.created_at) / 15) * 15, 2, '0')) AS \`interval\`,
                    bi.name AS product_name,
                    SUM(bi.quantity) AS total_sold
                FROM bon b
                         JOIN bon_items bi ON b.id = bi.bon_id
                    ${whereClause}
                GROUP BY \`interval\`, bi.name
                ORDER BY \`interval\`, bi.name;
            `;

            db.query(intervalStatsQuery, params, (err, intervalStats) => {
                if (err) {
                    console.error("Fehler beim Abrufen der Intervallstatistik:", err);
                    return res.status(500).json({ error: "Fehler beim Abrufen der Intervallstatistik" });
                }

                res.json({ bonStats, productStats, intervalStats });
            });
        });
    });
});

app.listen(3001, () => console.log("Statistik-Server läuft auf http://localhost:3001"));