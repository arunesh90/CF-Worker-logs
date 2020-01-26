const simpleId = (length: number) => {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNPQRSTUVWXYZ0123456789'
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

export default simpleId
