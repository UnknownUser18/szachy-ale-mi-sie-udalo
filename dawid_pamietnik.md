# Proces pracy nad projektem "Szachy"

Pracę nad projektem zacząłem od analizy technologii. Zależało mi na dogłębnym poznaniu frameworka użytego w aplikacji  - Angulara. Po zapoznaniu się z wbudowanymi funkcjami, które mogłyby mi pomóc w realizacji zadania, przystąpiłem do implementacji powierzonych mi zadań: utworzenia algorytmu notacji szachowej 
oraz zegara.

## Utworzenie notacji szachowej
Implementację notacji  zacząłem od dokładnego zapoznania się z profesjonalną szachową notacją algebraiczną. Notacja często stosowana w grach towarzyskich nie zawsze jest zgodna z przyjętym wzorem. Po ustaleniu zasad notacji przystąpiłem do implementacji jej funkcjonalności. Aby rejestrować każdy ruch gracza, w pliku **notation.component.ts** skonstruowałem metodę **addMove**, która przy pomocy innych metod sprawdzała podane parametry:
- miejsce, z którego rozpoczynał pionek,
- miejsce, na które przeskoczył pionek,
- typ pionka,
- czy nastąpiło bicie pionka,
- czy był to ruch specjalny (roszada, en passant itp.)
- stan gry (szach, mat)

### Usuwanie błędów
W procesie implementacji notacji algebraicznej nastąpiły jednak błędy. Największym problemem było notoryczne wykrywanie przesunięć pionka jako bicie. Problem ten wystąpił, ponieważ metoda **addMove** pobierała dane o "polu końcowym" po wykonaniu ruchu, przez co zawsze wykrywała przesunięty wcześniej pionek. Aby zlikwidować błąd, utworzyłem pomocniczą metodę **isCapture** sprawdzającą, czy przed wykonanym ruchem na danym polu znajdował się jakikolwiek pionek

### Dodanie rozszerzonej notacji
Aby polepszyć komfort użytkowania aplikacji dodałem możliwość wyboru rodzaju notacji. Zmodyfikowałem komponent  i dodałem menu umożliwiające użytkownikowi wybór pomiędzy:
 - **notacją krótką**  - pokazującą pole końcowe (np. Ng1-f3)  
 - **notacją rozszerzoną**  - pokazującą pole początkowe i końcowe (np. Nf3)  

## Stworzenie zegara szachowego
Stworzenie zegara szachowego odbyło się analogicznie do stworzenia notacji. Utworzyłem serwis **timerService** odpowiedzialny za logikę zegara. Umieściłem w nim następujące metody:
- **resetTimers()** - metoda wywoływana na początek rozgrywki, odpowiedzialna za ustawianie właściwego czasu
- **setTime()** - metoda, która pobiera dane o czasie przeznaczonym na rozgrywkę 
- **startTimer()** - metoda odpowiedzialna za odliczanie czasu poszczególnym graczom
- **switchTimer()** - metoda odpowiedzialna za aktualizację zegarów po zakończonym ruchu

