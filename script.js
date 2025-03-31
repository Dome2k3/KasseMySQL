let total = 0;
let itemCount = 1;
let receiptCount = 1; // Eindeutige Bon-Nummer
let history = []; // Speichert alle Bons
let receipts = {}; // Startet leer, wird mit jedem Artikel befüllt
let bonDetails = { items: [] }; // Standardwert als leeres Array

// Artikel laden und Preis loggen
fetch('http://localhost:3000/items')
    .then(response => response.json())
    .then(data => {
        items = data;
        console.log('Artikel geladen:', items);
        displayItems();  // Artikel als Buttons darstellen
    })
    .catch(error => {
        console.error('Fehler beim Abrufen der Artikel:', error);
    });

// Funktion zum Anzeigen der Artikel als Buttons
function displayItems() {
    const artikelButtonsDiv = document.getElementById('artikel-buttons');
    artikelButtonsDiv.innerHTML = ''; // Leeren des Bereichs

    if (!Array.isArray(items) || items.length === 0) {
        console.warn("Keine Artikel vorhanden oder 'items' ist nicht definiert.");
        return;
    }

    const categories = [...new Set(items.map(item => item.kategorie))];

    categories.forEach(category => {
        const categoryContainer = document.createElement("div");
        categoryContainer.classList.add("button-group");

        const categoryTitle = document.createElement("h3");
        categoryTitle.textContent = category;
        artikelButtonsDiv.appendChild(categoryTitle);
        artikelButtonsDiv.appendChild(categoryContainer);

        items
            .filter(item => item.kategorie === category)
            .forEach(item => {
                let price = item.preis;  // Preis als String aus der API übernehmen
                console.log("Geladener Preis als String:", price);  // Überprüfen, was in der API zurückkommt

                price = parseFloat(price);  // Preis in eine Zahl umwandeln
                if (!item.name || isNaN(price)) {
                    console.warn("Fehlendes oder ungültiges Artikelobjekt:", item);
                    return;
                }

                const button = document.createElement('button');
                button.textContent = `${item.name} - ${price.toFixed(2)} €`;
                button.onclick = () => addItem(item.name, price);

                categoryContainer.appendChild(button);
            });
    });
}

// Funktion für das Hinzufügen eines Artikels
function addItem(itemName, itemPrice) {
    const receiptId = Date.now(); // Verwende die aktuelle Zeit als eindeutige ID
    const receipt = receipts[receiptId] || { items: [], total: 0 };  // Hole den aktuellen Bon oder erstelle einen neuen

    // Artikel zum Bon hinzufügen
    receipt.items.push({
        name: itemName,
        quantity: 1, // Annahme: immer 1, kannst das nach Bedarf ändern
        price: itemPrice
    });

    // Gesamtpreis des Bons aktualisieren
    receipt.total += itemPrice;

    // Speichere den aktualisierten Bon in `receipts`
    receipts[receiptId] = receipt;

    // Anzeige des hinzugefügten Artikels und des Gesamtbetrags aktualisieren
    const receiptList = document.getElementById('receipt-list');
    const newItem = document.createElement('li');
    newItem.textContent = `${itemCount}. ${itemName} - €${itemPrice.toFixed(2)}`;
    receiptList.appendChild(newItem);

    total += itemPrice;
    document.getElementById('total').textContent = `Summe: ${total.toFixed(2)} €`;

    itemCount; // Artikelzähler erhöhen
}

function removePfandItems() {
    const receiptList = document.getElementById('receipt-list');
    const totalElement = document.getElementById('total');

    let newTotal = 0;

    // Alle Listenelemente abrufen
    const items = Array.from(receiptList.children);

    // Liste filtern, ohne "Pfand"
    receiptList.innerHTML = ''; // Liste leeren

    items.forEach(item => {
        if (!item.textContent.includes('Pfand')) {
            const parts = item.textContent.split('. '); // Trenne alte Nummerierung
            if (parts.length > 1) {
                item.textContent = `1. ${parts[1]}`; // Immer mit "1." beginnen
            }
            receiptList.appendChild(item);

            // Preis extrahieren und aufsummieren
            const priceMatch = item.textContent.match(/€(\d+\.\d+)/);
            if (priceMatch) {
                newTotal += parseFloat(priceMatch[1]);
            }
        }
    });

    // Gesamtbetrag aktualisieren
    total = newTotal;
    if (totalElement) {
        totalElement.textContent = `Summe: ${total.toFixed(2)} €`;
    }
}

