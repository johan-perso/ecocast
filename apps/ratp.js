module.exports = {
  name: "RATP",
  icon: "ratp.png",
  hidden: true,
  execute: async (socket, page, server, ipAddr) => {
    socket.emit('error', `RATP n'est pas encore supporté, mais vous pourriez finir son développement vous-même 🙃 https://github.com/johan-perso/ecocast`);
    // await page.goto(`http://${ipAddr}:${server.address().port}/app/ratp/chooseLine.html`, { timeout: 0 })
  }
}