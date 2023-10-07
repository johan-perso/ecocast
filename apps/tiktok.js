module.exports = {
  name: "TikTok",
  icon: "tiktok.png",
  hidden: false,
  execute: async (socket, page, server, ipAddr, config) => {
    try { await page.goto('https://www.tiktok.com/foryou', { timeout: 0 }) } catch(err){}
  }
}