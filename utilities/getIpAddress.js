const os = require("os");
module.exports = () => {
  // Préparer un array d'IP locales
  let listIps = []

  // Obtenir toute les interfaces
  let interfaces = os.networkInterfaces()
  for(let devName in interfaces){
    let iface = interfaces[devName]
    for(let i = 0; i < iface.length; i++){
      let alias = iface[i]
      if(alias.family === 'IPv4'){
        listIps.push(alias.address)
      }
    }
  }

  // Enlever les IPs qui ne commencent pas par 192.168.1.
  listIps = listIps.filter(ip => ip.startsWith("192.168.1."))

  // Retourner l'IP locale
  return listIps[0] || '127.0.0.1'
}