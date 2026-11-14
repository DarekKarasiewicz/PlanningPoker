# Planning Poker

Aplikacja do estymacji zadań w zespole. Działa w całości w przeglądarce (GitHub Pages, bez bazy danych).

## Jak to działa

- Twórca pokoju jest **moderatorem i hostem**: jego przeglądarka trzyma stan pokoju i rozsyła go uczestnikom przez WebRTC ([PeerJS](https://peerjs.com/), publiczny serwer sygnalizacyjny).
- Uczestnicy dołączają kluczem pokoju (6 znaków) albo linkiem `.../#/room/KLUCZ`.
- Moderator dodaje zadania / user story, wybiera aktualne zadanie, startuje i odkrywa głosowanie oraz zapisuje estymatę.
- Głosy są ukryte do momentu odkrycia kart; potem widać średnią, min/max i rozkład.
- Talie: Fibonacci, zmodyfikowany Fibonacci, T-shirt, potęgi 2 lub własna (wartości po przecinku).
- Stan pokoju zapisuje się w `localStorage` hosta, więc odświeżenie strony go nie kasuje; goście łączą się ponownie automatycznie.
- Gdy host zamknie kartę, pokój przestaje działać.

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Aplikacja: http://localhost:5173/PlanningPoker/

```bash
npm test
npm run build
```

## Deploy na GitHub Pages

Workflow `.github/workflows/deploy.yml` buduje i publikuje aplikację po pushu na `main` lub `master`.
W ustawieniach repozytorium: **Settings → Pages → Source: GitHub Actions**.
`base` w `vite.config.ts` musi odpowiadać nazwie repozytorium (`/PlanningPoker/`).

## TODO

- Import zadań z pliku Excel
- Avatary uczestników
