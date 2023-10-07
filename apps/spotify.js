module.exports = {
  name: "Spotify",
  icon: "spotify.png",
  hidden: true,
  execute: async (socket, page, server, ipAddr, config) => {
    socket.emit('error', `Spotify n'est pas encore supporté, mais vous pourriez le développer vous-même 🙃 https://github.com/johan-perso/ecocast`);
  }
}