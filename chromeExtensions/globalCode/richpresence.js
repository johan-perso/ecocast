window.onload = function() {
  let domain = window.location.hostname;
  console.log(window.location.pathname);
  if (domain === "www.youtube.com") {
    console.log("RPC Changed - YouTube");
  } else if (document.title.includes("Jellyfin")) {
    console.log("RPC Changed - Jellyfin");
  } else if (domain === "www.tiktok.com") {
    console.log("RPC Changed - TikTok");
  } else if (window.location.pathname === "/sleep") {
    console.log("RPC Changed - Localhost");
  }
}