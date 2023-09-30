window.onload = async function(){
  // Obtenir les paramètres de l'URL, et préparer une variable
  var urlParams = new URLSearchParams(window.location.search)
  var welcomeScreenStillHere = true;

  // Si on doit passer l'animation
  if(urlParams.get('skipAnimation') == 'true'){
    // Enlever l'écran de bienvenue
    document.querySelector('#welcomeScreen').classList.add('hidden')
    welcomeScreenStillHere = false;

    // Mettre à jour l'heure et la date
    editTime()
    editDate()
  }

  // Ajouter une image de fond
  // Obtenir la liste des images
  var allImages = await fetch('/wallpaperList').then(res => res.text())

  // Si on a une vidéo à la place
  if(allImages.startsWith('video:')){
    var background = document.createElement('video')
    background.style.position = 'fixed'
    background.style.top = '0'
    background.style.left = '0'
    background.style.width = '100%'
    background.style.height = '100%'
    background.style.zIndex = '-1'
    background.style.objectFit = 'cover'
    background.autoplay = true
    background.loop = true
    background.innerHTML = `<source src="${allImages.substring(6)}">`
    document.body.appendChild(background)
  } else {
    // Convertir en un array
    allImages = allImages.split('\n')

    // Commencer à un emplacement aléatoire
    var randomIndex = Math.floor(Math.random() * allImages.length)

    // Ajouter l'image en tant que fond
    var background = document.createElement('img')
    background.src = allImages[randomIndex]
    background.style.position = 'fixed'
    background.style.top = '0'
    background.style.left = '0'
    background.style.width = '100%'
    background.style.height = '100%'
    background.style.zIndex = '-1'
    background.style.objectFit = 'cover'
    document.body.appendChild(background)

    // Toutes les 30 secondes, passer à la prochaine image
    setInterval(() => {
      randomIndex = (randomIndex + 1) % allImages.length
      background.src = allImages[randomIndex]
      console.log(allImages[randomIndex])
    }, 30000)
  }

  // Si on bouge le curseur de sa souris
  document.onmousemove = function(e){
    // Obtenir l'intensité de déplacement (si on bouge beaucoup le curseur ou pas)
    var intensity = Math.sqrt(Math.pow(e.movementX, 2) + Math.pow(e.movementY, 2))

    // Si l'intensité est inférieur à 4, le déplacement est plutôt léger : on va rien afficher
    if(intensity < 4) return

    // Si l'écran est actuellement affiché, annuler
    if(!document.getElementById('welcomeScreen').classList.contains('hidden') || !document.getElementById('welcomeScreen').classList.contains('animate__fadeOut')) return

    // Modifier les texte de l'écran de bienvenue
    document.querySelector('#welcomeScreenTitle').innerText = 'Oupsi'
    document.querySelector('#welcomeScreenSubtitle').innerText = "EcoCast est fait pour être utilisé depuis une télécommande virtuelle, votre curseur est donc masqué.\nPour plus d'informations, visiter le GitHub d'EcoCast."

    // Modifier la couleur du sous-titre
    document.querySelector('#welcomeScreenSubtitle').classList.remove('text-blue-400')
    document.querySelector('#welcomeScreenSubtitle').classList.add('text-gray-300','px-4')

    // Réafficher l'écran de bienvenue
    document.querySelector('#welcomeScreen').classList.remove('hidden')
    document.querySelector('#welcomeScreen').classList.remove('animate__fadeOut')
    document.querySelector('#welcomeScreen').classList.add('animate__animated', 'animate__fadeIn', 'animate__faster')

    // Remasquer l'écran au bout de quelques secondes
    setTimeout(() => {
      document.querySelector('#welcomeScreen').classList.add('animate__fadeOut')
      setTimeout(() => { document.querySelector('#welcomeScreen').classList.add('hidden') }, 800)
    }, 5000)
  }

  // Gérer l'heure et la date
  // Fonction pour modifier l'heure (format HH:MM)
  function editTime(){
    // Obtenir certaines informations
    var time = new Date()
    var hours = time.getHours()
    var minutes = time.getMinutes()

    // Ajouter un 0 devant les heures et les minutes
    if(hours < 10) hours = '0' + hours
    if(minutes < 10) minutes = '0' + minutes

    // Modifier l'heure
    if(!document.querySelector('.time').innerText) document.querySelector('.time').classList.add('animate__animated', 'animate__fadeIn')
    document.querySelector('.time').innerText = `${hours}:${minutes}`
  };

  // Fonction pour modifier la date
  function editDate(){
    // Obtenir certaines informations
    // La date
    var date = new Date()

    // La liste des jours et mois en français
    var days = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
    var months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

    // Le jour et le mois
    var day = days[date.getDay()]
    var month = months[date.getMonth()]

    // Modifier la date
    if(!document.querySelector('.date').innerText) document.querySelector('.date').classList.add('animate__animated', 'animate__fadeIn')
    document.querySelector('.date').innerText = `${day} ${(date.getDate() == '1') ? '1er' : date.getDate()} ${month}`
  };

  // Actualiser l'heure et la date
  setInterval(() => {
    if(welcomeScreenStillHere) return;
    editTime()
    editDate()
  }, 1000)

  // Enlever l'écran de bienvenue
  setTimeout(() => {
    // Ajouter une classe fadeOut
    document.querySelector('#welcomeScreen').classList.add('animate__animated', 'animate__fadeOut')
    setTimeout(() => {
      // Supprimer l'élément
      document.querySelector('#welcomeScreen').classList.add('hidden')
      welcomeScreenStillHere = false;

      // Faire apparaitre la date et l'heure
      editTime()
      editDate()
    }, 500)
  }, 4000)
}