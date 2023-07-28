const btnSave = document.querySelector(".btn-save");
const listData = document.querySelector(".cards-area");
const btnCreate = document.querySelector(".btn-create");
const closeModal = document.querySelector(".btn-close");
const closeBtn = document.getElementById('close');
const minimizeBtn = document.getElementById('minimize');
const restaureBtn = document.getElementById('restaure');
let interval;
let time = 0
let startedTime;

function setNewCard(cards, timeRecords = [])
{
    cards.map(card =>
    {
        let trElements = '';

        if (timeRecords.length) {
            trElements = timeRecords
                .filter(time => card.id === time.atividade_id)
                .map(time =>
                    `<tr id="${time.id}">
                        <td class="date">${time.date || ''}</td>
                        <td class="started-time">${time.start || ''}</td>
                        <td class="ended-time">${time.end || ''}</td>
                        <td class="total-time">${time.total || ''}</td>
                        <td>
                            <button class="delete-time"></button>
                        </td>
                    </tr>`
                );
        }

        const newCard = document.createElement('div');
        newCard.classList.add("card")

        newCard.innerHTML = `
            <div class="card-container">
                <button class="btn-delete"></button>
                <div class="card-content">
                    <div class="card-body">
                        <div class="card-identifier">
                            <p class="issue">${card.card}</p>
                            <h3 class="name">${card.name}</h3>
                        </div>
                        <div class="card-functions">
                            <div class="timer"><span>00</span><div class="separator">:</div><span>00</span><div class="separator">:</div><span>00</span></div>
                            <button class="time-record"></button>
                        </div>
                    </div>
                    <div class="historic-container">
                        <table class="historic-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Início</th>
                                    <th>Término</th>
                                    <th>Tempo total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${trElements.length ? trElements.join('') : ''}
                            </tbody >
                        </table >
                    </div >
                </div >
                <button class="show-historic"></button>
            </div >
        `

        listData.append(newCard);

        const btnActions = newCard.querySelector(".time-record")
        const btnHistoric = newCard.querySelector(".show-historic")
        const btnDeleteCard = newCard.querySelector(".btn-delete")


        btnActions.addEventListener("click", () => handleTimeRegister(btnActions, card.id))
        btnHistoric.addEventListener("click", () => handleHistoricCard(btnHistoric))
        btnDeleteCard.addEventListener("click", () => handleDeleteCard(btnDeleteCard, card.id))
    })
}

// Função para registrar novo card
btnSave.addEventListener('click', function registerNewCard()
{

    let name = this.closest(".modal-container").querySelector(".card-name")
    let card = this.closest(".modal-container").querySelector('.jira-issue')

    electronAPI.db.registerCard(name.value, card.value);

    document.querySelector('body').classList.remove("modal-active")

    name.value = ""
    card.value = ""
})

// Retornar novo card criado
electronAPI.db.lastAddedCard((data) =>
{
    if (data.length) {
        setNewCard(data)
    } else {
        console.log('opa')
    }
});

// Deletar um card e todos os seus registros
function handleDeleteCard(target, id)
{
    const card = target.closest(".card");

    if (target.classList.contains("confirm-deletion")) {
        electronAPI.db.deleteCard(id);
        card.remove();
    }

    target.classList.add('confirm-deletion')

    target.addEventListener('mouseleave', function ()
    {
        if (this.classList.contains('confirm-deletion')) {
            this.classList.remove('confirm-deletion')
        }
    })
}

function setHistoricContainerHeight(container)
{
    const historicTableHeight = container.querySelector(".historic-table").offsetHeight;
    container.style.height = `${historicTableHeight}px`;
}

// Mostrar o histórico de registros de um card
function handleHistoricCard(target)
{
    const card = target.closest(".card");
    const historic = card.querySelector(".historic-container");

    if (card.classList.contains("historic-active")) {
        card.classList.remove("historic-active");
        historic.style.height = "0";
    } else {
        card.classList.add("historic-active");
        setHistoricContainerHeight(historic)
    }
}

// Cronômetro
function updateTimer(timer)
{
    time += 1000;
    const hours = Math.floor(time / 3600000);
    const minutes = Math.floor((time % 3600000) / 60000);
    const seconds = Math.floor((time % 60000) / 1000);

    timer.innerHTML = `<span span > ${hours < 10 ? '0' : ''}${hours}</span ><div class="separator">:</div><span>${minutes < 10 ? '0' : ''}${minutes}</span><div class="separator">:</div><span>${seconds < 10 ? '0' : ''}${seconds}</span>`;
}

function checkIfFirstChild(element)
{
    var container = element.parentNode;
    var firstChild = container.firstElementChild;

    return element === firstChild;
}

function moveCardToTop(clickedCard)
{
    const allCards = document.querySelectorAll(".card")
    allCards.forEach((card, cardIndex) =>
    {
        if (card === clickedCard) {
            console.log(`-${(cardIndex) * 65}`)
            clickedCard.style.transform = `translateY(-${(cardIndex) * 73}px)`;

            setTimeout(() =>
            {
                clickedCard.closest('.cards-area').insertBefore(clickedCard, clickedCard.closest('.cards-area').firstChild);
                clickedCard.style.transform = '';
            }, 300);
        }
    })
}

