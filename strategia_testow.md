# Strategia Testów - Gra w Szachy

## 1. Wprowadzenie
Celem tego dokumentu jest przedstawienie strategii testowania aplikacji szachowej. Testy mają na celu zapewnienie poprawności działania gry, jej logiki oraz interakcji użytkownika z systemem.

## 2. Zakres testów
Testy obejmują:
- Testy jednostkowe
- Testy integracyjne
- Testy systemowe
- Testy funkcjonalne

Pominięto testy bezpieczeństwa, kompatybilności, różnych rozdzielczości oraz zapisywania i wczytywania stanu gry.

---

## 3. Testy jednostkowe
Testują pojedyncze komponenty aplikacji.

### 3.1 Ruchy figur
- Sprawdzenie poprawności ruchów dla każdej figury zgodnie z zasadami szachów.
- Testy dla pionka, skoczka, gońca, wieży, hetmana i króla.

### 3.2 Ruchy specjalne
- Weryfikacja poprawności roszady.
- Obsługa bicia w przelocie.
- Promocja pionka.

### 3.3 Wykrywanie sytuacji szachowych
- Identyfikacja szacha, mata i pata.
- Sprawdzenie poprawności wykrywania remisu.

### 3.4 Silnik AI
- Testowanie poprawności działania algorytmów Minimax oraz Monte Carlo.
- Ocena wyboru ruchów przez AI na różnych poziomach trudności.

### 3.5 Obsługa historii ruchów
- Sprawdzenie poprawności zapisu partii w notacji algebraicznej.

---

## 4. Testy integracyjne
Sprawdzają poprawność współpracy różnych modułów aplikacji.

### 4.1 Integracja UI z logiką gry
- Czy interfejs poprawnie odzwierciedla stan gry?
- Czy ruchy wykonywane przez graczy są poprawnie rejestrowane?

### 4.2 Interakcja AI z interfejsem
- Czy AI wykonuje ruchy zgodnie z wybranym poziomem trudności?
- Czy UI prawidłowo odzwierciedla ruchy komputera?

### 4.3 Obsługa błędnych wejść użytkownika
- Próba wykonania niedozwolonego ruchu.
- Klikanie poza planszą.
- Sprawdzanie poprawności obsługi nieprawidłowych akcji.

---

## 5. Testy systemowe
Testują działanie aplikacji jako całości na docelowej platformie.

### 5.1 Testy wydajnościowe
- Czas odpowiedzi interfejsu na ruchy gracza.
- Analiza czasu wykonania ruchu przez AI w zależności od poziomu trudności.
- Zużycie zasobów systemowych.

### 5.2 Testy interfejsu użytkownika
- Czytelność szachownicy.
- Oznaczanie dostępnych ruchów.
- Poprawność komunikatów o stanie gry.

---

## 6. Testy funkcjonalne
Sprawdzają zgodność działania gry z wymaganiami projektu.

### 6.1 Tryb Gracz kontra Gracz
- Czy można poprawnie grać na jednym komputerze?
- Poprawność naprzemiennego wykonywania ruchów.
- Działanie zegara szachowego.

### 6.2 Tryb Gracz kontra Komputer
- Czy AI działa poprawnie w różnych konfiguracjach?
- Czy użytkownik może wybrać algorytm (Minimax, Monte Carlo)?
- Czy można zmieniać poziom trudności?

### 6.3 Tryb Gracz kontra Arcymistrz
- Czy program poprawnie importuje i analizuje pliki PGN?
- Czy AI znajduje pasujące partie i wykonuje ruchy zgodnie z nimi?

### 6.4 Tryb Gracz kontra Gracz w sieci
- Czy można nawiązać połączenie sieciowe?
- Czy ruchy są poprawnie przesyłane między graczami?
- Sprawdzenie działania mechanizmu cofania ruchów.

---

## 7. Podsumowanie
Strategia testów obejmuje różne aspekty działania aplikacji, koncentrując się na poprawności logiki szachowej, interakcji użytkownika oraz działania AI. Testy zostaną przeprowadzone zarówno automatycznie (dla logiki gry), jak i manualnie (dla UI i interakcji użytkownika).
