module.exports = {
  name: "Twitch",
  icon: "twitch.jpg",
  hidden: true,
  execute: async (socket, page, server, ipAddr, config) => {
    socket.emit('error', `Twitch n'est pas encore supporté, mais vous pourriez le développer vous-même 🙃 https://github.com/johan-perso/ecocast`)
  }
}