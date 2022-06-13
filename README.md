# EcoCast

EcoCast vous permet de lancer des "applications" TV sur un ordinateur, depuis un navigateur basé sur Chromium et dédié à EcoCast.

Les applications se basent sur une version web, optimisé à l'affichage sur grand écran.

> EcoCast est toujours en phase de bêta, son développement est encore en cours et certaines fonctionnalités ne sont pas disponible.


### Images

![](https://firebasestorage.googleapis.com/v0/b/storage-bf183.appspot.com/o/ecocast-screenshot%2Fwelcome.jpg?alt=media)
![](https://firebasestorage.googleapis.com/v0/b/storage-bf183.appspot.com/o/ecocast-screenshot%2Fsleepmode.jpg?alt=media)
![](https://firebasestorage.googleapis.com/v0/b/storage-bf183.appspot.com/o/ecocast-screenshot%2Fyoutube.jpg?alt=media)
![](https://firebasestorage.googleapis.com/v0/b/storage-bf183.appspot.com/o/ecocast-screenshot%2Fremote.png?alt=media)
![](https://firebasestorage.googleapis.com/v0/b/storage-bf183.appspot.com/o/ecocast-screenshot%2Fscreenshot.png?alt=media)


### Installation

(vous aurez besoin de [git cli](https://git-scm.com/book/fr/v2/D%C3%A9marrage-rapide-Installation-de-Git), [nodejs v14+](https://nodejs.org) et [npm](https://npmjs.com/))

```bash
git clone https://github.com/johan-perso/ecocast.git
cd ecocast
npm install
```

Vous pourrez ensuite le lancer avec la commande `node index.js`.


### Applications disponible

| Nom      | Description                                                    | Statut |
|----------|--------------------------------------------------------------------|----|
| YouTube  | Permet d'accéder à YouTube en affichage TV                         | ✔️ |
| RATP     | Affiche en temps réel les heures d'arrivés des bus, RER et métro.  | ✔️ |
| Capture  | Effectue une capture d'écran d'EcoCast                             | ✔️ |
| Spotify  | Permet d'écouter des musiques via Spotify                          | ❌ |
| Disney+  | Lance une application Disney Plus                                  | ❌ |
| Twitch   | Affiche le site de twitch.tv, optimisé pour TV                     | ❌ |
| Molotov  | Vous laisse regarder les chaines de télévision                     | ❌ |


### Comment ?

EcoCast est développé avec NodeJS, en utilisant [Puppeteer](https://pptr.dev) pour démarrer un navigateur Chromium automatisé. [Un bloqueur de publicité](https://ublockorigin.com/fr) est préinstallé pour une meilleure expérience d'utilisation.

Les applications présentes dans EcoCast sont des sites web, légèrement modifié pour une utilisation sans clavier/souris, et sur grand écran.


### Télécommande virtuelle

Pour contrôler votre EcoCast à distance, vous pouvez utiliser une télécommande virtuelle depuis votre téléphone. Vous n'avez qu'à vous rendre sur l'IP locale (192.168.1.xx) de l'ordinateur qui héberge l'EcoCast depuis un navigateur connecté au même réseau wifi.

Cette télécommande virtuelle est le seul élément permettant de contrôler l'EcoCast et nécessite un code d'association à chaque connexion.


### Roadmap

> Si vous souhaiter contribuer à l'amélioration d'EcoCast, vous pouvez créer une [issue](https://github.com/johan-perso/ecocast/issues) pour en parler, ou modifier le code via une pull request.

- [ ] Créer un fichier de configuration pour gérer certains paramètres d'EcoCast, similaire à [StickStorage](https://github.com/johan-perso/stickstorage/blob/main/config.example.jsonc).
- [ ] Contrôle du bluetooth, pour (dé)connecter ses écouteurs sans fil depuis la télécommande virtuelle par exemple.
- [ ] Développer les applications pour EcoCast
- [x] Diaporama d'image sur l'écran de veille
- [x] Générer un code d'association unique pour chaque tentative de connexion
- [x] Créer des captures d'écran de l'EcoCast, depuis la télécommande virtuelle


### Licence

MIT © [Johan](https://johanstickman.com)
