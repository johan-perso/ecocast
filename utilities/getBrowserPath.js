const os = require("os");
const path = require("path");
const fs = require("fs");
const inquirer = require("inquirer");

module.exports = async () => {
  let browserPath;
  // Si une variable d'enviroment est définie, l'utiliser
  if(config?.browserPath?.length && config.browserPath != "none"){
    browserPath = config.browserPath
    return browserPath
  }

  // Préparer la liste des chemins de potentiel navigateur
  let browserPaths = []

  // Ajouter des chemins de navigateur
  // Sous Windows
  if(os.platform() == 'win32'){
    browserPaths.push(path.join(process.env.ProgramFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'))
    browserPaths.push(path.join(process.env['ProgramFiles(x86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe'))
    browserPaths.push(path.join(process.env.ProgramFiles, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'))
  }

  // Sous Linux (pas testé)
  if(os.platform() == 'linux'){
    browserPaths.push('/usr/bin/google-chrome')
    browserPaths.push('/usr/bin/chromium')
  }

  // Sous macOS (pas testé)
  if(os.platform() == 'darwin'){
    browserPaths.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
    browserPaths.push('/Applications/Chromium.app/Contents/MacOS/Chromium')
  }

  // Tester si les chemins existent
  browserPaths.forEach(browserPath => {
    if(!fs.existsSync(browserPath)) browserPaths = browserPaths.filter(path => path != browserPath)
  })

  // Si on a trouvé aucun navigateur, retourner null
  if(browserPaths.length == 0) browserPath = null

  // Sinon, demander le navigateur à utiliser
  else {
    // Si on a trouvé qu'un seul navigateur, l'utiliser
    if(browserPaths.length == 1) browserPath = browserPaths[0]

    // Sinon on utilise inquirer pour demander
    else {
      const inquirer = require('inquirer')
      const { browser } = await inquirer.prompt({
        type: 'list',
        name: 'browser',
        message: 'Quel navigateur voulez-vous utiliser ?',
        choices: browserPaths
      })
      browserPath = browser
    }
  }

  // Retourner le chemin du navigateur
  return browserPath
}