function handleTimeRegister(target, id)
{
    const card = target.closest(".card")
    const tBody = card.querySelector("tbody");
    const timer = card.querySelector(".timer")
    const getCurrentDataTime = new Date();
    const day = getCurrentDataTime.getDate();
    const month = getCurrentDataTime.getMonth() + 1;
    const year = getCurrentDataTime.getFullYear();
    const hour = getCurrentDataTime.getHours();
    const minutes = getCurrentDataTime.getMinutes();
    const currentDate = `${day < 10 ? '0' : ''}${day}/${month < 10 ? '0' : ''}${month}/${year} `;
    const trElement = document.createElement("tr");
    time = 0;

    if (!card.classList.contains("started")) {
        interval = setInterval(() =>
        {
            updateTimer(timer)
        }, 1000);

        card.classList.add("started")

        startedTime = `${hour < 10 ? '0' : ''}${hour}:${minutes < 10 ? '0' : ''}${minutes}`

        trElement.innerHTML = `
            <td class="date"> ${currentDate}</td >
            <td class="started-time">${startedTime}</td>
            <td class="ended-time"></td>
            <td class="total-time"></td>
            <td>
                <button class="delete-time none"></button>
            </td>
        `

        tBody.append(trElement)

        if (!checkIfFirstChild(card)) {
            moveCardToTop(card);
        }

        if (card.classList.contains("historic-active")) {
            setHistoricContainerHeight(card.querySelector(".historic-container"))
        }

    } else {
        clearInterval(interval)
        const spendedTime = `${timer.textContent}`
        const finishedTime = `${hour < 10 ? '0' : ''}${hour}:${minutes < 10 ? '0' : ''}${minutes}`
        let endedTime = target.closest(".card").querySelectorAll(".ended-time")
        let totalTime = target.closest(".card").querySelectorAll(".total-time")
        endedTime = endedTime[endedTime.length - 1]
        totalTime = totalTime[totalTime.length - 1]

        totalTime.innerHTML = spendedTime
        endedTime.innerHTML = finishedTime
        timer.innerHTML = `<span>00</span ><div class="separator">:</div><span>00</span><div class="separator">:</div><span>00</span>`;

        electronAPI.db.updateActivityData(id, currentDate, startedTime, finishedTime, spendedTime);
        electronAPI.db.onLastAddedTime((lastId) =>
        {
            totalTime.closest("tr").setAttribute("id", lastId)
        });

        card.classList.remove("started")
        totalTime.closest("tr").querySelector(".delete-time").classList.remove("none")
    }
}

function handleDeleteTime(target)
{
    const historicContainer = target.closest(".card").querySelector(".historic-container");
    const tr = target.closest('tr')
    const id = tr.getAttribute('id')

    if (!tr.classList.contains("delete-active")) {
        tr.classList.add("delete-active")
    } else {
        tr.remove();
        electronAPI.db.deleteTime(id)
        setHistoricContainerHeight(historicContainer)
    }

    target.addEventListener('mouseleave', function ()
    {
        if (tr.classList.contains('delete-active')) {
            tr.classList.remove('delete-active')
        }
    })
}

listData.addEventListener("click", function (event)
{
    const target = event.target;

    if (target.classList.contains("delete-time")) {
        handleDeleteTime(target)
    }
});


btnCreate.addEventListener("click", function ()
{
    document.querySelector("body").classList.add("modal-active");
})

closeModal.addEventListener("click", function ()
{
    document.querySelector("body").classList.remove("modal-active");
})

closeBtn.addEventListener("click", () =>
{
    electronAPI.closeApp()
})

minimizeBtn.addEventListener("click", () =>
{
    electronAPI.minimizeApp()
})

restaureBtn.addEventListener("click", () =>
{
    electronAPI.restaureApp()
})

electronAPI.onMaximizedApp(() =>
{
    restaureBtn.style.backgroundImage = `url("images/ico-restaure-app.svg")`
    restaureBtn.style.backgroundSize = `16px`
})

electronAPI.onRestauredApp(() =>
{
    restaureBtn.style.backgroundImage = `url("images/ico-maximize-app.svg")`
    restaureBtn.style.backgroundSize = `18px`
})

// Chamada para recuperar os dados dos cards
electronAPI.db.getCardData();

electronAPI.db.onRecoveredCardData((cards) =>
{
    electronAPI.db.getTimeRecords()

    electronAPI.db.onRetrievedTimeRecords((timeRecords) =>
    {
        setNewCard(cards, timeRecords)
    })
});

// function gerarPlanilha()
// {
//     electronAPI.db.inserirDados('Projeto X', new Date().toLocaleDateString());
// }

// document.querySelector('.btn-create').addEventListener('click', gerarPlanilha)
