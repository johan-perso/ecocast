module.exports = {
  name: "Molotov",
  icon: "molotov.jpg",
  hidden: true,
  execute: async (socket, page, server, ipAddr, config) => {
    socket.emit('error', `Molotov n'est pas encore supporté, mais vous pourriez le développer vous-même 🙃 https://github.com/johan-perso/ecocast`)
  }
}