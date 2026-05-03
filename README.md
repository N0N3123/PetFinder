# PetFinder 🐾

Aplikacja mobilna webowa służąca do zgłaszania zaginionych zwierząt oraz publikowania ogłoszeń adopcyjnych. Projekt zrealizowany w ramach przedmiotu PSM.

## 📌 Realizacja wymagań projektowych

Projekt został wykonany zgodnie z wytycznymi i spełnia następujące kryteria:

* **Zespół projektowy:** Projekt zrealizowany przez 2-osobowy zespół, w którym wybrano kierownika.
* **Technologia PWA:** Aplikacja umożliwia instalację oraz odinstalowanie z urządzenia mobilnego i desktopowego.
* **Mobile First:** Interfejs zapewnia prawidłową prezentację treści na urządzeniach mobilnych dzięki wykorzystaniu frameworka Bootstrap.
* **Aplikacja SPA:** Aplikacja typu Single Page Application utworzona przy użyciu frameworka Vue.js.
* **Architektura dwuwarstwowa:** System został zaprojektowany z wyraźnym podziałem na warstwę frontendu (Vue) i warstwę danych (Firebase).
* **Uwierzytelnianie:** Zaimplementowano logowanie użytkowników przy użyciu loginu i hasła oraz kont z portali społecznościowych (Google) za pomocą usługi Firebase Authentication.
* **Baza danych NoSQL:** Dane przechowywane są w usłudze Cloud Firestore. Baza zawiera co najmniej 3 kolekcje dokumentów (m.in. `users`, `announcements`, `chats`, `messages`) obsługujące różne typy danych.
* **Funkcje natywne urządzenia (min. 3):** Wykorzystano następujące fizyczne funkcje powiązane z tematem aplikacji:
  1. **Odbiornik GPS:** Pobieranie aktualnych współrzędnych i tłumaczenie ich na adres przy dodawaniu ogłoszenia.
  2. **Kamera:** Obsługa aparatów systemowych przy robieniu zdjęć zwierzakom do ogłoszeń i czatu.
  3. **Wibracja:** Powiadomienie haptyczne (wibracja) po pomyślnym opublikowaniu nowego ogłoszenia oraz zapisaniu zmian profilu.
* **Dodatkowa usługa Firebase:** Oprócz Auth i Firestore, wykorzystano usługę Firebase Storage do bezpiecznego przechowywania plików graficznych.

## 🚀 Technologie

* **Frontend:** Vue 3, Vue Router, Vite
* **Styling:** Bootstrap 5
* **Backend / BaaS:** Firebase (Authentication, Cloud Firestore, Storage)
* **Mapy / Geokodowanie:** OpenStreetMap API

## 🌐 Linki projektu

Poniżej znajdują się wszystkie wymagane odnośniki:
* **Hostowana aplikacja (Live):** [Github Pages](https://n0n3123.github.io/PetFinder/#/)
* **Repozytorium GitHub:** [Repozytorium kodu](https://github.com/N0N3123/PetFinder)
* **Prototyp interaktywny:** [Figma](https://www.figma.com/proto/ha9ZhAhaTQwbPus5s1UFVl/PetFinder-prototype?node-id=1-5&p=f&t=omZ9aP3rzDIVb6jI-0&scaling=scale-down&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=1%3A5)
---
**Zespół projektowy:**
* **Bartosz Banach** - Kierownik projektu
* **Szymon Cebula**