function waitForElm(selector) {
  return new Promise(resolve => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}

window.onload = () => {
  if (document.querySelector('button[data-e2e="nav-login-button"]')) {
    alert("Vous n'êtes pas connecté à TikTok. Connectez-vous pour utiliser l'extension.")
    document.body.classList.add("nc")
  } else {
    if (window.location.href.endsWith("/foryou")) waitForElm(".tiktok-1ok4pbl-ButtonActionItem").then(() => {
      setTimeout(() => {
        document.querySelectorAll(".tiktok-1ok4pbl-ButtonActionItem")[1].click();
        if (document.querySelector("#tiktok-verify-ele")) {
          document.querySelector(".captcha_verify_container").remove();
          document.querySelector("#tiktok-verify-ele").remove();
        }
      }, 2000)
    })
  }
}
