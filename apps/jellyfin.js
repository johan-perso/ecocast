module.exports = {
  name: "Jellyfin",
  icon: "jellyfin.png",
  hidden: false,
  execute: async (socket, page, server, ipAddr, config) => {
    if (config.jellyfin_instance === "none" || !config.jellyfin_instance) {
      socket.emit('askModal',
          "Serveur Jellyfin",
          "Entrer le lien de votre serveur Jellyfin",
          [
            {
              type: "url",
              placeholder: "Lien du serveur Jellyfin",
              required: true,
              id: 'server'
            }
          ],
          async (response) => {
            if (!response.server) return

            // Aller sur la page et attendre qu'elle charge
            await page.goto(response.server.startsWith("http") ? response.server:`https://${response.server}`, {timeout: 0, waitUntil: 'networkidle0'})
          }
      )
    } else {
        await page.goto(config.jellyfin_instance.startsWith("http") ? config.jellyfin_instance:`https://${config.jellyfin_instance}`, {timeout: 0, waitUntil: 'networkidle0'})
    }
  }
}