function resetReceipt() {
    const receiptList = document.getElementById('receipt-list');
    const totalElement = document.getElementById('total'); // Überprüfen, ob das Element existiert

    // Inhalt des aktuellen Bons löschen
    receiptList.innerHTML = '';

    // Setze den Gesamtbetrag zurück
    total = 0;
    if (totalElement) {
        totalElement.textContent = `Summe: ${total.toFixed(2)} €`; // Aktualisiert die Anzeige, wenn das Element existiert
    }

    // Artikelnummer zurücksetzen
    itemCount = 1; // Stellt sicher, dass der Zähler korrekt zurückgesetzt wird
}

function finalizeBon() {
    const receiptList = document.querySelector('#receipt-list');
    const receiptItems = Array.from(receiptList.children).map(item => item.textContent);
    const timestamp = new Date().toLocaleString();

    if (receiptItems.length > 0) {
        const bonDetails = {
            id: receiptCount,
            timestamp: timestamp,
            items: receiptItems,
            total: parseFloat(total).toFixed(2) // Gesamtbetrag als Zahl mit 2 Dezimalstellen
        };

        // Formatierte Items erstellen
        const formattedItems = formatItems(bonDetails.items);

        // Berechne totalAmount und prüfe auf NaN
        let totalAmount = formattedItems.reduce((sum, item) => sum + item.total, 0);
        totalAmount = parseFloat(totalAmount).toFixed(2); // Sicherstellen, dass es eine Zahl ist
        console.log("Berechneter totalAmount in finalizeBon:", totalAmount); // Zeigt den berechneten Gesamtbetrag

        // Überprüfen, ob totalAmount eine gültige Zahl ist
        if (isNaN(totalAmount) || totalAmount === 'NaN') {
            console.error("Ungültiger Gesamtbetrag:", totalAmount);
            return;
        }

        // Daten an MySQL senden
        sendReceiptsToServer({ totalAmount: totalAmount, items: formattedItems });

        // Bon drucken
        sendPrintRequest(bonDetails);

        // Nächste Bon-ID
        receiptCount++;

        // Bon zurücksetzen
        resetReceipt();
    }
}

function updateHistory() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = ''; // Liste zurücksetzen

    if (history.length === 0) {
        historyList.innerHTML = '<p>Keine Bons vorhanden.</p>';
        return;
    }

    // History nach Bon-Nummer (id) absteigend sortieren
    const sortedHistory = history.slice().sort((a, b) => b.id - a.id);

    // Neueste Bestellung holen (erste nach Sortierung)
    const latestReceipt = sortedHistory[0];

    const latestOrderDiv = document.createElement('div');
    latestOrderDiv.classList.add('history-item', 'latest-order');

    latestOrderDiv.innerHTML = `
        <h3>Letzte Bestellung (Bon Nr. ${latestReceipt.id})</h3>
        <table>
            <thead>
                <tr>
                    <th>Datum</th>
                    <th>Artikel</th>
                    <th>Summe</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${latestReceipt.timestamp}</td>
                    <td>
                        <ul>
                            ${latestReceipt.items.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </td>
                    <td>€${latestReceipt.total}</td>
                </tr>
            </tbody>
        </table>
    `;

    historyList.appendChild(latestOrderDiv);

    // Prüfen, ob es ältere Bestellungen gibt
    if (sortedHistory.length > 1) {
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'Ältere Bons anzeigen';
        toggleButton.classList.add('toggle-history');

        const collapsedOrdersDiv = document.createElement('div');
        collapsedOrdersDiv.id = 'collapsed-orders';
        collapsedOrdersDiv.style.display = 'none';

        // Ältere Bestellungen (alle außer die neueste)
        for (let i = 1; i < sortedHistory.length; i++) {
            const receipt = sortedHistory[i];

            const historyItem = document.createElement('div');
            historyItem.classList.add('history-item');

            historyItem.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h4>Bon Nr. ${receipt.id}</h4>
                    <button class="toggle-details">Details anzeigen</button>
                </div>
            `;

            // Details-Container
            const details = document.createElement('div');
            details.classList.add('details');
            details.style.display = 'none';

            const table = document.createElement('table');
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Datum</th>
                        <th>Artikel</th>
                        <th>Summe</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${receipt.timestamp}</td>
                        <td>
                            <ul>
                                ${receipt.items.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        </td>
                        <td>€${receipt.total}</td>
                    </tr>
                </tbody>
            `;
            details.appendChild(table);

            // Event-Listener für den Button
            const toggleDetailsButton = historyItem.querySelector('.toggle-details');
            toggleDetailsButton.onclick = () => {
                const isHidden = details.style.display === 'none';
                details.style.display = isHidden ? 'block' : 'none';
                toggleDetailsButton.textContent = isHidden ? 'Details verbergen' : 'Details anzeigen';
            };

            historyItem.appendChild(details);
            collapsedOrdersDiv.appendChild(historyItem);
        }

        // Button zum Ein-/Ausklappen der alten Bons
        toggleButton.onclick = () => {
            const isHidden = collapsedOrdersDiv.style.display === 'none';
            collapsedOrdersDiv.style.display = isHidden ? 'block' : 'none';
            toggleButton.textContent = isHidden ? 'Ältere Bons ausblenden' : 'Ältere Bons anzeigen';
        };

        historyList.appendChild(toggleButton);
        historyList.appendChild(collapsedOrdersDiv);
    }
}

