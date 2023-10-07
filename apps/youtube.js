module.exports = {
  name: "YouTube",
  icon: "youtube.jpg",
  hidden: false,
  execute: async (socket, page, server, ipAddr, config) => {
    try { await page.goto('https://youtube.com/tv', { timeout: 0 }) } catch(err){}
  }
}