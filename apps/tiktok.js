module.exports = {
  name: "TikTok",
  icon: "tiktok.png",
  hidden: false,
  execute: async (socket, page, server, ipAddr) => {
    try { await page.goto('https://www.tiktok.com/foryou', { timeout: 0 }) } catch(err){}
  }
}