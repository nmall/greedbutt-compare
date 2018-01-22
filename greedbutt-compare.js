// ==UserScript==
// @name         Greedbutt Player Compare
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adds an interface to compare 2 BoI Greed run scores
// @author       dfautomaton
// @match        https://greedbutt.com/plus/score/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const PLAYER_SEARCH_URL = '/search/';
    const PLAYER_PLUS_URL = '/plus/player/';
    const DEBUG = true;

    const debug = str => {
        if(DEBUG) {
            console.log(str);
        }
    };

    const call = (method, url, onSuccess, onFailure, body) => {
        let request = new XMLHttpRequest();
        request.open(method, url, true);
        request.onload = () => {
            if(request.status >= 200 && request.status < 400){
                onSuccess && onSuccess(request);
            }
            else {
                onFailure && onFailure(request);
            }
        };
        request.send(body);
    };

    const get = (url, onSuccess, onFailure) => {
        debug('get');
        call('GET', url, onSuccess, onFailure);
    };

    const post = (url, body, onSuccess, onFailure) => {
        debug('get');
        call('POST', url, onSuccess, onFailure, body);
    };

    const getUserId = (username, callback) => {
        debug('getUserId');
        get(PLAYER_SEARCH_URL + username,
            request => {
                debug('got user id')
                if(request.status === 200) {
                    const userId = request.responseURL.substring(request.responseURL.lastIndexOf('/') + 1);
                    debug(userId);
                    callback && callback(userId);
                }
            },
            request => {
                alert('Invalid Player: ' + username);
            });
    };

    const getPlayerPage = (callback, userId) => {
        const url = PLAYER_PLUS_URL + userId;
        debug(url);
        get(url, request => {
            debug('got player page');
            const playerPageData = request.responseText;
            callback && callback(playerPageData);
        }, request => {
            alert('Failed fetching player plus page: ' + url);
        })
    }

    const getPlayerDatePage = (date, callback, playerPageData) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = playerPageData;

        const dates = tempDiv.getElementsByClassName('date');

        let dateIndex = -1;
        for(let i = 0; i < dates.length; i++) {
            if(dates[i].innerText.trim() === date) {
                dateIndex = i;
                break;
            }
        }

        if(dateIndex === -1) {
            alert('Date for player not available (too old?): ' + date);
            return;
        }

        const scoreDiv = tempDiv.getElementsByClassName('score')[dateIndex * 2]
        const scoreUrl = scoreDiv.getElementsByTagName('a')[0].getAttribute('href')
        get(scoreUrl, request => {
            debug('got score page')
            callback && callback(request.responseText);
        }, request => {
            alert('Failed fetching score data: ' + date);
        })

    }

    const getRankElem = div => div.getElementsByClassName('text-center')[0].getElementsByTagName('a')[0];
    const getTotalElem = div => div.getElementsByClassName('total-value')[0];
    const getTimeElem = div => div.getElementsByClassName('time-value')[0];
    const getStageBonusElem = div => div.getElementsByClassName('score-value')[0]
    const getExplorationBonusElem = div => div.getElementsByClassName('score-value')[1]
    const getSchwagBonusElem = div => div.getElementsByClassName('score-value')[2]
    const getDamagePenaltyElem = div => div.getElementsByClassName('score-value')[3]
    const getTimePenaltyElem = div => div.getElementsByClassName('score-value')[4]
    const getItemPenaltyElem = div => div.getElementsByClassName('score-value')[5]

    const getRank = div => {
        const rankStr = getRankElem(div).innerText
        return rankStr.substring(rankStr.indexOf('#') + 1, rankStr.indexOf(',')).trim();
    }
    const getTotal = div => getTotalElem(div).innerText.trim();
    const getTime = div => getTimeElem(div).innerText.trim();

    const parsePlayerData = (callback, runPageData) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = runPageData;

        const scoreValues = tempDiv.getElementsByClassName('score-value');

        const data = {
            rank:             getRank(tempDiv),
            stageBonus:       getStageBonusElem(tempDiv).textContent.trim(),
            explorationBonus: getExplorationBonusElem(tempDiv).textContent.trim(),
            schwagBonus:      getSchwagBonusElem(tempDiv).textContent.trim(),
            damagePenalty:    getDamagePenaltyElem(tempDiv).textContent.trim(),
            timePenalty:      getTimePenaltyElem(tempDiv).textContent.trim(),
            itemPenalty:      getItemPenaltyElem(tempDiv).textContent.trim(),
            total:            getTotal(tempDiv),
            time:             getTime(tempDiv)
        };

        callback && callback(data);
    }

    const writeDiffData = compareData => {
        const mungeVal = stringVal => parseInt(stringVal.trim().replace(/,/g, ""), 10);

        const writeDiff = (elem, sourceVal, compareVal) => {
            sourceVal = mungeVal(sourceVal);
            compareVal = mungeVal(compareVal);

            const diffDiv = document.createElement('span');
            if(sourceVal < compareVal){
                diffDiv.classList.add('less-than')
            }
            else {
                diffDiv.classList.add('greater-than')
            }
            diffDiv.textContent = sourceVal - compareVal;

            elem.insertAdjacentElement('afterend', diffDiv);
        }

        const rankElem = getRankElem(document);
        writeDiff(rankElem, getRank(document), compareData.rank);

        const totalElem = getTotalElem(document);
        writeDiff(totalElem, getTotal(document), compareData.total);

        const timeElem = getTimeElem(document);
        writeDiff(timeElem, getTime(document), compareData.time);

        const stageBonusElem = getStageBonusElem(document);
        writeDiff(stageBonusElem, stageBonusElem.textContent, compareData.stageBonus);

        const explorationBonusElem = getExplorationBonusElem(document);
        writeDiff(explorationBonusElem, explorationBonusElem.textContent, compareData.explorationBonus);

        const schwagBonusElem = getSchwagBonusElem(document);
        writeDiff(schwagBonusElem, schwagBonusElem.textContent, compareData.schwagBonus);

        const damagePenaltyElem = getDamagePenaltyElem(document);
        writeDiff(damagePenaltyElem, damagePenaltyElem.textContent, compareData.damagePenalty);

        const timePenaltyElem = getTimePenaltyElem(document);
        writeDiff(timePenaltyElem, timePenaltyElem.textContent, compareData.timePenalty);

        const itemPenaltyElem = getItemPenaltyElem(document);
        writeDiff(itemPenaltyElem, itemPenaltyElem.textContent, compareData.itemPenalty);
    }

    const lessThanClass = document.createElement('style');
    lessThanClass.type = 'text/css';
    lessThanClass.innerHTML = '.less-than { display: flex; margin-left: 20px; color: red; }'
    document.head.appendChild(lessThanClass);

    const greaterThanClass = document.createElement('style');
    greaterThanClass.type = 'text/css';
    greaterThanClass.innerHTML = '.greater-than { display: flex; margin-left: 20px; color: green; }'
    document.head.appendChild(greaterThanClass);

    const bodyContainer = document.getElementsByClassName('container')[0];
    const scoreDateContainer = bodyContainer.getElementsByClassName('score-date')[0]
    const scoreDate = scoreDateContainer.children[0].href.substring(scoreDateContainer.children[0].href.lastIndexOf('/') + 1);

    const inputContainer = document.createElement('div');
    inputContainer.classList.add('inputContainer');

    const input = document.createElement('input');
    input.id = 'compareInput';

    const inputLabel = document.createElement('label');
    inputLabel.htmlFor = input.id;
    inputLabel.textContent = 'Player Name:';

    inputContainer.appendChild(inputLabel);
    inputLabel.appendChild(input);

    const compareButton = document.createElement('button');
    compareButton.textContent = 'Compare';
    compareButton.addEventListener('click', event => {
        debug('click');
        getUserId(input.value,
            getPlayerPage.bind(this,
                getPlayerDatePage.bind(this, scoreDate,
                    parsePlayerData.bind(this,
                        writeDiffData)))
        );
    });

    inputLabel.appendChild(compareButton);

    bodyContainer.prepend(inputContainer);

})();
