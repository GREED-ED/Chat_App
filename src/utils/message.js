const generateText = (username, text) =>{
    return {
        username,
        text,
        createdAt: new Date().getTime()
    }
}

const generateLocation = (username, url) =>{
    return {
        username,
        url,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateText,
    generateLocation
}