(async () => {
  // Demander sur l'écran un code d'association
  var tryPromptCode = await fetch('/api/promptCode', { method: 'POST' }).then(res => res.json())

  // Si le type de protection est "none"
  if(tryPromptCode.protectionType == 'none') {
    // On supprime la demande de code d'association
    document.getElementById('askAssociationCodeContainer').remove()
    document.getElementById('associationCodeBackgroundOpacity').remove()

    // On se connecte
    connectToSocket()
  }

  // Si le type de protection est "password"
  if(tryPromptCode.protectionType == 'password') {
    // Modifier le sous-titre
    document.getElementById('askAssociationSubtitle').innerText = 'Pour vous connecter, entrer votre mot de passe.'

    // Modifier l'input
    document.getElementById('associationCode').setAttribute('type', 'password')
    document.getElementById('associationCode').setAttribute('placeholder', 'Mot de passe, présent dans la configuration')
  }
})();

// Détecter quand on clique longtemps quelque part
var mouseIsDown = false;
var idInterval;
var opad;
document.addEventListener('mousedown', event => {
  if(!opad) opad = document.getElementById('opad')
  if(event.target == opad) event.preventDefault()
  mouseIsDown = true;
  idInterval = setInterval(() => {
    if(mouseIsDown){
      var target = event?.target || event?.srcElement || event?.toElement || event?.path?.[0] || null
      opadClick(event.clientX || event.clientLeft, event.clientY || event.clientTop, target.offsetLeft, target.offsetTop)
    }
  }, 400);
});
window.addEventListener('mouseup', () => {
  clearInterval(idInterval);
  mouseIsDown = false;
});

// Préparer la variable contenant le socket et le code unique
var socket;
var uniqueCode;

