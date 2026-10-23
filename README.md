# BauCheck – Demo

Demo-Web-App zur fotobasierten Baufortschrittskontrolle für Schweizer Banken.
**Alle Daten sind synthetisch. Entscheide sind Demo-Vermerke ohne Rechtswirkung. Es gibt keine Kreditauszahlungen.**

## Starten

Voraussetzung: Node.js ≥ 18 (keine Abhängigkeiten, kein Build-Schritt).

```bash
npm start          # oder: node server.js
```

Danach im Browser öffnen: <http://localhost:5173>
Alternativ funktioniert auch das direkte Öffnen von `index.html` im Browser.

## Rollen

| Rolle | Einstieg | Funktionen |
| --- | --- | --- |
| Bankmitarbeiter/in | `#/bank` | Übersicht mit KPIs und Prüf-Inbox, Projektliste, Bauetappen-Timeline, eingereichte Fotos mit Metadaten und automatischen Hinweisen. Entscheide: *Nachweise ausreichend*, *Weitere Fotos anfordern* (erstellt einen neuen Link), *Vor-Ort-Besuch empfehlen*. Zeitlich begrenzte Demo-Links erstellen, kopieren und widerrufen. |
| Bauherrschaft | `#/b/<token>` | Mobile Kundenseite: Einladung und Übersicht, geführte Fotoaufnahme pro Perspektive (Kamera, Galerie oder synthetisches Demofoto), Prüfen & Einreichen, Einreichungsbestätigung. Abgelaufene oder widerrufene Links werden abgewiesen. |

Auf der Startseite (`#/`) wählen Sie die Rolle aus und sehen alle aktiven Demo-Links.

## Demo-Szenarien (Seed-Daten)

- **EFH Sonnenhalde**: Rohbau eingereicht, Prüfung offen
- **MFH Seeblick**: Dach mit Nachreichung, aktiver Link für zusätzliche Fotos
- **Umbau Bauernhaus Linde**: Vor-Ort-Besuch empfohlen, abgelaufener Link
- **Anbau Atelier Rebberg**: Nachweis angefordert, aktiver Link (Standard-Einstieg für die Bauherrschaft)

Mit «Demo zurücksetzen» werden die Beispieldaten neu geladen.

## Technik und Grenzen

- Reines HTML/CSS/JavaScript ohne Framework; Routing über URL-Hash.
- Persistenz in `localStorage` des Browsers. Ohne Backend funktionieren Demo-Links nur **im selben Browser**. Änderungen werden zwischen Tabs synchronisiert.
- Fotos werden im Browser verkleinert (max. 1280 px, JPEG) und lokal gespeichert. Es erfolgt keine Übertragung an einen Server.
- Beispielbilder sind generierte SVG-Illustrationen und als «Synthetisches Demobild» gekennzeichnet.
- Die automatischen Hinweise (Vollständigkeit, Aufnahmezeit, Auflösung, Bautafel) sind einfache Plausibilitätsprüfungen und ersetzen keine fachliche Beurteilung.

## Struktur

```
index.html            Einstieg, Demo-Banner
css/styles.css        Designsystem
js/ui.js              Formatierung, Icons, Modal, Lightbox, Bildverarbeitung
js/scenes.js          Generator für synthetische Baustellenbilder
js/data.js            Datenmodell, Seed-Daten, Store (localStorage)
js/views-common.js    Startseite, gemeinsame Bausteine
js/views-bank.js      Bankansicht
js/views-builder.js   Kundenseite (Bauherrschaft)
js/app.js             Router
server.js             Minimaler statischer Server
```
