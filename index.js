const Wordle = require("./wordle")
const Toastify = require("toastify-js")

const numberOfGuesses = 6
const timeRelaunchInSec = 10

let instance = null
let leaderboard = {}
let channelName = ''

function displayLeaderboard(winner) {
    let list = Object.entries(leaderboard)
        .map(([player, score]) => {
            return {player: player, score: score }
        })
        .sort((a, b) => b.score - a.score)
        .map((entry) => `<li><strong>${entry.player}</strong> : ${entry.score} points</li>`)
        .slice(0, 10)
        .toString()
        .replace(',', '')

    let leaderText = `<h1>🏆 LEADERBOARD</h1><ol>${list}</ol><p>⏱️ Prochain mot dans 10s...</p>`

    Toastify({
        text: leaderText,
        duration: timeRelaunchInSec * 1000,
        newWindow: true,
        className: "toast-leaderboard",
        escapeMarkup: false,
        gravity: "top", // `top` or `bottom`
        position: "center", // `left`, `center` or `right`
        callback: () => instance.initBoard(numberOfGuesses)
    }).showToast()
}

window.addEventListener('onWidgetLoad', (obj) => {
    instance = new Wordle({numberOfGuesses: numberOfGuesses})
    channelName = obj.detail.channel.username.toLowerCase()
    instance.getEventDispatcher().addEventListener('success', event => {
        leaderboard[event.detail.winner] = leaderboard[event.detail.winner] ? leaderboard[event.detail.winner] : 0
        leaderboard[event.detail.winner] += (numberOfGuesses - event.detail.tries)
        displayLeaderboard(event.detail.winner)
    })
    instance.getEventDispatcher().addEventListener('failure', event => {
        Toastify({
            text: event.detail.message,
            duration: 2 * 1000,
            newWindow: true,
            className: "toast-error",
            gravity: "top", // `top` or `bottom`
            position: "center" // `left`, `center` or `right`
        }).showToast()
        setTimeout(() => instance.initBoard(numberOfGuesses), timeRelaunchInSec * 1000)
        displayLeaderboard()
    })
    instance.getEventDispatcher().addEventListener('error', event => {
        Toastify({
            text: event.detail.message,
            duration: 2 * 1000,
            newWindow: true,
            className: "toast-error",
            gravity: "top", // `top` or `bottom`
            position: "center" // `left`, `center` or `right`
        }).showToast()
    })
})

window.addEventListener('onEventReceived', (obj) => {
   if (obj.detail.listener !== "message") return
   let data = obj.detail.event.data
   const player = data["displayName"].toLowerCase()
   if (player == "streamelements") return
   
   let message = data["text"]
   //channel author can reset
   if (message.toLowerCase() === '!reset' && player === channelName) instance.initBoard(numberOfGuesses)
   if (message.length != 5) return //no need to check if the word is not 5 letter
   instance.checkGuess(message, player)
})
