'use strict'

const GAME_STATE = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatchFailed: "CardsMatchFailed",
  CardsMatched: "CardsMatched",
  GameFinished: "GameFinished",
}

const Symbol = [
  'https://image.flaticon.com/icons/svg/105/105223.svg', //黑桃
  'https://image.flaticon.com/icons/svg/105/105220.svg', //愛心
  'https://image.flaticon.com/icons/svg/105/105212.svg', //方塊
  'https://image.flaticon.com/icons/svg/105/105219.svg'  //梅花
]


//所有函式庫
//MVC(Model-View-Control) ---

// View
//負責管理頁面的函式庫
const view = {
  //取得卡片該有的元素
  getCardElement(index) {
    return `<div data-index="${index}" class="card back"></div>`
  },

  getCardContent(index) {
    const number = this.transformNumber((index % 13) + 1)
    const symbol = Symbol[Math.floor(index / 13)]

    return `
    <p>${number}</p>
    <img src="${symbol}">
    <p>${number}</p>
    `
  },

  //撲克牌特殊字轉換
  transformNumber(number) {
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },

  //將洗好的牌放上牌桌
  displayCards(indexes) {
    const rootElement = document.querySelector('#cards')
    //map迭代，將陣列中的值一一帶入執行
    //join，合併成一份大字串，之後template用
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join("")
  },

  //翻牌
  flipCards(...cards) {
    cards.map(card => {
      //if/else的變形
      //return first用法
      //若卡片目前是背面便先執行並且終止if迴圈，否則便執行下面程式
      if (card.classList.contains("back")) {
        //回傳正面
        card.classList.remove("back")
        card.innerHTML = this.getCardContent(Number(card.dataset.index))
        return
      }
      //回傳背面
      card.classList.add("back")
      card.innerHTML = null
    })
  },

  //配對成功的牌
  pairCards(...cards) {
    cards.map(card => {
      card.classList.add("paired")
    })
  },

  renderScore(score) {
    document.querySelector('.score').innerHTML = `Score: ${score}`
  },

  renderTriedTimes(times) {
    document.querySelector('.tried').innerHTML = `You've tried ${times} times.`
  },

  // 事件執行一次後，就卸載此監聽器
  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      card.addEventListener('animationend', event => event.target.classList.remove('wrong'), { once: true })
    })
  },

  showGameFinished() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `
    const header = document.querySelector('#header')
    header.before(div)
  }
}

//Model
//負責管理資料的函式庫
const model = {
  score: 0,
  triedTimes: 0,
  revealedCards: [],
  isRevealedCardsMatched() {
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  }
}

//Controller
//負責管理流程的函式庫
const controller = {
  currentState: GAME_STATE.FirstCardAwaits,

  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52))
  },

  dispatchCardAction(card) {
    if (!card.classList.contains('back')) {
      return
    }
    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break
      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes(++model.triedTimes)
        view.flipCards(card)
        model.revealedCards.push(card)
        //進行判斷配對是否成功
        if (model.isRevealedCardsMatched()) {
          //成功配對
          view.renderScore(model.score += 10)
          this.currentState = GAME_STATE.CardsMatched
          view.pairCards(...model.revealedCards)
          model.revealedCards = []
          if (model.score === 260) {
            console.log('showGameFinished!')
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()
            return
          }
          this.currentState = GAME_STATE.FirstCardAwaits
        } else {
          //配對失敗
          this.currentState = GAME_STATE.CardsMatchFailed
          view.appendWrongAnimation(...model.revealedCards)
          //瀏覽器提供API，內建計時器
          setTimeout(this.resetCards, 1000)
        }
        break
    }
    console.log('revealedCards', model.revealedCards.map(card => card.dataset.index))
  },

  resetCards() {
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    controller.currentState = GAME_STATE.FirstCardAwaits
  }
}

//外掛函式庫
const utility = {
  //隨機洗牌
  getRandomNumberArray(count) {
    //Array.from(Array(52).keys()) 產生包含0~51的陣列
    const number = Array.from(Array(count).keys())
    for (let index = number.length - 1; index > 0; index--) {
      //index -> 最後一張牌, randomIndex -> 隨機放入牌組的位址
      let randomIndex = Math.floor(Math.random() * (index + 1))
        //解構賦值
        //將最後一張牌隨機放進牌組裡
        // ; 代表: 這個執行語句結束了!
        //為了將前面的 Math.floor()和[]隔開
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    return number
  }
}

//指令使用區
controller.generateCards()

//事件監聽區
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => {
    controller.dispatchCardAction(card)
  })
})