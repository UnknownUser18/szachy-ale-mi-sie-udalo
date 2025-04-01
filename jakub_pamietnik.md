## Proces pracy nad projektem "Szachy"
Moim zadaniem w projekcie było stworzenie algorytmu AI, ewaluacji pozycji, grafiki do bierek, jednego z motywów oraz wizualizera dźwięku. Dodatkowo musiałem nauczyć się Angulara, aby móc efektywnie pracować nad projektem.

## Nauka Angulara
Na początku musiałem zapoznać się z frameworkiem Angular, który był używany w projekcie. Przeanalizowałem dokumentację oraz dostępne tutoriale, aby zrozumieć podstawowe funkcje i możliwości Angulara. Po zdobyciu podstawowej wiedzy przystąpiłem do implementacji powierzonych mi zadań.

## Implementacja algorytmu AI

Jednym z kluczowych zadań było stworzenie algorytmu AI, który mógłby rywalizować z graczami na różnych poziomach zaawansowania. W tym celu zaimplementowałem algorytm minimax z optymalizacją alfa-beta, który pozwala na efektywne przeszukiwanie drzewa ruchów i wybór najlepszego możliwego ruchu dla AI.

### Znajdowanie najlepszego ruchu

Metoda **findBestMove** jest odpowiedzialna za znalezienie najlepszego ruchu dla gracza AI. Wykorzystuje ona algorytm minimax, aby ocenić wszystkie możliwe ruchy i wybrać ten, który maksymalizuje szanse na wygraną.

### Ocena pozycji

Aby algorytm mógł podejmować decyzje, konieczne było zaimplementowanie funkcji oceniającej pozycję na planszy. Metoda **evaluatePosition** uwzględnia różne czynniki, takie jak wartość materiału, kontrola centrum, bezpieczeństwo króla i mobilność bierek.

### Optymalizacja alfa-beta

Algorytm minimax został zoptymalizowany za pomocą techniki alfa-beta, co pozwala na znaczne ograniczenie liczby przeszukiwanych gałęzi drzewa ruchów. Metoda **minimax** rekurencyjnie przeszukuje drzewo ruchów, oceniając każdą pozycję i wybierając najlepszy możliwy ruch.

## Grafika do bierek
Kolejnym zadaniem było stworzenie grafiki do bierek. Zdecydowałem się na minimalistyczny styl, który jest czytelny i estetyczny. Użyłem narzędzi graficznych do stworzenia ikon dla każdej z bierek, dbając o spójność i przejrzystość.


## Motyw graficzny
Oprócz grafiki do bierek miałem za zadanie stworzyć jeden z motywów graficznych dla interfejsu gry. Wybrałem motyw Catppuccin Mocha, z eleganckimi kolorami i prostym układem. Motyw ten miał na celu zapewnienie przyjemnego doświadczenia użytkownika podczas gry.


## Wizualizer dźwięku
Ostatnim zadaniem było stworzenie wizualizera dźwięku, który reaguje na dźwięki generowane podczas gry. Użyłem biblioteki Web Audio API do analizy dźwięków i generowania wizualizacji w czasie rzeczywistym. Wizualizer ten dodaje dodatkowy element interaktywności i estetyki do gry.

## Podsumowanie

Praca nad projektem "Szachy" była dla mnie dużym wyzwaniem, ale również cennym doświadczeniem. Nauczyłem się Angulara, stworzyłem zaawansowany algorytm AI, funkcję ewaluacji pozycji, grafikę do bierek, motyw graficzny oraz wizualizer dźwięku. Dzięki temu projektowi zdobyłem nowe umiejętności i poszerzyłem swoją wiedzę w zakresie programowania i grafiki komputerowej.