// Quand on tente de se connecter au socket
async function connectToSocket(code){
  // Se connecter au socket
  socket = io("/socket", { query: { uniqueCode: code } });
  uniqueCode = code

  // Quand on reçoit une erreur
  socket.on('error', function(error){
    alert(error)
  })

  socket.on("battery", function(battery){
    if (isNaN(battery)) return;
    battery = Math.round(battery * 100);
    if (battery >= 70) document.getElementById("battery").innerHTML = `<i data-lucide="battery-full"></i><span style="margin-left: 0.25rem;">${battery}%</span>`
    else if (battery >= 40 && battery < 70) document.getElementById("battery").innerHTML = `<i data-lucide="battery-medium"></i><span style="margin-left: 0.25rem;">${battery}%</span>`
    else if (battery >= 10 && battery < 40) document.getElementById("battery").innerHTML = `<i data-lucide="battery-low"></i><span style="margin-left: 0.25rem;">${battery}%</span>`
    else if (battery < 10) document.getElementById("battery").innerHTML = `<i data-lucide="battery-warning"></i><span style="margin-left: 0.25rem;">${battery}%</span>`
    lucide.createIcons();
  })

  // Quand le volume est changé
  var clearVolumeTimeout;
  socket.on('volume', function(volume){
    // Modifier l'indicateur
    document.getElementById('volumeIndicator_progress').style.height = `${volume}%`
    document.getElementById('volumeIndicator_number').innerText = volume

    // Afficher l'indicateur
    document.getElementById('volumeIndicator').classList.remove('hidden')

    // Supprimer l'ancien timeout si il existe
    if(clearVolumeTimeout) clearTimeout(clearVolumeTimeout)

    // Le masquer 2 secondes après
    clearVolumeTimeout = setTimeout(() => {
      document.getElementById('volumeIndicator').classList.add('hidden')
    }, 2000)
  })

  // Gérer les demandes via modal
  socket.on('askModal', function(title, description, inputs, callback){
    // Gérer les inputs
    inputs = inputs.map(inp => {
      if(inp.type == 'select'){
        var input = document.createElement('select')
        input.classList = 'mt-2 select w-full'
        if(inp.required) input.setAttribute('is-required', 'true')
        input.setAttribute('input-id', inp.id)
        inp.choices.forEach((choice, i) => {
          var option = document.createElement('option')
          if(i == 0) option.setAttribute('selected', 'true')
          option.innerText = choice.name
          option.setAttribute('option-id', choice.id)
          input.appendChild(option)
        })
        return `<p class="mt-2 text-left label-text">${(inp.required ? '* ' : '') + inp.placeholder} :</p>\n${input.outerHTML}`
      } else {
        var input = document.createElement('input')
        input.classList = `mt-2 ${inp.type == 'file' ? 'file-' : ''}input w-full` // "file-input" (pour que tailwindcss build cette classe)
        if(inp.type) input.setAttribute('type', inp.type)
        if(inp.value) input.setAttribute('value', inp.value)
        if(inp.accept) input.setAttribute('accept', inp.accept)
        if(inp.required) input.setAttribute('is-required', 'true')
        input.setAttribute('input-id', inp.id)
        return `<p class="mt-2 text-left label-text">${(inp.required ? '* ' : '') + inp.placeholder} :</p>\n${input.outerHTML}`
      }
    })

    // Modifier les élements principaux
    document.getElementById('askModal_title').innerText = title
    document.getElementById('askModal_description').innerText = description
    document.getElementById('askModal_inputs').innerHTML = inputs.join('')

    // Ajouter un bouton "valider"
    var confirmButton = document.createElement('button')
    confirmButton.classList = 'mt-4 bg-gray-600 hover:bg-gray-700 transition ease-in text-white px-4 py-2 rounded-lg'
    confirmButton.style.minWidth = '80%'
    confirmButton.innerText = 'Valider'
    confirmButton.onclick = async () => {
      // Obtenir les inputs
      var inputs = Array.from(document.querySelectorAll('#askModal_inputs select, #askModal_inputs input'))

      // Vérifier que tout les inputs soient remplis
      var allInputsFilled = true
      inputs.forEach(inp => {
        if(inp.getAttribute('is-required') && !inp.value) allInputsFilled = false
      })

      // Si tout les inputs soient remplis, on les envoie
      if(allInputsFilled){
        // Obtenir et envoyer les valeurs
        var values = {}
        inputs.forEach(inp => {
          if(inp.tagName == 'SELECT') values[inp.getAttribute('input-id')] = inp.options[inp.selectedIndex].getAttribute('option-id')
          else values[inp.getAttribute('input-id')] = inp.value
          inp.setAttribute('disabled', 'true')
        })

        // Envoyer les valeurs
        if(inputs[0].getAttribute('type') == 'file'){
          // Envoyer le fichier à l'API
          await new Promise((resolve, reject) => {
            var formData = new FormData()
            formData.append('file', inputs[0].files[0])
            fetch(`/api/castFile?code=${uniqueCode}`, { method: 'POST', body: formData }).then(res => res.json()).then(res => {
              resolve()
              if(res.error) alert(res.error)
            })
          })
        } else callback(values)

        // Masquer le modal puis supprimer ce bouton
        document.getElementById('askModal_backgroundOpacity').classList.add('hidden')
        document.getElementById('askModal_container').classList.add('hidden')
        confirmButton.remove()
      }

      // Sinon, on affiche un message d'erreur
      else alert('Vous devez remplir tout les champs obligatoires.')
    }
    document.getElementById('askModal_container').appendChild(confirmButton)

    // Afficher le modal
    document.getElementById('askModal_backgroundOpacity').classList.remove('hidden')
    document.getElementById('askModal_container').classList.remove('hidden')
  })

  // Masquer la demande de code
  if(document.getElementById('askAssociationCodeContainer')) document.getElementById('askAssociationCodeContainer').classList.add('animate__animated', 'animate__fadeOut')
  if(document.getElementById('associationCodeBackgroundOpacity')) document.getElementById('associationCodeBackgroundOpacity').classList.add('animate__animated', 'animate__fadeOut')
  setTimeout(() => {
    document.getElementById('askAssociationCodeContainer')?.remove()
    document.getElementById('associationCodeBackgroundOpacity')?.remove()
  }, 500)
}

