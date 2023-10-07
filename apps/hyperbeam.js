module.exports = {
  name: "Hyperbeam",
  icon: "hyperbeam.png",
  hidden: false,
  execute: async (socket, page, server, ipAddr, config) => {
    socket.emit('askModal',
        "Session Hyperbeam",
        "Entrer le code d'une session Hyperbeam déjà existante pour la rejoindre",
        [
          {
            type: "url",
            placeholder: "Code/URL de la session",
            required: true,
            id: 'code'
          },
          {
            type: "text",
            placeholder: "Nom d'utilisateur",
            required: false,
            id: 'username'
          }
        ],
        async (response) => {
          // Si on a pas de code, on arrête
          if(!response.code) return

          // Aller sur la page et attendre qu'elle charge
          await page.goto(response.code.startsWith('https://hyperbeam.com/') ? response.code : `https://hyperbeam.com/app/invite/${response.code}`, { timeout: 0, waitUntil: 'networkidle0' })

          // Cocher la validation d'âge
          try {
            await page.click('div.inviteCards_nX2Ux div.internetAdultContainer_3CtfY > div > div')
          } catch(err){}

          // Ecrire le nom d'utilisateur puis rejoindre
          try {
            if(response.username){
              await page.$eval('div.displayNameInput_1PDBo input', el => el.value = '')
              await page.type('div.displayNameInput_1PDBo input', response.username)
            }
            await page.click('div.inviteCards_nX2Ux div.footer_3Yiou > button')
          } catch(err){}

          // Attendre qu'on soit sur la page de la session
          try {
            await page.waitForSelector('.vmContainer_utWdv > video')
          } catch(err){}

          // Si on nous affiche le guide, le fermer
          try {
            await page.evaluate(() => {
              document.querySelector("#app > div.wrapper_1fzOe.roomInfoCard_2fgp2 div.dialog-footer > button").click()
            })
          } catch(err){}

          // Passer en "plein écran"
          try {
            await page.evaluate(() => {
              document.querySelector("div.chatContainer_1z3kq").remove() // chat
              document.querySelector("div.vmControls_1Z7US > div.rightControls_47NFz button:nth-child(3)").click() // passer en mode théâtre
              document.querySelector("div.vmControls_1Z7US").remove() // supprimer les contrôles (volume, plein écran, théâtre, réglages, ...)
              document.querySelector("div.resizer_sfC_W").remove() // truc à glisser pour redimensionner le chat
            })
          } catch(err){}
        }
    )
  }
}