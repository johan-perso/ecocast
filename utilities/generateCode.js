const alphabet = [
  { char: '1', surrounding: ['2','4'] }, { char: '2', surrounding: ['1','3','5'] },
  { char: '3', surrounding: ['2','6'] }, { char: '4', surrounding: ['1','5','7'] }, { char: '5', surrounding: ['4','6'] },
  { char: '6', surrounding: ['3','5','9'] }, { char: '7', surrounding: ['4','8'] }, { char: '8', surrounding: ['7','9'] },
  { char: '9', surrounding: ['8','0','6'] }, { char: '0', surrounding: ['9','8'] }
]

module.exports = () => {
  // Générer tout les caractères
  let code = ''
  for(let i = 0; i < 5; i++){
    if(!code) code += alphabet[Math.floor(Math.random() * alphabet.length)].char
    else {
      let lastChar = code[code.length - 1]
      let lastCharIndex = alphabet.findIndex(char => char.char === lastChar)
      let surrounding = alphabet[lastCharIndex].surrounding
      let char = surrounding[Math.floor(Math.random() * surrounding.length)]
      code += char
    }
  }

  return code
}