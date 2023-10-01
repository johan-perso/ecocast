// Importer quelques librairies
const puppeteer = require('puppeteer'); let browser
const fs = require('fs')
const os = require('os')
const path = require('path')
const loudness = require('loudness')
const clipboardy = require('clipboardy')

// Importer la configuration
const config = require('jsonc').parse(fs.readFileSync(path.join(__dirname, 'config.jsonc')).toString())
let apps = {};

// Importer quelques autres librairies liés au serveur web
const http = require('http')
const express = require("express")
const app = express()
const multer = require('multer');
const storage = multer.diskStorage({
	destination: function (req, file, cb){
		cb(null, 'public/temp')
	},
	filename: function (req, file, cb){
		cb(null, Date.now() + file.originalname)
	}
});
const upload = multer({ storage: storage });
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'pages'))

// Créer un dossier temporaire s'il n'existe pas, s'il existe, le vider
if(!fs.existsSync(path.join(__dirname, 'public', 'temp'))) fs.mkdirSync(path.join(__dirname, 'public', 'temp'))
else fs.readdirSync(path.join(__dirname, 'public', 'temp')).forEach(file => fs.unlinkSync(path.join(__dirname, 'public', 'temp', file)))

// Préparer un serveur web avec ExpressJS
let port = 3510
server.on('error', (err) => {
	if(err.code == 'EADDRINUSE' || err.code == 'EACCES') setTimeout(() => {
		port += 500
		tryToStartServer()
	}, 1000)
});

function tryToStartServer(){
	console.log(`Démarrage du serveur web sur le port ${port}...`)
	server.listen(process.env.PORT || config.port || port || 3510, () => {
		if(config.port && process.env.PORT && process.env.PORT !== config.port) console.log(`[WARN] La configuration utilise le port ${config.port}, mais celui-ci a aussi été défini dans les variable d'enviroment avec le port ${process.env.PORT}.`)
		if(!config.port && !process.env.PORT) console.log(`[WARN] La configuration n'a pas de port défini, le port ${server.address().port} a donc été utilisé.`)
		console.log(`Serveur web démarré sur le port ${server.address().port}`)
		console.log(`Chemin de la configuration : ${path.join(__dirname, 'config.jsonc')}`)
		clipboardy.writeSync(`http://${ipAddr}:${server.address().port}`)
		main()
	})
} tryToStartServer()

let uniquesCodes = []
ipAddr = require('./utilities/getIpAddress')();

// Routes pour le serveur web
app.get('/sleep', async (req, res) => {
	res.render("sleep", { REMOTE_LOCATION: `http://${ipAddr}:${server.address().port}` })
})
app.get('/filepreview', async (req, res) => {
	res.send(fs.readFileSync(path.join(__dirname, 'pages', 'filepreview.html')).toString())
})
app.get('/', async (req, res) => {
	res.render('remote', { apps });
})
app.get('/wallpaperList', async (req, res) => {
	if(config.screensaverType == 'diaporama') res.send(fs.readFileSync(path.join(__dirname, 'public', 'wallpaperList.txt')).toString())
	if(config.screensaverType.startsWith('video:')) res.send(`video: ${config.screensaverType.replace('video:','')}`)
})

app.use('/app/ratp', express.static(path.join(__dirname, 'pages', 'ratp-app')))
// app.use('/videos', express.static(path.join(__dirname, 'public', 'videos'))) // Inutilisé, mais j'garde au cas où quelqu'un veut l'utiliser pour servir des vidéos (config.screensaverType)
app.use('/public', express.static(path.join(__dirname, 'public')));