// Fonction pour gérer les clics sur l'opad
function opadClick(clientX, clientY, offsetLeft, offsetTop){
  // De quel côté de l'image on a cliqué
  var x = clientX - offsetLeft
  var y = clientY - offsetTop

  // Déterminer de quel côté on a cliqué
  var side = 'middle'
  if(x < 53 && x > 0) side = 'left'
  if(x > 198 && x < 256) side = 'right'
  if(y < 65 && y > 0) side = 'up'
  if(y > 206 && y < 256) side = 'down'

  // Envoyer la commande
  socket.emit('opad', side)
}

// Quand la page est chargée
window.onload = async function(){
  // Créer les icones Lucide
  lucide.createIcons();

  // Quand on clique sur l'opad
  document.getElementById('opad').onclick = function(){
    opadClick(event.clientX, event.clientY, this.offsetLeft, this.offsetTop)
  }

  // Quand on clique sur un bouton de contrôle
  Array.from(document.querySelectorAll('.controlButton')).forEach((button) => {
    button.onclick = function(){
      socket.emit('control', this.getAttribute('actionName'))
    }
  })

  // Quand on entre quelques choses dans le clavier virtuel
  document.getElementById('virtualKeyboardInput').oninput = function(event){
    // Obtenir le charcode
    var key = event.data.charCodeAt(0)

    // Si on appuie sur entrer ou backspace
    if(key == 13 || key == 8) return;

    // Clear l'input
    document.getElementById('virtualKeyboardInput').value = ''

    // Envoyer la touche
    socket.emit('control', `keyboard_${key}`)
  }
  document.getElementById('virtualKeyboardInput').onkeydown = function(event){
    // Obtenir le charcode
    var key =
        (
            (event.keyCode || event.charCode) != '229'
        ) ?
            (event.keyCode || event.charCode) : (
                event?.originalEvent?.data?.charCodeAt(0) ||
                event?.target?.value?.charAt((event?.target?.selectionStart == 0 ? 1 : event?.target?.selectionStart) - 1)?.charCodeAt()
            )

    // Si on appuie pas sur entrer ou backspace
    if(key != 13 && key != 8) return;

    // Clear l'input
    document.getElementById('virtualKeyboardInput').value = ''

    // Envoyer la touche
    socket.emit('control', `keyboard_${key}`)
  }
}

// Fonction pour passer en mode launcher
function showLauncher(){
  // Masquer certains élements
  document.getElementById('opadMain').classList.add('hidden')
  document.getElementById('controlButtonContainer').classList.add('hidden')

  // Modifier le bouton de gauche
  document.getElementById('upperButton_right').innerHTML = '<i style="font-size: 1.2rem;" class="center fas fa-arrow-left" style="color: #fff;"></i>'
  document.getElementById('upperButton_right').setAttribute('onclick', 'showRemote()')

  // Afficher le launcher
  document.getElementById('launcherContainer').classList.remove('hidden')
}

// Fonction pour passer en mode télécommande
function showRemote(){
  // Masquer le launcher
  document.getElementById('launcherContainer').classList.add('hidden')

  // Afficher certains élements
  document.getElementById('opadMain').classList.remove('hidden')
  document.getElementById('controlButtonContainer').classList.remove('hidden')

  // Modifier le bouton de gauche
  document.getElementById('upperButton_right').innerHTML = '<i style="font-size: 1.2rem;" class="center fas fa-bars" style="color: #fff;"></i>'
  document.getElementById('upperButton_right').setAttribute('onclick', 'showLauncher()')
}

