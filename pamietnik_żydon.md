# Mój wkład w projekt "Szachy"
Muszę przyznać ciekawie pracowało się nad tym projektem. Poza jednym (ciągle trwającym) projektem to nie brałem udziału w wielu grupowych projektach, a szczególnie w takich, gdzie główną techonologią był Angular.

## Od strony lidera
### Mówiąc szczerze, byłem zaskoczony. <br>
Braliśmy udział w "Motoroli" w tamtym roku, w trochę innym składzie, ale to nie ma znaczenia <br>
Rok temu większość pracy ~95% wykonałem ja, gdyż reszta zespołu nie miała motywacji, ani zdolności matematycznych, a robiliśmy projekt związany z optyką - tam było tego sporo. W tym zaś roku zdziwiłem się.
Wszyscy pracowali, niektórzy trochę lepiej, niektórzy trochę gorzej ~~JW~~, ale każdy przynajmniej próbował.
Mogę to powiedzieć z szczególną szczerością, jeśli weźmiemy pod uwagę, że na cały projekt mieliśmy **23 dni**, a większość zespołu nie znała Angulara (jak to również wspominał olo).

### Dlaczego Angular
Pomimo tego, że ponad połowa zespołu nie znała wybranej technologii, wybraliśmy ją. <br>
Po rozmowach naszego całego zespołu, doszliśmy do wniosku, że musimy wybrać jakiś framework, bo nie będziemy pracowali w zwykłym vanillaJS.
Nasz wybór padł na **Angulara**, tylko i wyłącznie, dlatego że przynajmniej olo i **żydon** znali go, a od razu odrzuciliśmy inne ~~ŚMIECIOWE~~ frameworki jak np. **react**.

## Co dokładnie ~~żydon~~ ja zrobiłem

### Jaką miałem rolę przy planowaniu
Od początku wiedziałem, że będę robił całą oprawę sieciową. Wybory mieliśmy dwa ja i Olek, bo tylko my pracowaliśmy w takich projektach nad backendem. Jednak Olek robił już interfejs, więc wybór padł na mnie. Pliki związane z siecią i obsługą sieci:

```plaintext
szachy
| ... - app
|     | - game-end-dialog
|     | - game-invite-dialog
|     | - local-game
|     | - local-connection.service

backend
|     | - controller.js
|     | - index.js
```

#### Dodatkowo musiałem stanąć za całą logiką szachów
Chciałem mieć pewność, że logika szachów, będzie kompletna, ale nikt inny nie chciał być za to odpowiedzialny (bo wiadomo, jak coś ktoś by zepsuł, to cały projekt upada), więc ja musiałem to zrobić. Poza tym również pomagałem, w dużej ilości komponentów, jak trzeba było coś poprawić <br>
Te dodatkowe pliki:

```plaintext
szachy
| ... - app
|     | - notation
|     | - pawn-promotion (cały)
|     | - szachownica
|     | - undo-move
|     | - zegar
|     | - audio-handler.service (cały)
|     | - chess.service (cały)
|     | - timer.service
```

~~Na szczęście nie musiałem robić prawie żadnych styli~~


## Trudności

Główne trudności, jakie napotkaliśmy to **czas** <br>
Po pierwsze samo zmieszczenie się w mniej niż miesiąc brzmiało ciężko. <br>
Jednak biorąc pod uwagę, że ponad połowa zespołu uczyła się Angulara na bieżąco, trudność jest na zupełnie innym poziome. <br>
Na szczęście w mojej skromnej opinii, udało nam się. <br>
Udało nam się skończyć projekt zaprojektowany (według mnie), biorąc nasze warunki i nasze nieogromne umiejętności, tak z 2-3 miesiące.

# Na koniec

## Czy uważam, że projekt dobrze wyszedł
Uważam, że poszedł nam świetnie ~~Poza jakością kodu~~<br>
I możemy być (chyba) dumni.

## Co bym zmienił
**Bardzo ważne** dodałbym do zespołu **Jacka W.** (proszę nie brać tego pod uwagę), byłaby to kluczowa części zespołu, która dałaby nam takiej motywacji i koordynacji, że aż szkoda, że go tu nie ma 🙏🙏🙏. <br>

I szczerze ja bym wybrał inny projekt np. 'Wyścigi', gdyż dla mnie najprzyjemniejszą częścią byłaby matematyka, ale reszta zespołu by się nie zgodziła, biorąc pod uwagę nasze ramy czasowe

Najważniejsze, wolałbym spędzić na to więcej niż 30% dostępnego czasu 😛

Pozdrawiam,
Żydon