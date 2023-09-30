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

| Nom           | Description                                                         | Statut |
|---------------|---------------------------------------------------------------------|-------|
| YouTube       | Permet d'accéder à YouTube en affichage TV                          | ✔️    |
| Hyperbeam     | Rejoint une salle Hyperbeam contrôlé par un autre utilisateur       | ✔️    |
| RATP          | Affiche en temps réel les heures d'arrivés des bus, RER et métro.   | 🟠    |
| Capture       | Effectue une capture d'écran d'EcoCast                              | ✔️    |
| Masquer écran | Masque l'écran d'EcoCast en le remplaçant par l'écran de veille     | ✔️    |
| Caster        | Partage un contenu sur l'écran depuis la télécommande virtuelle     | ✔️    |
| Plex          | Lance Plex WEB, avec quelques ajouts pour une meilleure immersivité | ❌    |
| Spotify       | Permet d'écouter des musiques via Spotify                           | ❌    |
| Disney+       | Lance une application Disney+                                       | ❌    |
| Twitch        | Affiche le site de twitch.tv, optimisé pour TV                      | ❌    |
| Molotov       | Vous laisse regarder les chaines de télévision                      | ❌    |
| TikTok        | Accéder à TikTok avec un affichage TV                               | ✔️     |



### Comment ?

EcoCast est développé avec NodeJS, en utilisant [Puppeteer](https://pptr.dev) pour démarrer un navigateur Chromium automatisé. [Un bloqueur de publicité](https://ublockorigin.com/fr) est préinstallé pour une meilleure expérience d'utilisation.

Les applications présentes dans EcoCast sont des sites web, légèrement modifié pour une utilisation sans clavier/souris, et sur grand écran.


### Télécommande virtuelle

Pour contrôler votre EcoCast à distance, vous pouvez utiliser une télécommande virtuelle depuis votre téléphone. Vous n'avez qu'à vous rendre sur l'IP locale (192.168.1.xx) de l'ordinateur qui héberge l'EcoCast depuis un navigateur connecté au même réseau wifi.

Cette télécommande virtuelle est le seul élément permettant de contrôler l'EcoCast et nécessite un code d'association à chaque connexion (peut être modifié dans la configuration).


### Caster

La fonctionnalité "caster" permet de partager un contenu (image, vidéo, audio) sur l'écran d'EcoCast, depuis la télécommande virtuelle. Il peut s'agir d'un fichier sur votre téléphone (note : celui-ci devra s'envoyer entièrement avant d'être lu), d'un lien vers un fichier, ou d'un live sur Twitch.

Sur les fichiers prévisualisés directement par EcoCast, les contrôles de la télécommande virtuelle fonctionneront :
- Sur les images : seul le bouton de retour en arrière est disponible
- Sur les vidéos et les audios :
	- Vous pourrez aussi mettre en pause/lecture
	- Avancer/reculer de 3 secondes avec les flèches de gauche à droite
	- Avancer/reculer de 10 secondes avec les flèches du haut et du bas
	- Augmenter/diminuer le volume
	- Avancer à un certain pourcentage de la vidéo avec les chiffres de 0 à 9 (via le bouton "clavier" de la télécommande virtuelle)
	- Appuyer sur le bouton central pour afficher la progression

Les autres contenus peuvent ne pas être compatibles avec les contrôles de la télécommande virtuelle, à l'exception des boutons suivants :
- Retour en arrière
- Volume - / +
- Volume muet
- Accueil


### Configuration

Vous pouvez modifier les paramètres de votre EcoCast à partir du fichier [`config.jsonc`](https://github.com/johan-perso/ecocast/blob/main/config.jsonc). Les paramètres suivants peuvent être modifiés :

**port**

> Valeur par défaut : `3510`\
> Type : `number`\
> Choix : port entre 0 et 65535

Le port utilisé par le serveur web d'EcoCast. Si la variable d'environnement `PORT` est défini, la valeur définie dans la configuration sera ignorée. Si aucune de ces valeurs ne peut s'appliquer, le port `3510` sera utilisé.

**fullScreen**

> Valeur par défaut : `true`\
> Type : `boolean`\
> Choix : `true`, `false`

Permet de choisir si EcoCast devrait être démarré en plein écran par défaut, vous pouvez à tout moment activer/désactiver ce mode en appuyant sur F11 lorsque le focus est sur la fenêtre d'EcoCast.

**adBlock**

> Valeur par défaut : `true`\
> Type : `boolean`\
> Choix : `true`, `false`

Permet de choisir si EcoCast est démarré avec [un bloqueur de publicité](https://ublockorigin.com/fr) ou non.

**hideCursor**

> Valeur par défaut : `true`\
> Type : `boolean`\
> Choix : `true`, `false`

Permet de choisir si le curseur de votre souris devrait être caché lorsqu'EcoCast est démarré en plein écran.

**homePage**

> Valeur par défaut : `sleep`\
> Type : `string`\
> Choix :
> - `sleep` : Ecran de veille, affiche un diaporama d'images ainsi que l'heure et la date
> - `youtube` : Lance l'application YouTube
> - `ratp` : Lance l'application RATP

Modifie l'application qui se lance au démarrage d'EcoCast.

**screensaverType**

> Valeur par défaut : `diaporama`\
> Type : `string`\
> Choix :
> - `diaporama` : Affiche un diaporama d'images
> - `video:<lien de la vidéo>` : Affiche une vidéo en boucle sur l'écran d'accueil (.webm / .ogg)

Modifie le type de contenu affiché sur l'écran de veille

**associationProtection**

> Valeur par défaut : `uniqueCode`\
> Type : `string`\
> Choix :
> - `none` : Désactive la protection d'association, permet à n'importe qui d'utiliser la télécommande virtuelle pour se connecter à EcoCast
> - `uniqueCode` : Génère sur votre écran d'EcoCast un code unique à 6 chiffres, à entrer dans la télécommande pour effectuer une connexion
> - `password:<le mot de passe que vous voulez>` : Demande un mot de passe à chaque connexion depuis la télécommande virtuelle

Modifie le type de protection utilisé lors de l'association à la télécommande virtuelle.

**browserPath**

> Valeur par défaut : `none`\
> Type : `string`

Permet de démarrer EcoCast à partir d'un chemin de navigateur personnalisé. Si aucun chemin n'est défini, EcoCast essayera de trouver un navigateur Chromium installé sur votre appareil.


### Roadmap

> Si vous souhaiter contribuer à l'amélioration d'EcoCast, vous pouvez créer une [issue](https://github.com/johan-perso/ecocast/issues) pour en parler, ou modifier le code via une pull request.

- [ ] Contrôle du bluetooth, pour (dé)connecter ses écouteurs sans fil depuis la télécommande virtuelle par exemple.
- [ ] Développer toute les applications pour EcoCast
- [x] Créer un fichier de configuration pour gérer certains paramètres d'EcoCast, similaire à [StickStorage](https://github.com/johan-perso/stickstorage/blob/main/config.example.jsonc).
- [x] Afficher des vidéos sur l'écran de veille
- [x] Diaporama d'image sur l'écran de veille
- [x] Générer un code d'association unique pour chaque tentative de connexion
- [x] Créer des captures d'écran de l'EcoCast, depuis la télécommande virtuelle
- [x] Partager des contenus de la télécommande à l'écran


### Licence

MIT © [Johan](https://johanstick.fr)