// Fonction principale
async function main(){
	// Définir le chemin du navigateur à utiliser
	let browserPath = await require("./utilities/getBrowserPath")()

	// Récuperer la liste des applications
	let appsDir = fs.readdirSync(path.join(__dirname, 'apps'));
	appsDir.forEach(app => {
		let name = app.toLowerCase();
		name = name.slice(0, -3);
		apps[name] = require(path.join(__dirname, 'apps', app));
	});

	// Si Chromium avait crash lors de la dernière utilisation, modifier cela
	if(fs.existsSync(path.join(__dirname, 'chromeUserData'))) {
		// Lire les préférences et le Local State
		let preferences
		let localState
		try {
			preferences = fs.readFileSync(path.join(__dirname, 'chromeUserData', 'Default', 'Preferences'))
			localState = fs.readFileSync(path.join(__dirname, 'chromeUserData', 'Default', 'Local State'))
		} catch (error) {}

		// Modifier certains élements du fichier
		if(preferences && preferences?.length) preferences = preferences.toString().replace(/"exit_type":"Crashed"/g, '"exit_type":"Normal"')
		if(localState && localState?.length) localState = localState.toString().replace(/"exited_cleanly":false/g, '"exited_cleanly":true')

		// Ecrire les préférences
		if(preferences && preferences?.length) fs.writeFileSync(path.join(__dirname, 'chromeUserData', 'Default', 'Preferences'), preferences)
		if(localState && localState?.length) fs.writeFileSync(path.join(__dirname, 'chromeUserData', 'Default', 'Local State'), localState)
	}

	// Préparer la liste des extensions à charger
	// Préparer un array vide
	let extensions = []

	// Ajouter uBlock s'il n'est pas désactivé
	if(config.adBlock) extensions.push(path.join(__dirname, 'chromeExtensions','uBlockOrigin'))

	// Ajouter hideCursor s'il n'est pas désactivé
	if(config.hideCursor) extensions.push(path.join(__dirname, 'chromeExtensions','hideCursor'))

	// Rajoute une extension peut importe la configuration
	extensions.push(path.join(__dirname, 'chromeExtensions','globalCode'))

	// Crée le navigateur
	browser = await puppeteer.launch({
		headless: false,
		ignoreDefaultArgs: ["--enable-automation","--disable-extensions"],
		defaultViewport: null,
		executablePath: browserPath,
		userDataDir: './chromeUserData',
		args: [
			"--autoplay-policy=no-user-gesture-required",
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
			"--disable-web-security",
			"--disable-features=IsolateOrigins",
			"--disable-site-isolation-trials",
			`--load-extension=${extensions.join(',')}`,
			config.fullScreen === true ? "--start-fullscreen" : '',
		]
	})

	// Quand le processus NodeJS est sur le point de s'arrêter, fermer le navigateur
	process.on('exit', async () => {
		await browser.close()
	})

	// Quand le navigateur se ferme, arrêter le processus
	browser.on('disconnected', () => {
		process.exit(0)
	})

	// Ouvrir une page
	let page = await browser.newPage();
	page.setUserAgent('Mozilla/5.0 (SMART-TV; Linux; Tizen 4.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.2924.0 Safari/537.36')

	// Fermer la page par défaut
	Array.from(await browser.pages())[0].close()

	// Naviguer vers le site
	if(config.homePage == 'youtube') await page.goto(`https://youtube.com/tv`, { timeout: 0 })
	else if(config.homePage == 'ratp') await page.goto(`http://${ipAddr}:${server.address().port}/app/ratp/chooseLine.html`, { timeout: 0 })
	else await page.goto(`http://${ipAddr}:${server.address().port}/sleep`, { timeout: 0 })

	// Route pour l'API - générer et afficher un nouveau code unique
	app.post('/api/promptCode', async (req, res) => {
		// Si le type de protection n'est pas par code unique
		if(config.associationProtection != 'uniqueCode') return res.set('Content-Type', 'application/json').send({ error: true, protectionType: (config?.associationProtection?.startsWith('password:') ? 'password' : config.associationProtection), message: "Endpoint désactivé : le type de protection n'est pas par code unique" })

		// s'il y a plus de 15 codes dans la liste, supprimer les 5 plus anciens
		if(uniquesCodes.length > 15) uniquesCodes.splice(0, 5)

		// Générer un code unique (et le copier dans le presse-papier)
		let code = require("./utilities/generateCode")()
		uniquesCodes.push(code)
		clipboardy.writeSync(code)

		// Afficher le code unique sur l'écran
		Array.from(await browser.pages()).forEach(page_ => {
			page_.evaluate((code) => {
				document.body.insertAdjacentHTML('beforebegin', `<div id="toast_showUniqueCode" style="z-index: 1000; position: absolute; top: 0.5rem; left: 0.5rem; display: flex; align-items: center; width: 100%; max-width: 20rem; padding: 1rem; border-radius: 0.5rem; --tw-shadow:0 1px 3px 0 rgba(0,0,0,0.1),0 1px 2px 0 rgba(0,0,0,0.06); --tw-text-opacity: 1;color: rgba(156, 163, 175, var(--tw-text-opacity)); --tw-bg-opacity: 1;background-color: rgba(31, 41, 55, var(--tw-bg-opacity));" class="animate__animated animate__fadeInLeft"><div style="display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 2rem; height: 2rem; border-radius: 0.75rem; --tw-bg-opacity: 1;background-color: #0197F6; --tw-text-opacity: 1;color: #fff;"><svg style="width: 1.25rem; height: 1.25rem;" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg></div><div style="margin-left: 0.75rem; font-size: 0.875rem; line-height: 1.25rem;font-weight: 400;">Code d'association : <b>${code.match(/.{1,2}/g).join(' ')}</b></div></div>`)
				setTimeout(() => {
					document.getElementById('toast_showUniqueCode').classList.remove('animate__animated', 'animate__fadeInLeft')
					document.getElementById('toast_showUniqueCode').classList.add('animate__animated', 'animate__fadeOutLeft')
				}, 24000)
				setTimeout(() => {
					document.getElementById('toast_showUniqueCode').remove()
				}, 24700)
			}, code)
		})

		// Envoyer que le code est affiché à l'écran
		res.set('Content-Type', 'application/json').send({ error: false, protectionType: (config?.associationProtection?.startsWith('password:') ? 'password' : config.associationProtection), message: "Code généré avec succès" })
	})

	// Route pour l'API - effectuer une capture d'écran
	app.get('/api/screenshot', async (req, res) => {
		// Vérifier qu'un code a été donné
		if(config.associationProtection != 'none' && !req?.query?.code) return res.set('Content-Type', 'application/json').send({ error: true, message: "Aucun code donné" })
		let code = req?.query?.code

		// Si le code ne fais pas parti de la liste des codes uniques
		if(config.associationProtection == 'uniqueCode' && !uniquesCodes.includes(code)){
			return res.set('Content-Type', 'application/json').send({ error: true, message: "Code incorrect" })
		}

		// Si la protection est un mot de passe, le vérifier
		if(config.associationProtection.startsWith('password:')){
			let password = config.associationProtection.split(':')[1];
			if(password != code) return res.set('Content-Type', 'application/json').send({ error: true, message: "Mot de passe incorrect" })
		}

		// Faire une capture d'écran de la page principale
		let screenshot = await page.screenshot({ encoding: "base64" })

		// Retourner la capture d'écran
		res.set('Content-Type', 'text/plain').send(`data:image/png;base64,${screenshot}`)
	})

	// Route pour l'API - afficher un fichier sur l'écran
	app.post('/api/castFile', async (req, res) => {
		// Vérifier qu'un code a été donné
		if(config.associationProtection != 'none' && !req?.query?.code) return res.set('Content-Type', 'application/json').send({ error: true, message: "Aucun code donné" })
		let code = req?.query?.code

		// Si le code ne fais pas parti de la liste des codes uniques
		if(config.associationProtection == 'uniqueCode' && !uniquesCodes.includes(code)){
			return res.set('Content-Type', 'application/json').send({ error: true, message: "Code incorrect" })
		}

		// Si la protection est un mot de passe, le vérifier
		if(config.associationProtection.startsWith('password:')){
			let password = config.associationProtection.split(':')[1];
			if(password != code) return res.set('Content-Type', 'application/json').send({ error: true, message: "Mot de passe incorrect" })
		}

		// Récupérer le fichier via le body form data
		upload.single('file')(req, res, async (err) => {
			// On renvoie via l'API que le fichier a été reçu, et on log si on a une erreur
			if(err) console.log(err)
			res.set('Content-Type', 'application/json').send({ error: false })

			// On va sur la page de prévisualisation du fichier, et on clique pour lancer la lecture si c'est une vidéo ou un audio
			await page.goto(`http://${ipAddr}:${server.address().port}/filepreview?path=${encodeURIComponent('public/temp/' + req.file.filename)}&type=${encodeURIComponent(req.file.mimetype.split('/')[0])}`, { timeout: 0 })
			if(req.file.mimetype.startsWith('video') || req.file.mimetype.startsWith('audio') || req.file.filename.endsWith('.mov')) await page.click('body')
		})
	})

	// Route pour l'API - supprimer un code
	app.delete('/api/deleteCode', async (req, res) => {
		// Si le type de protection n'est pas par code unique
		if(config.associationProtection != 'uniqueCode') return res.set('Content-Type', 'application/json').send({ error: true, message: "Endpoint désactivé : le type de protection n'est pas par code unique" })

		// Vérifier qu'un code a été donné
		if(!req.query.code) return res.set('Content-Type', 'application/json').send({ error: true, message: "Aucun code donné" })

		// Supprimer le code
		uniquesCodes = uniquesCodes.filter(code => code != req.query.code)

		// Envoyer que le code est affiché à l'écran
		res.set('Content-Type', 'application/json').send({ error: false, message: "Code supprimé avec succès" })
	})

	// Socket pour gérer certains élements d'EcoCast à distance
	let allSockets = []
	io.of('/socket').on('connection', async socket => {
		// Obtenir le code dans les queries
		let code = socket.handshake.query.uniqueCode;

		let batteryLevel = 1;
		require("battery-level")().then(level => {
			if (level !== batteryLevel) {
				batteryLevel = level;
				socket.emit('battery', level)
			}
		})

		setInterval(() => {
			require("battery-level")().then(level => {
				if (level !== batteryLevel) {
					batteryLevel = level;
					socket.emit('battery', level)
				}
			})
		}, 1000)


		// Si le code ne fais pas parti de la liste des codes uniques
		if(config.associationProtection == 'uniqueCode' && !uniquesCodes.includes(code)){
			socket.emit('error', "Le code d'association est incorrect, actualiser la page et réessayer.");
			return socket.disconnect();
		}

		// Si la protection est un mot de passe, le vérifier
		if(config.associationProtection.startsWith('password:')){
			let password = config.associationProtection.split(':')[1];
			if(password != code) return socket.emit('error', "Le mot de passe est incorrect, actualiser la page et réessayer.") && socket.disconnect();
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
			// Si l'action commence par "keyboard_"
			if(action.startsWith("keyboard_")){
				// Récupérer la valeur de la clé
				let key = action.replace('keyboard_', '')

				// Mapper le keyCode en touche comphréhensible par puppeteer
				let keyCode = { "8": "Backspace", "9": "Tab", "13": "Enter", "16": "Shift", "17": "Control", "18": "Alt", "19": "Pause", "27": "Escape", "32": "Space", "33": "!", "34": "\"", "35": "#", "36": "$", "37": "%", "38": "&", "39": "'", "40": "(", "41": ")", "42": "*", "43": "+", "44": ",", "45": "-", "46": ".", "47": "/", "48": "0", "49": "1", "50": "2", "51": "3", "52": "4", "53": "5", "54": "6", "55": "7", "56": "8", "57": "9", "58": ":", "59": ";", "60": "<", "61": "=", "62": ">", "63": "?", "64": "@", "65": "A", "66": "B", "67": "C", "68": "D", "69": "E", "70": "F", "71": "G", "72": "H", "73": "I", "74": "J", "75": "K", "76": "L", "77": "M", "78": "N", "79": "O", "80": "P", "81": "Q", "82": "R", "83": "S", "84": "T", "85": "U", "86": "V", "87": "W", "88": "X", "89": "Y", "90": "Z", "91": "[", "92": "\\", "93": "]", "94": "^", "95": "_", "96": "`", "97": "a", "98": "b", "99": "c", "100": "d", "101": "e", "102": "f", "103": "g", "104": "h", "105": "i", "106": "j", "107": "k", "108": "l", "109": "m", "110": "n", "111": "o", "112": "p", "113": "q", "114": "r", "115": "s", "116": "t", "117": "u", "118": "v", "119": "w", "120": "x", "121": "y", "122": "z", "123": "{", "124": "|", "125": "}", "126": "~", "127": "Delete", "173": "-", "186": ";", "187": "=", "188": ",", "189": "-", "190": ".", "191": "/", "192": "`", "219": "[", "220": "\\", "221": "]", "222": "'", "223": "`", "226": "\\", "229": "\\", "246": "|", "247": "\"", "248": "\"", "251": "}", "252": "\"", "256": "~", "257": "!", "258": "\"", "259": "#", "260": "$", "261": "%", "262": "&", "263": "'", "264": "(", "265": ")", "266": "*", "267": "+", "268": ",", "269": "-", "270": ".", "271": "/"}

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
				let oldVolume = await loudness.getVolume();

				// Démute
				await loudness.setMuted(false)

				// Augmenter le volume
				if(oldVolume > 95) await loudness.setVolume(100);
				else await loudness.setVolume(oldVolume + 5);

				// Retourner le volume actuelle
				if(oldVolume > 95) socket.emit('volume', 100);
				else socket.emit('volume', oldVolume + 5);
			}

			// Bouton pour baisser le son système
			if(action == "volumeDown"){
				// Obtenir l'ancien volume
				let oldVolume = await loudness.getVolume();

				// Démute
				await loudness.setMuted(false)

				// Baisser le volume
				if(oldVolume < 6) await loudness.setVolume(1) && await loudness.setMuted(true);
				else await loudness.setVolume(oldVolume - 5);

				// Retourner le volume actuelle
				if(oldVolume < 6) socket.emit('volume', 0);
				else socket.emit('volume', oldVolume - 5);
			}

			// Bouton pour rendre le son système muet
			if(action == "mute"){
				// Obtenir l'ancien statut
				let oldMute = await loudness.getMuted()

				// Inverser le statut
				await loudness.setMuted(!oldMute)

				// Retourner le volume actuelle
				socket.emit('volume', oldMute ? await loudness.getVolume() : 0)
			}

			// Bouton pour mettre pause
			if(action == "pause"){
				// Inverser le statut de pause
				await page.evaluate(() => {
					// Tenter pour une vidéo
					let video = document.querySelector('video')
					if(video){
						if(video.paused) video.play();
						else video.pause()
					}

					// Tenter pour un audio
					let audio = document.querySelector('audio')
					if(audio){
						if(audio.paused) audio.play();
						else audio.pause()
					}
				})
			}

			// Bouton pour retourner en arrière
			if(action == "back"){
				// Obtenir l'URL de la page
				let url = page.url()
				console.log(url)

				// Si on est sur YouTube TV, appuyer sur échap
				if(url.includes("youtube.com/tv")) await page.keyboard.press('Backspace')

				// Sinon, appuyer sur le bouton retour
				else await page.goBack()
			}

			// Bouton pour retourner à l'écran d'accueil
			if(action == "home"){
				await page.goto(`http://${ipAddr}:${server.address().port}/sleep`, { timeout: 0 })
			}
		})

		// Si on veut masquer l'application en cours
		let isHidden = false
		socket.on('hideScreen', async () => {
			// Si l'application n'est pas déjà masquée
			if(!isHidden){
				let page = await browser.newPage()
				await page.goto(`http://${ipAddr}:${server.address().port}/sleep?skipAnimation=true`, { timeout: 0 }) // On ouvre une nouvelle page sur l'écran de veille
				isHidden = true
			}

			// Sinon, on la démasque
			else {
				Array.from(await browser.pages()).forEach((page, i) => { // On ferme toutes les pages sauf la première
					if(i != 0) page.close()
				})
				isHidden = false
			}
		})

		// Se préparer à caster un contenu
		socket.on('cast', () => {
			socket.emit('askModal',
					"Caster un contenu",
					"Vous vous apprêtez à partager un contenu sur votre écran",
					[{
						type: "select",
						placeholder: "Type de contenu",
						required: true,
						id: 'type',
						choices: [
							{
								name: "Fichier de votre appareil",
								id: "localfile"
							},
							{
								name: "Fichier via Internet",
								id: "internetfile"
							},
							{
								name: "Live Twitch",
								id: "twitch"
							}
						]
					}],
					response => {
						if(response.type == 'localfile'){
							socket.emit('askModal', "Caster un fichier local", "Choisissez un fichier depuis votre appareil à caster sur votre écran", [{ type: "file", placeholder: "Image, vidéo, audio", required: true, id: 'file', accept: "image/png,image/jpeg,image/gif,video/mp4,video/quicktime,video/webm,audio/mpeg,audio/ogg,audio/wav" }])
							// cette fois-ci on attend pas de callback, car le client nous l'envoie différemment
						}

						if(response.type == 'internetfile'){
							socket.emit('askModal', "Caster un fichier Internet", "Entrer l'URL d'accès directe vers le fichier à caster sur votre écran",
								[{ type: "url", placeholder: "Adresse internet", required: true, id: 'url' }],
								response => cast_internetfile(response.url)
							)
						}

						if(response.type == 'twitch'){
							socket.emit('askModal', "Caster un live Twitch", "Entrer l'URL d'un live ou un nom d'utilisateur Twitch à caster sur votre écran",
								[{ type: "url", placeholder: "URL ou pseudo Twitch", required: true, id: 'url' }],
								response => cast_twitch(response.url)
							)
						}
					}
				)
		})

		// Caster un contenu via Internet
		async function cast_internetfile(url){
			await page.goto(`http://${ipAddr}:${server.address().port}/filepreview?path=${encodeURIComponent(url)}`, { timeout: 0 })
			await page.click('body') // lance la lecture si c'est une vidéo ou un audio
		}

		// Caster un contenu via Twitch
		async function cast_twitch(url){
			await page.goto(url.startsWith('https://m.twitch.tv') || url.startsWith('https://twitch.tv') || url.startsWith('https://www.twitch.tv') ? url : `https://m.twitch.tv/${url}`, { timeout: 0, waitUntil: 'networkidle0' })
			try {
				await page.evaluate(() => {
					document.querySelector("nav").remove() // Supprimer la navbar
					document.querySelector("#__next > div > div").remove() // Supprimer la navbar
					document.querySelector("#__next > div > main > div > div.Layout-sc-1xcs6mc-0.sc-92c0556c-3.gyuRLA.nOrUL").remove() // Supprimer le chat
					document.querySelector("body > div.ScReactModalBase-sc-26ijes-0.SrsEl.tw-modal-layer > div > div > div:nth-child(2) > div > div > div.Layout-sc-1xcs6mc-0.ghhWpt > button").click() // Accepter les cookies
				})
			} catch(err){}

			// Si on a pas de vidéo, on conclus que la personne n'est pas en live
			try {
				if(!await page.$('video')){
					socket.emit('error', "Le live n'existe pas ou n'est pas en cours.")
					await page.goBack()
				}
			} catch(err){}
		}

		// Quand le socket veut ouvrir une application
		socket.on('startApp', async (app) => {
			if (apps[app]) return apps[app].execute(socket, page, server, ipAddr)
			else socket.emit('error', "L'application n'existe pas")
		})
	})
}
