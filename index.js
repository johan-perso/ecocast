// Importer quelques librairies
const puppeteer = require('puppeteer'); var browser;
const fs = require('fs');
const path = require('path');
const loudness = require('loudness')

// Importer quelques autres librairies liés au serveur web
const http = require('http');
const express = require("express")
const app = express()
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// Préparer un serveur web avec ExpressJS
server.listen(process.env.PORT || 3510, () => {
	console.log(`Serveur web démarré sur le port ${server.address().port}`);
})

// Générer un code unique à 6 chiffres pour la connexion à EcoCast depuis un autre appareil
function generateCode(){
	// Préparer un code
	let code = [];

	// Ajouter des chiffres dans le code
	for(let i = 0; i < 6; i++){
		// Générer un chiffre
		let number = Math.floor(Math.random() * 10);

		// Si le dernier chiffre du code est le même que le nouveau, en générer un autre
		if(code.length > 0 && code[code.length - 1] == number){
			i--;
		} else {
			// Sinon on l'ajoute au code
			code.push(number);
		}
	}

	// Retourner le code
	return code.join('');
};
var uniquesCodes = [];

// Fonction pour obtenir son IP local
function getIPAdress(){
	// Préparer un array d'IP locales
	var listIps = [];

	// Obtenir toute les interfaces
	var interfaces = require('os').networkInterfaces();
	for(var devName in interfaces){
		var iface = interfaces[devName];
		for(var i = 0; i < iface.length; i++){
			var alias = iface[i];
			if(alias.family === 'IPv4'){
				listIps.push(alias.address);
			}
		}
	}

	// Enlever les IPs qui ne commencent pas par 192.168.1.
	listIps = listIps.filter(ip => ip.startsWith("192.168.1."));

	// Retourner l'IP locale
	return listIps[0] || '127.0.0.1'
}; ipAddr = getIPAdress();

// Routes pour le serveur web
app.get('/sleep', async (req, res) => {
	res.send(fs.readFileSync(path.join(__dirname, 'public', 'sleep.html')).toString().replace(/%REMOTE_LOCATION%/g, `http://${ipAddr}:${server.address().port}`));
})
app.get('/', async (req, res) => {
	res.send(fs.readFileSync(path.join(__dirname, 'public', 'remote.html')).toString());
})
app.get('/wallpaperList', async (req, res) => {
	res.send(fs.readFileSync(path.join(__dirname, 'public', 'wallpaperList.txt')).toString());
})
app.get('/opad.png', async (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'opad.png'));
})
app.use('/appsIcon', express.static(path.join(__dirname, 'public', 'appsIcon')));

