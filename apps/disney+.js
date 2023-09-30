module.exports = {
  name: "Disney+",
  icon: "disneyplus.jpg",
  hidden: true,
  execute: async (socket, page, server, ipAddr) => {
    socket.emit('error', `Disney+ n'est pas encore supporté, mais vous pourriez le développer vous-même 🙃 https://github.com/johan-perso/ecocast`)
  }
}