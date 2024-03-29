window.onload = async function(){
  // Obtenir le type de fichier
  var params = new URLSearchParams(window.location.search)
  var filetype = params.get('type')
  var filepath = decodeURIComponent(params.get('path'))
  var element

  // Si on a pas de type, on tente de le déterminer
  if(!filetype){
    var response = await fetch(filepath).catch(() => {
      location.href = filepath
    })
    var contenttype = response.headers.get('content-type')
    if(contenttype.startsWith('image')) filetype = 'image'
    else if(contenttype.startsWith('video')) filetype = 'video'
    else if(contenttype.startsWith('audio')) filetype = 'audio'
  }

  // Si c'est une image
  if(filetype == 'image'){
    element = document.createElement('img')
    element.src = filepath
    element.style.position = 'fixed'
    element.style.top = '0'
    element.style.left = '0'
    element.style.width = '100%'
    element.style.height = '100%'
    element.style.zIndex = '-1'
    element.style.objectFit = 'contain'
  }

  // Si c'est une vidéo
  else if(filetype == 'video' || filepath.endsWith('.mov')){
    element = document.createElement('video')
    element.src = filepath
    element.style.position = 'fixed'
    element.style.top = '0'
    element.style.left = '0'
    element.style.width = '100%'
    element.style.height = '100%'
    element.style.zIndex = '-1'
    element.autoplay = true
    element.loop = true
  }

  // Si c'est un fichier audio
  else if(filetype == 'audio'){
    element = document.createElement('audio')
    element.controls = true
    element.src = filepath
    element.style.width = '80%'
    element.style.zIndex = '-1'
  }

  // Sinon, on redirige vers la page (ptet le navigateur va pouvoir la charger)
  else location.href = filepath

  // Quand l'élement n'arrive pas à charger, on redirige vers la page
  element.onerror = () => location.href = filepath

  // Ajouter l'élement
  document.body.appendChild(element)
}

// Quand on clique sur l'écran
document.onclick = function(){
  if(document.querySelector('video') && document.querySelector('video').paused) document.querySelector('video').play()
  if(document.querySelector('audio') && document.querySelector('audio').paused) document.querySelector('audio').play()
}

// Quand on appuie sur une touche
var resetProgressTimeout
var showProgressInterval
document.onkeydown = function(e){
  console.log(e.key)
  // Aller en avant/arrière de 3 secondes
  if(e.key == 'ArrowRight'){
    if(document.querySelector('video')) document.querySelector('video').currentTime += 3
    if(document.querySelector('audio')) document.querySelector('audio').currentTime += 3
  }
  else if(e.key == 'ArrowLeft'){
    if(document.querySelector('video')) document.querySelector('video').currentTime -= 3
    if(document.querySelector('audio')) document.querySelector('audio').currentTime -= 3
  }

  // Aller en avant/arrière de 10 secondes
  else if(e.key == 'ArrowUp'){
    if(document.querySelector('video')) document.querySelector('video').currentTime += 10
    if(document.querySelector('audio')) document.querySelector('audio').currentTime += 10
  }
  else if(e.key == 'ArrowDown'){
    if(document.querySelector('video')) document.querySelector('video').currentTime -= 10
    if(document.querySelector('audio')) document.querySelector('audio').currentTime -= 10
  }

  // Si c'est un nombre, aller à ce pourcentage
  else if(!isNaN(e.key)){
    if(document.querySelector('video')) document.querySelector('video').currentTime = document.querySelector('video').duration * (e.key / 10)
    if(document.querySelector('audio')) document.querySelector('audio').currentTime = document.querySelector('audio').duration * (e.key / 10)
  }

  // Si c'est une vidéo, voir la progression (en %)
  else if(e.key == 'Enter'){
    var progress = document.getElementById('progress')
    if(showProgressInterval) clearInterval(showProgressInterval)
    showProgressInterval = setInterval(() => {
      if(document.querySelector('video')) progress.innerText = Math.round(document.querySelector('video').currentTime / document.querySelector('video').duration * 100) + ' %'
      if(document.querySelector('audio')) progress.innerText = Math.round(document.querySelector('audio').currentTime / document.querySelector('audio').duration * 100) + ' %'
    }, 100)
    if(resetProgressTimeout) clearTimeout(resetProgressTimeout)
    resetProgressTimeout = setTimeout(() => {
      clearInterval(showProgressInterval)
      progress.innerText = ''
    }, 2000)
  }
}