// Fonction principale
async function main(){
	// Si Chromium avait crash lors de la dernière utilisation, modifier cela
	if(fs.existsSync(path.join(__dirname, 'chromeUserData'))){
		// Lire les préférences et le Local State
		var preferences
		var localState
		try {
			preferences = fs.readFileSync(path.join(__dirname, 'chromeUserData', 'Default', 'Preferences'))
			localState = fs.readFileSync(path.join(__dirname, 'chromeUserData', 'Default', 'Local State'))
		} catch (error) {}

		// Modifier certains élements du fichier
		if(preferences && preferences?.length) preferences = preferences.toString().replace(/"exit_type":"Crashed"/g, '"exit_type":"Normal"');
		if(localState && localState?.length) localState = localState.toString().replace(/"exited_cleanly":false/g, '"exited_cleanly":true')

		// Ecrire les préférences
		if(preferences && preferences?.length) fs.writeFileSync(path.join(__dirname, 'chromeUserData', 'Default', 'Preferences'), preferences);
		if(localState && localState?.length) fs.writeFileSync(path.join(__dirname, 'chromeUserData', 'Default', 'Local State'), localState);
	}

	// Crée le navigateur
	browser = await puppeteer.launch({
		headless: false,
		ignoreDefaultArgs: ["--enable-automation","--disable-extensions"],
		defaultViewport: null,
		userDataDir: './chromeUserData',
		args: [
			"--disable-session-crashed-bubble",
			"--disable-sync",
			"--disable-features=Translate",
			"--disable-default-apps",
			"--no-first-run",
			"--enable-automation",
			"--no-default-browser-check",
			"--disable-infobars",
			"--disable-translate",
			"--disable-background-mode",
			`--load-extension=${path.join(__dirname, 'chromeExtensions','uBlockOrigin')},${path.join(__dirname, 'chromeExtensions','globalCode')}`,
		]
	});

	// Quand le processus NodeJS est sur le point de s'arrêter, fermer le navigateur
	process.on('exit', async () => {
		await browser.close();
	});

	// Quand le navigateur se ferme, arrêter le processus
	browser.on('disconnected', () => {
		process.exit(0);
	});

	// Ouvrir une page
	var page = await browser.newPage();
	page.setUserAgent('Mozilla/5.0 (SMART-TV; Linux; Tizen 4.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.2924.0 Safari/537.36')

	// Fermer la page par défaut
	Array.from(await browser.pages())[0].close()

	// Naviguer vers le site
	await page.goto(`http://${ipAddr}:${server.address().port}/sleep`)

	// Route pour l'API - générer et afficher un nouveau code unique
	app.post('/api/promptCode', async (req, res) => {
		// Si il y a plus de 15 codes dans la liste, supprimer les 5 plus anciens
		if(uniquesCodes.length > 15) uniquesCodes.splice(0, 5);

		// Générer un code unique
		var code = generateCode();
		uniquesCodes.push(code);

		// Afficher le code unique sur l'écran
		Array.from(await browser.pages()).forEach(page_ => {
			page_.evaluate((code) => {
				document.body.insertAdjacentHTML('beforebegin', `<div id="toast_showUniqueCode" style="z-index: 1000; position: absolute; top: 0.5rem; left: 0.5rem; display: flex; align-items: center; width: 100%; max-width: 20rem; padding: 1rem; border-radius: 0.5rem; --tw-shadow:0 1px 3px 0 rgba(0,0,0,0.1),0 1px 2px 0 rgba(0,0,0,0.06); --tw-text-opacity: 1;color: rgba(156, 163, 175, var(--tw-text-opacity)); --tw-bg-opacity: 1;background-color: rgba(31, 41, 55, var(--tw-bg-opacity));" class="animate__animated animate__fadeInLeft"><div style="display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 2rem; height: 2rem; border-radius: 0.75rem; --tw-bg-opacity: 1;background-color: #0197F6; --tw-text-opacity: 1;color: #fff;"><svg style="width: 1.25rem; height: 1.25rem;" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg></div><div style="margin-left: 0.75rem; font-size: 0.875rem; line-height: 1.25rem;font-weight: 400;">Code d'association : <b>${code}</b></div></div>`)
				setTimeout(() => {
					document.getElementById('toast_showUniqueCode').classList.remove('animate__animated', 'animate__fadeInLeft');
					document.getElementById('toast_showUniqueCode').classList.add('animate__animated', 'animate__fadeOutLeft');
				}, 24000)
				setTimeout(() => {
					document.getElementById('toast_showUniqueCode').remove();
				}, 24700)
			}, code)
		})

		// Envoyer que le code est affiché à l'écran
		res.set('Content-Type', 'application/json').send({ error: false, message: "Code généré avec succès" })
	})

	// Route pour l'API - effectuer une capture d'écran
	app.get('/api/screenshot', async (req, res) => {
		// Vérifier qu'un code a été donné
		if(!req.query.code) return res.set('Content-Type', 'application/json').send({ error: true, message: "Aucun code donné" })

		// Vérifier que le code est correcte
		if(!uniquesCodes.includes(req.query.code)) return res.set('Content-Type', 'application/json').send({ error: true, message: "Code incorrect" })

		// Faire une capture d'écran de la page principale
		var screenshot = await page.screenshot({ encoding: "base64" })

		// Retourner la capture d'écran
		res.set('Content-Type', 'text/plain').send(`data:image/png;base64,${screenshot}`)
	})

	// Route pour l'API - supprimer un code
	app.delete('/api/deleteCode', async (req, res) => {
		// Vérifier qu'un code a été donné
		if(!req.query.code) return res.set('Content-Type', 'application/json').send({ error: true, message: "Aucun code donné" })

		// Supprimer le code
		uniquesCodes = uniquesCodes.filter(code => code != req.query.code)

		// Envoyer que le code est affiché à l'écran
		res.set('Content-Type', 'application/json').send({ error: false, message: "Code supprimé avec succès" })
	})

	// Socket pour gérer certains élements d'EcoCast à distance
	var allSockets = []
	io.of('/socket').on('connection', async socket => {
		// Obtenir le code unique dans les queries
		var uniqueCode = socket.handshake.query.uniqueCode;

		// Si le code ne fais pas parti de la liste
		if(!uniquesCodes.includes(uniqueCode)){
			socket.emit('error', "Le code d'association est incorrect, actualiser la page et réessayer.");
			return socket.disconnect();
		}

		// Sinon, ajouter le socket à la liste
		allSockets.push(socket)

		// Ajouter un toast sur la page + enlever les potentiels notifs qui affiche des codes
		Array.from(await browser.pages()).forEach(page_ => {
			page_.evaluate(() => {
				document.querySelectorAll('#toast_showUniqueCode').forEach(toast => toast.remove())
				document.body.insertAdjacentHTML('beforebegin', `<div id="toast_newDevice" style="z-index: 1000; position: absolute; top: 0.5rem; left: 0.5rem; display: flex; align-items: center; width: 100%; max-width: 20rem; padding: 1rem; border-radius: 0.5rem; --tw-shadow:0 1px 3px 0 rgba(0,0,0,0.1),0 1px 2px 0 rgba(0,0,0,0.06); --tw-text-opacity: 1;color: rgba(156, 163, 175, var(--tw-text-opacity)); --tw-bg-opacity: 1;background-color: rgba(31, 41, 55, var(--tw-bg-opacity));" class="animate__animated animate__fadeInLeft"><div style="display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 2rem; height: 2rem; border-radius: 0.75rem; --tw-bg-opacity: 1;background-color: rgba(185, 28, 28, var(--tw-bg-opacity)); --tw-text-opacity: 1;color: rgba(254, 202, 202, var(--tw-text-opacity));"><svg style="width: 1.25rem; height: 1.25rem;" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg></div><div style="margin-left: 0.75rem; font-size: 0.875rem; line-height: 1.25rem;font-weight: 400;">Un appareil s'est connecté !</div></div>`)
				setTimeout(() => {
					document.getElementById('toast_newDevice').classList.remove('animate__animated', 'animate__fadeInLeft');
					document.getElementById('toast_newDevice').classList.add('animate__animated', 'animate__fadeOutLeft');
				}, 4000)
				setTimeout(() => {
					document.getElementById('toast_newDevice').remove();
				}, 5100)
			})
		})

		// Quand le socket se déconnecte
		socket.on('disconnect', async () => {
			// Supprimer de la liste des sockets connectés
			allSockets.splice(allSockets.indexOf(socket), 1)

			// Ajouter un toast sur toutes les pages
			Array.from(await browser.pages()).forEach(page_ => {
				page_.evaluate(() => {
					document.body.insertAdjacentHTML('beforebegin', `<div id="toast_newDevice" style="z-index: 1000; position: absolute; top: 0.5rem; left: 0.5rem; display: flex; align-items: center; width: 100%; max-width: 20rem; padding: 1rem; border-radius: 0.5rem; --tw-shadow:0 1px 3px 0 rgba(0,0,0,0.1),0 1px 2px 0 rgba(0,0,0,0.06); --tw-text-opacity: 1;color: rgba(156, 163, 175, var(--tw-text-opacity)); --tw-bg-opacity: 1;background-color: rgba(31, 41, 55, var(--tw-bg-opacity));" class="animate__animated animate__fadeInLeft"><div style="display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 2rem; height: 2rem; border-radius: 0.75rem; --tw-bg-opacity: 1;background-color: rgba(185, 28, 28, var(--tw-bg-opacity)); --tw-text-opacity: 1;color: rgba(254, 202, 202, var(--tw-text-opacity));"><svg style="width: 1.25rem; height: 1.25rem;" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg></div><div style="margin-left: 0.75rem; font-size: 0.875rem; line-height: 1.25rem;font-weight: 400;">Un appareil s'est déconnecté.</div></div>`)
					setTimeout(() => {
						document.getElementById('toast_newDevice').classList.remove('animate__animated', 'animate__fadeInLeft');
						document.getElementById('toast_newDevice').classList.add('animate__animated', 'animate__fadeOutLeft');
					}, 4000)
					setTimeout(() => {
						document.getElementById('toast_newDevice').remove();
					}, 5100)
				})
			})
		})

		// Quand le socket envoie une action sur le opad
		socket.on('opad', async (action) => {
			// Bouton du milieu
			if(action == "middle") await page.keyboard.press('Enter')

			// Bouton du haut
			if(action == "up") await page.keyboard.press('ArrowUp')

			// Bouton du bas
			if(action == "down") await page.keyboard.press('ArrowDown')

			// Bouton droit
			if(action == "left") await page.keyboard.press('ArrowLeft')

			// Bouton gauche
			if(action == "right") await page.keyboard.press('ArrowRight')
		})

		// Quand le socket envoie une action de contrôle
		socket.on('control', async (action) => {
			console.log(action)
			// Si l'action commence par "keyboard_"
			if(action.startsWith("keyboard_")){
				// Récupérer la valeur de la clé
				let key = action.replace('keyboard_', '')

				// Mapper le keyCode en touche comphréhensible par puppeteer
				let keyCode = {
					"8": "Backspace",
					"9": "Tab",
					"13": "Enter",
					"16": "Shift",
					"17": "Control",
					"18": "Alt",
					"19": "Pause",
					"27": "Escape",
					"32": "Space",
					"33": "!",
					"34": "\"",
					"35": "#",
					"36": "$",
					"37": "%",
					"38": "&",
					"39": "'",
					"40": "(",
					"41": ")",
					"42": "*",
					"43": "+",
					"44": ",",
					"45": "-",
					"46": ".",
					"47": "/",
					"48": "0",
					"49": "1",
					"50": "2",
					"51": "3",
					"52": "4",
					"53": "5",
					"54": "6",
					"55": "7",
					"56": "8",
					"57": "9",
					"58": ":",
					"59": ";",
					"60": "<",
					"61": "=",
					"62": ">",
					"63": "?",
					"64": "@",
					"65": "A",
					"66": "B",
					"67": "C",
					"68": "D",
					"69": "E",
					"70": "F",
					"71": "G",
					"72": "H",
					"73": "I",
					"74": "J",
					"75": "K",
					"76": "L",
					"77": "M",
					"78": "N",
					"79": "O",
					"80": "P",
					"81": "Q",
					"82": "R",
					"83": "S",
					"84": "T",
					"85": "U",
					"86": "V",
					"87": "W",
					"88": "X",
					"89": "Y",
					"90": "Z",
					"91": "[",
					"92": "\\",
					"93": "]",
					"94": "^",
					"95": "_",
					"96": "`",
					"97": "a",
					"98": "b",
					"99": "c",
					"100": "d",
					"101": "e",
					"102": "f",
					"103": "g",
					"104": "h",
					"105": "i",
					"106": "j",
					"107": "k",
					"108": "l",
					"109": "m",
					"110": "n",
					"111": "o",
					"112": "p",
					"113": "q",
					"114": "r",
					"115": "s",
					"116": "t",
					"117": "u",
					"118": "v",
					"119": "w",
					"120": "x",
					"121": "y",
					"122": "z",
					"123": "{",
					"124": "|",
					"125": "}",
					"126": "~",
					"127": "Delete",
					"173": "-",
					"186": ";",
					"187": "=",
					"188": ",",
					"189": "-",
					"190": ".",
					"191": "/",
					"192": "`",
					"219": "[",
					"220": "\\",
					"221": "]",
					"222": "'",
					"223": "`",
					"226": "\\",
					"229": "\\",
					"246": "|",
					"247": "\"",
					"248": "\"",
					"251": "}",
					"252": "\"",
					"256": "~",
					"257": "!",
					"258": "\"",
					"259": "#",
					"260": "$",
					"261": "%",
					"262": "&",
					"263": "'",
					"264": "(",
					"265": ")",
					"266": "*",
					"267": "+",
					"268": ",",
					"269": "-",
					"270": ".",
					"271": "/"
				}

				// Envoyer la clé
				try {
					if(keyCode[key] == keyCode[key].toUpperCase()){
						console.log(`Pressing (uppercase) ${keyCode[key] || key}`)
						page.keyboard.down('Shift');
						page.keyboard.press(keyCode[key] || key);
						page.keyboard.up('Shift');
					} else {
						console.log(`Pressing ${keyCode[key] || key}`)
						page.keyboard.press(keyCode[key] || key);
					}
				} catch(err){
					console.log(err);	
				}	
			}

			// Bouton pour augmenter le son système
			if(action == "volumeUp"){
				// Obtenir l'ancien volume
				var oldVolume = await loudness.getVolume();

				// Démute
				await loudness.setMuted(false)

				// Augmenter le volume
				if(oldVolume > 95) await loudness.setVolume(100);
				else await loudness.setVolume(oldVolume + 5);
			}

			// Bouton pour baisser le son système
			if(action == "volumeDown"){
				// Obtenir l'ancien volume
				var oldVolume = await loudness.getVolume();

				// Démute
				await loudness.setMuted(false)

				// Baisser le volume
				if(oldVolume < 6) await loudness.setVolume(1) && await loudness.setMuted(true);
				else await loudness.setVolume(oldVolume - 5);
			}

			// Bouton pour rendre le son système muet
			if(action == "mute"){
				// Obtenir l'ancien statut
				var oldMute = await loudness.getMuted()

				// Inverser le statut
				await loudness.setMuted(!oldMute)
			}

			// Bouton pour mettre pause
			if(action == "pause"){
				// Inverser le statut de pause
				await page.evaluate(() => {
					var video = document.querySelector('video')
					if (video.paused) video.play();
					else video.pause()
				})
			}

			// Bouton pour retourner en arrière
			if(action == "back"){
				// Obtenir l'URL de la page
				var url = page.url()
				console.log(url)

				// Si on est sur YouTube TV, appuyer sur échap
				if(url.includes("youtube.com/tv")) await page.keyboard.press('Backspace')

				// Sinon, appuyer sur le bouton retour
				else await page.goBack()
			}

			// Bouton pour retourner à l'écran d'accueil
			if(action == "home"){
				await page.goto(`http://${ipAddr}:${server.address().port}/sleep`)
			}
		})

		// Quand le socket veut ouvrir une application
		socket.on('startApp', async (app) => {
			console.log(app)

			// Si l'application est YouTube
			if(app == "youtube") await page.goto('https://youtube.com/tv')

			// Si l'application est RATP
			if(app == "ratp") socket.emit('error', `RATP n'est pas encore supporté, mais vous pourriez le développer vous-même 🙃 https://github.com/johan-perso/ecocast`)

			// Si l'application est Spotify
			if(app == "spotify") socket.emit('error', `Spotify n'est pas encore supporté, mais vous pourriez le développer vous-même 🙃 https://github.com/johan-perso/ecocast`)

			// Si l'application est Disney+
			if(app == "disney+") socket.emit('error', `Disney+ n'est pas encore supporté, mais vous pourriez le développer vous-même 🙃 https://github.com/johan-perso/ecocast`)

			// Si l'application est Twitch
			if(app == "twitch") socket.emit('error', `Twitch n'est pas encore supporté, mais vous pourriez le développer vous-même 🙃 https://github.com/johan-perso/ecocast`)

			// Si l'application est Molotov
			if(app == "molotov") socket.emit('error', `Molotov n'est pas encore supporté, mais vous pourriez le développer vous-même 🙃 https://github.com/johan-perso/ecocast`)
		})
	});
}; main()