// Fonction pour lancer une application
async function startApp(element){
  // Prendre le parent de l'élement
  var parent = element.parentElement

  // Obtenir le span parmis les enfants
  var span = parent.getElementsByTagName('span')[0]
  span = span.innerText

  // Envoyer la commande au socket
  socket.emit('startApp', span.toLowerCase())

  // Retourner sur le menu de la télécommande
  showRemote()
}

// Fonction pour faire une capture d'écran
async function doScreenshot(element){
  // Masquer l'icône
  element.classList.add('hidden')

  // Afficher un loader
  document.getElementById('screenshotApp_loader').classList.remove('hidden')

  // Faire une requête pour obtenir le screenshot en base64
  var screenshot = await fetch(`/api/screenshot?code=${uniqueCode}`).then(res => res.text())

  // Réafficher l'icône et enlever le loader
  element.classList.remove('hidden')
  document.getElementById('screenshotApp_loader').classList.add('hidden')

  // Ajouter dans le body la capture d'écran
  document.body.innerHTML += `<div id="screenshotBackgroundOpacity" class="absolute bg-black opacity-40 inset-0 z-0"></div><div id="showScreenshot" class="fixed bg-gray-800 rounded-xl px-2 py-2 text-center" style="max-width: 94%"><svg onclick="closeScreenshot()" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="float-right hover:text-gray-400"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg><img src="${screenshot}" class="px-1 mt-8 mb-2 rounded-lg mx-auto" width="1280" height="720"></div>`
}

// Fonction pour (dé)masquer l'écran
function hideScreen(){
  if(!localStorage.getItem('firstUseTip_hideScreen')){
    alert(`Première utilisation ?\nL'application "Masquer écran" permet de masquer le contenu de l'application en cours d'utilisation. Lorsque vous l'utilisez, l'écran de veille sera affichée et tout les contrôles seront masqués jusqu'à ce que vous appuyez sur le bouton à nouveau.`)
    localStorage.setItem('firstUseTip_hideScreen', 'true')
  }
  socket.emit('hideScreen')
}

// Fonction pour caster un contenu
function castContent(){
  showRemote()
  socket.emit('cast')
}

// Si on clique ailleurs que dans le modal de la capture, la fermer
document.addEventListener('click', (event) => {
  // Vérifier que la capture d'écran est affichée
  if(document.getElementById('showScreenshot')){
    // Si on clique dans le modal/un de ses enfants, ne rien faire
    if(document.getElementById('showScreenshot').contains(event.target)) return;

    // Sinon, fermer le modal
    closeScreenshot()
  }
})

// Si on appuie sur échap
document.addEventListener('keydown', (event) => {
  // Vérifier que la capture d'écran est affichée
  if(document.getElementById('showScreenshot')){
    // Si on appuie sur échap, fermer le modal
    if(event.keyCode == 27) closeScreenshot()
  }
})

// Fonction pour fermer le modal de la capture d'écran
function closeScreenshot(){
  document.getElementById('showScreenshot').remove()
  document.getElementById('screenshotBackgroundOpacity').remove()
}

// Fonction pour afficher le clavier virtuelle
async function showVirtualKeyboard(){
  // Obtenir l'input invisible (pour afficher le clavier sur mobile)
  var virtualKeyboardInput = document.getElementById('virtualKeyboardInput')

  // Le rendre "visible" (plutôt accessible)
  virtualKeyboardInput.removeAttribute('hidden')

  // Mettre le focus
  virtualKeyboardInput.focus()
}

// Fonction pour se déconnecter
async function powerOff(){
  // Déconnecter le socket
  await socket.destroy()

  // Remplacer tout les éléments du body par un texte
  document.body.innerHTML = `<p class="text-yellow-500 font-mono text-xl text-center px-2">It's now safe to close this tab.</p><p class="text-gray-500 opacity-20 text-md text-center px-2 fixed bottom-2">windows 95 vibes</p>`
}