function sendPrintRequest(bonDetails) {
    // Prüfen, ob der Benutzer die PDF-Erstellung aktiviert hat
    const isPdfEnabled = document.getElementById('generate-pdf').checked;
    if (!isPdfEnabled) {
        console.log("PDF-Erstellung ist deaktiviert.");
        return;  // Stoppt die Funktion, wenn die Checkbox nicht aktiviert ist
    }
    console.log("Bon Details zum Drucken:", bonDetails);  // Logge die Bon-Daten zur Überprüfung
    fetch('http://localhost:3000/print', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            bonDetails: bonDetails, // Hier übergibst du bonDetails im Request
        }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log("Druckauftrag erfolgreich gesendet");
            } else {
                console.error("Fehler beim Senden des Druckauftrags:", data.error);
            }
        })
        .catch(error => {
            console.error("Fehler beim Senden des Druckauftrags:", error);
        });
}

function formatItems(receiptItems) {
    console.log("Formatiere Artikel:", receiptItems); // Logge die Eingabedaten
    return receiptItems.map(item => {
        // Finde das letzte Vorkommen des Trennzeichens '-'
        const lastIndex = item.lastIndexOf(' - ');
        if (lastIndex === -1) {
            console.error("Ungültiges Format für Artikel:", item);
            return null; // Falls kein '-' gefunden wird, überspringen
        }

        // Teile Name und Preis basierend auf dem letzten Vorkommen von '-'
        const productName = item.slice(0, lastIndex).trim();
        const price = item.slice(lastIndex + 3).trim(); // 3 für die Länge von ' - '

        // Konvertiere den Preis in eine Zahl und prüfe, ob es gültig ist
        const total = parseFloat(price.replace('€', '').trim());
        if (isNaN(total)) {
            console.error("Ungültiger Preis für Artikel:", item);
            return null; // Falls der Preis ungültig ist, überspringe diesen Artikel
        }

        // Da der Artikelname möglicherweise mehr als ein Wort enthält, verwenden wir nur den letzten Teil
        return {
            name: productName,
            quantity: 1,  // Bei Bedarf anpassen, falls Quantität auch immer in den Daten vorhanden ist
            price: total,
            total: total
        };
    }).filter(item => item !== null); // Filtert ungültige Artikel heraus
}

// Beispiel: Formatierung der `items`
const formattedItems = formatItems(bonDetails.items);

// Nun sendest du diese formatierten Items an den Server
const bonData = {
    totalAmount: parseFloat(bonDetails.total).toFixed(2),
    items: formattedItems
};

// Funktion zum Senden der Daten an den Server
function sendReceiptsToServer(bonDetails) {
    console.log("Bon Details zum Drucken:", bonDetails);  // Logge die Bon-Daten zur Überprüfung

    if (bonDetails && Array.isArray(bonDetails.items) && bonDetails.items.length > 0) {
        fetch('http://localhost:3000/finalize-bon', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bonDetails }),  // Direkt die Bon-Details übergeben
        })
            .then(response => response.json())
            .then(data => {
                console.log("Daten erfolgreich gespeichert:", data);
            })
            .catch(error => {
                console.error("Fehler beim Speichern des Bons:", error);
            });
    } else {
        console.error('Bon-Daten sind leer oder ungültig.');
    }
}

function resetStatistics() {
    console.log('Reset wurde aufgerufen');
    const salesData = localStorage.getItem('salesData');
    console.log('Aktuelle salesData:', salesData);

    if (salesData) {
        if (confirm('Möchten Sie die Statistik wirklich zurücksetzen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
            localStorage.removeItem('salesData');
            localStorage.setItem('receiptCount', '1'); // Setzt den Bon-Zähler zurück
            alert('Statistik wurde erfolgreich zurückgesetzt.');

            // Anzeige zurücksetzen
            const statsOutput = document.getElementById('statistic-output');
            if (statsOutput) {
                statsOutput.innerHTML = '<p>Keine Verkaufsdaten vorhanden.</p>';
            }
        }
    } else {
        alert('Es gibt keine Statistikdaten, die zurückgesetzt werden können.');
    }
}