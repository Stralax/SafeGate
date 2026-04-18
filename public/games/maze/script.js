if (typeof window !== 'undefined') {

    let tileWidth = 16;
    let tileHeight = 16;
    let gridWidth = 32;
    let gridHeight = 32;
    let gridStartX = 60;
    let gridStartY = 100;
    let mousePosition = { x: 0, y: 0 };
    let hoverTileX = 0;
    let hoverTileY = 0;
    let drawType = 1;
    let isMouseDown = false;
    let isCtrlDown = false;
    let tileMap = [];
    let validateTimeout;
    let currentSpecialTile = 2;
    let pathError = "";
    let gameStartTileX = -1;
    let gameStartTileY = -1;
    let gameExitTileX = -1;
    let gameExitTileY = -1;
    let gameCursorWidth = 8;
    let gameCursorHeight = 8;
    let appState = 0;
    let gameState = 0;
    let states_editor = 0;
    let states_preview = 1;
    let states_game = 2;
    let gameStates_notStarted = 0;
    let gameStates_started = 1;
    let _wall_tile = 0;
    let _path_tile = 1;
    let _start_tile = 2;
    let _end_tile = 3;


    let gameWinImageIndex = 0;
    let gameWinSoundIndex = 0;


    // ---- Lives & Timer system ----
    const TIME_LIMIT = 30;
    let livesRemaining = 3;
    let gameStartTime = null;
    let timerInterval = null;
    let isBanned = false;


    let availableImages = [
        '//www.scaryforkids.com/pics/scary-movie.jpg',
        '//orion-uploads.openroadmedia.com/lg_380efe-pennywiseweb.jpg',
        '//yt3.ggpht.com/-wT3VNeh42u0/AAAAAAAAAAI/AAAAAAAAAAA/yuwi_GW69dI/s900-c-k-no-mo-rj-c0xffffff/photo.jpg',
        '//media.giphy.com/media/LLHkw7UnvY3Kw/giphy.gif'
    ];


    let availableSounds = [
        new Audio('https://www.dropbox.com/s/ari3xr2h05a7lwz/sound_01.mp3?raw=1'),
    ];


    availableSounds[0].volume = 0.3;
    gameWinImageUrl = availableImages[gameWinImageIndex];
    gameWinSound = availableSounds[gameWinSoundIndex];
    let gameView = document.querySelector(".game");
    let menuView = document.querySelector(".menu");
    let editorUI = document.querySelector(".editor-ui");
    let gameUI = document.querySelector(".game-ui");
    let mapDataInput = document.querySelector(".input-data");
    let gameStartBtn = document.querySelector(".btn-start");
    let gameWinImage = document.querySelector(".image-overlay");
    let gameLoseDisplay = document.querySelector(".lose-overlay");
    let gameWinDisplay = document.querySelector(".win-overlay");
    let canvas = document.querySelector(".le-canvas");
    let ctx = canvas.getContext("2d");
    updateCanvasSize();
    window.addEventListener('mousemove', evt => {
        mousePosition = getMousePos(canvas, evt);
    }, false);
    canvas.addEventListener('contextmenu', evt => {
        evt.preventDefault();
        toggleSpecialTileType();
    }, false);
    canvas.addEventListener('mousedown', evt => {
        if (evt.which !== 1) return;
        isMouseDown = true;
    }, false);
    canvas.addEventListener('mouseup', evt => isMouseDown = false, false);
    canvas.addEventListener('click', evt => mouseClick(), false);
    window.addEventListener('resize', updateCanvasSize, false);
    window.addEventListener('keydown', evt => {
        isCtrlDown = evt.ctrlKey;
        switch (evt.which) {
            case 49: drawType = 1; break;
            case 50: drawType = 2; break;
            case 51: drawType = 3; break;
        }
    }, false);
    window.addEventListener('keyup', evt => isCtrlDown = evt.ctrlKey, false);


    function updateCanvasSize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gridStartX = canvas.width / 2 - ((gridWidth * tileWidth) / 2);
        gridStartY = Math.max(120, canvas.height / 2 - ((gridHeight * tileHeight) / 2));
        updateStartTriggerPosition();
    }


    function toggleSpecialTileType() {
        if (appState !== states_editor) return;
        if (hoverTileY >= 0 && hoverTileY < gridHeight && hoverTileX >= 0 && hoverTileX < gridWidth) {
            setCurrentTile(currentSpecialTile);
        }
    }


    function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
    }


    function setup() {
        for (let y = 0; y < gridHeight; ++y) {
            let row = [];
            for (let x = 0; x < gridWidth; ++x) row.push(0);
            tileMap.push(row);
        }
    }


    function mouseClick() {}


    function loop(e) {
        update(e);
        render();
        window.requestAnimationFrame(loop);
    } window.requestAnimationFrame(loop);
    setup();


    function clear() {
        ctx.fillStyle = '#151d26';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }


    function render() {
        clear();
        if (appState === states_editor) {
            renderEditorGrid();
            renderEditorUI();
        }
        if (appState === states_game || appState === states_preview) {
            renderGameGrid();
            renderGameUI();
        }
    }


    function update(elapsed) {
        let mX = mousePosition.x - gridStartX;
        let mY = mousePosition.y - gridStartY;
        hoverTileX = Math.floor(mX / tileWidth);
        hoverTileY = Math.floor(mY / tileHeight);
        if (appState === states_editor) {
            if (isMouseDown === true) {
                if (hoverTileY >= 0 && hoverTileY < gridHeight && hoverTileX >= 0 && hoverTileX < gridWidth) {
                    let tileType = drawType;
                    if (isCtrlDown === true) tileType = 0;
                    setCurrentTile(tileType);
                }
            }
        } else if (gameState === gameStates_started) {
            let x1 = mousePosition.x - gridStartX + gameCursorWidth;
            let y1 = mousePosition.y - gridStartY + gameCursorHeight;
            let gameCursorX = Math.floor(x1 / tileWidth);
            let gameCursorY = Math.floor(y1 / tileHeight);
            if (withinGameBoard(hoverTileX, hoverTileY)) {
                let currentTile = tileMap[hoverTileY][hoverTileX];
                validateGameTile(currentTile);
            }
            if (withinGameBoard(gameCursorX, gameCursorY)) {
                let currentTile = tileMap[gameCursorY][gameCursorX];
                if (currentTile === _wall_tile) gameOverLose();
            }
            if (withinGameBoard(hoverTileX, gameCursorY)) {
                let currentTile = tileMap[gameCursorY][hoverTileX];
                if (currentTile === _wall_tile) gameOverLose();
            }
        }
    }


    function withinGameBoard(x, y) {
        return y >= 0 && y < gridHeight && x >= 0 && x < gridWidth;
    }


    function validateGameTile(tile) {
        if (tile === _wall_tile) {
            gameOverLose();
        } else if (tile === _end_tile) {
            gameOverWin();
        }
    }


    function setCurrentTile(tileType) {
        if (tileType === _wall_tile || tileType === _path_tile) {
            if (gameExitTileX === hoverTileX && gameExitTileY === hoverTileY) { gameExitTileX = -1; gameExitTileY = -1; }
            if (gameStartTileX === hoverTileX && gameStartTileY === hoverTileY) { gameStartTileX = -1; gameStartTileY = -1; }
        }
        if (tileType === _start_tile) {
            if (gameStartTileX !== -1 && gameStartTileY !== -1) tileMap[gameStartTileY][gameStartTileX] = _path_tile;
            if (gameExitTileX === hoverTileX && gameExitTileY === hoverTileY) { gameExitTileX = -1; gameExitTileY = -1; }
            currentSpecialTile = _end_tile;
            gameStartTileX = hoverTileX;
            gameStartTileY = hoverTileY;
        }
        if (tileType === _end_tile) {
            if (gameExitTileX !== -1 && gameExitTileY !== -1) tileMap[gameExitTileY][gameExitTileX] = _path_tile;
            if (gameStartTileX === hoverTileX && gameStartTileY === hoverTileY) { gameStartTileX = -1; gameStartTileY = -1; }
            currentSpecialTile = _start_tile;
            gameExitTileX = hoverTileX;
            gameExitTileY = hoverTileY;
        }
        tileMap[hoverTileY][hoverTileX] = tileType;
        if (gameStartTileX !== -1 && gameExitTileX !== -1) {
            clearTimeout(validateTimeout);
            validateTimeout = setTimeout(() => validateMaze(() => pathError = "", err => pathError = err), 1000);
        }
    }


    function fillTextWrapped(text, x, y, maxWidth, lineHeight) {
        let words = text.split(' ');
        let line = '';
        for (var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + ' ';
            var metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) { ctx.fillText(line, x, y); line = words[n] + ' '; y += lineHeight; }
            else line = testLine;
        }
        ctx.fillText(line, x, y);
    }


    function renderGameGrid() {
        ctx.lineWidth = 1;
        for (let y = 0; y < gridHeight; ++y) {
            for (let x = 0; x < gridWidth; ++x) {
                let renderX = gridStartX + x * tileWidth;
                let renderY = gridStartY + y * tileHeight;
                let tile = tileMap[y][x];
                ctx.strokeStyle = 'rgba(24, 42, 60, 1.0)';
                ctx.fillStyle = getTileColor(tile);
                ctx.beginPath();
                ctx.moveTo(renderX, renderY);
                ctx.lineTo(renderX + tileWidth, renderY);
                ctx.lineTo(renderX + tileWidth, renderY + tileHeight);
                ctx.lineTo(renderX, renderY + tileHeight);
                ctx.lineTo(renderX, renderY);
                if (tile === 0) ctx.stroke();
                ctx.fill();
            }
        }
    }


    function renderGameUI() {
        ctx.font = '10pt FontAwesome';
        ctx.fillStyle = 'white';
        ctx.fillRect(mousePosition.x, mousePosition.y, gameCursorWidth, gameCursorHeight);
        ctx.fillText("\uF11e", gameExitTileX * tileWidth + gridStartX + 1, gameExitTileY * tileHeight + gridStartY + (tileHeight - 4));
    }


    function renderEditorUI() {
        let x = 20; let y = 20;
        ctx.font = '12pt Calibri'; ctx.fillStyle = 'white';
        ctx.fillText(`Select the tile to paint with the numpad 1-3`, x, y);
        ctx.fillText(`You will need to have one Start point and one Exit point`, x, y += 20);
        ctx.font = '9pt Calibri'; ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText(`Start and Exit points can easily be plotted with a right-click`, x, y += 20);
        ctx.font = '12pt Calibri'; ctx.fillStyle = 'white';
        ctx.fillText(`Selected tile`, x, y += 40);
        if (drawType === 1) ctx.fillStyle = 'red';
        ctx.fillText(`  1: Path`, x, y += 20); ctx.fillStyle = 'white';
        if (drawType === 2) ctx.fillStyle = 'red';
        ctx.fillText(`  2: Start/Entry Point`, x, y += 20); ctx.fillStyle = 'white';
        if (drawType === 3) ctx.fillStyle = 'red';
        ctx.fillText(`  3: End/Exit Point`, x, y += 20); ctx.fillStyle = 'white';
        if (isCtrlDown === true) ctx.fillStyle = 'red';
        ctx.fillText(`Hold CTRL to draw walls`, x, y += 40); ctx.fillStyle = 'white';
        if (pathError && pathError.length > 0) { ctx.fillStyle = 'rgba(192, 57, 43,1.0)'; fillTextWrapped(pathError, x, y += 20, 300, 20); }
    }


    function renderEditorGrid() {
        ctx.lineWidth = 1;
        for (let y = 0; y < gridHeight; ++y) {
            for (let x = 0; x < gridWidth; ++x) {
                let renderX = gridStartX + x * tileWidth;
                let renderY = gridStartY + y * tileHeight;
                let isMouseOver = x === hoverTileX && y === hoverTileY;
                let tile = tileMap[y][x];
                ctx.strokeStyle = 'rgba(24, 42, 60, 1.0)';
                ctx.fillStyle = getTileColor(tile);
                ctx.beginPath();
                ctx.moveTo(renderX, renderY); ctx.lineTo(renderX + tileWidth, renderY);
                ctx.lineTo(renderX + tileWidth, renderY + tileHeight); ctx.lineTo(renderX, renderY + tileHeight);
                ctx.lineTo(renderX, renderY);
                if (tile === 0) ctx.stroke();
                ctx.fill();
                if (isMouseOver === true) {
                    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.fillStyle = 'rgba(0,0,0,0.3)';
                    ctx.beginPath();
                    ctx.moveTo(renderX, renderY); ctx.lineTo(renderX + tileWidth, renderY);
                    ctx.lineTo(renderX + tileWidth, renderY + tileHeight); ctx.lineTo(renderX, renderY + tileHeight);
                    ctx.lineTo(renderX, renderY);
                    if (tile === 0) ctx.stroke();
                    ctx.fill();
                }
            }
        }
    }


    function getTileColor(type) {
        if (type === 0) return 'rgba(52, 73, 94, 1.0)';
        if (type === 1) return 'rgba(14, 32, 50, 0.5)';
        if (appState === states_editor) {
            if (type === 2) return 'rgba(14, 142, 40, 0.8)';
            if (type === 3) return 'rgba(142, 14, 40, 0.8)';
        } else if (type === 3) return 'rgba(0, 0, 0, 0.8)';
        return 'rgba(14, 32, 50, 0.5)';
    }


    function toggleMapData() {
        let elm = document.querySelector(".map-data");
        elm.innerHTML = elm.innerHTML !== '' ? '' : encodeMapData();
    }


    function encodeMapData() {
        let mapstr = `${gridWidth}, ${gridHeight}, ${gameWinImageIndex}, ${gameWinSoundIndex}`;
        for (let y = 0; y < tileMap.length; ++y) {
            let rowData = ''; let column = -1; let columnCount = 0;
            for (let x = 0; x < tileMap[y].length; ++x) {
                if (column !== tileMap[y][x]) {
                    if (column !== -1) rowData += columnCount === 1 ? `, ${column}` : `, ${columnCount}x${column}`;
                    column = tileMap[y][x]; columnCount = 1;
                } else columnCount++;
            }
            mapstr += rowData + (columnCount === 1 ? `, ${column}` : `, ${columnCount}x${column}`);
        }
        return mapstr;
    }


    function decodeMapData(str) {
        str = str.split(" ").join("");
        let data = str.split(",");
        let output = []; let index = 0;
        let width = parseInt(data[index++]); let height = parseInt(data[index++]);
        let imageIndex = parseInt(data[index++]); let soundIndex = parseInt(data[index++]);
        let startX = 0; let startY = 0; let exitX = 0; let exitY = 0;
        let tileData = [];
        for (let i = index; i < data.length; ++i) {
            let spec = data[i].split("x");
            if (spec.length === 2) {
                let count = parseInt(spec[0]); let tile = parseInt(spec[1]);
                for (let j = 0; j < count; ++j) tileData.push(tile);
            } else tileData.push(parseInt(spec[0]));
        }
        for (let y = 0; y < height; ++y) {
            let row = [];
            for (let x = 0; x < width; ++x) {
                let tileType = tileData[y * width + x];
                if (tileType === _start_tile) { startX = x; startY = y; }
                if (tileType === _end_tile) { exitX = x; exitY = y; }
                row.push(tileType);
            }
            output.push(row);
        }
        return { width, height, imageIndex, soundIndex, tiles: output, startX, startY, exitX, exitY };
    }


    function getStartPoint() { return { x: gameStartTileX, y: gameStartTileY }; }
    function getExitPoint() { return { x: gameExitTileX, y: gameExitTileY }; }


    function toScreenPoint(worldPos) {
        return { x: (worldPos.x * tileWidth) + gridStartX, y: (worldPos.y * tileHeight) + gridStartY };
    }


    function validateMaze(onSuccess, onFail) {
        let start = getStartPoint(); let exit = getExitPoint();
        if (start.x === -1 || start.y === -1) { onFail("You have no starting point!!!"); return; }
        if (exit.x === -1 || exit.y === -1) { onFail("You have no exit point!!!"); return; }
        var easyStar = new EasyStar.js();
        easyStar.setGrid(tileMap);
        easyStar.setAcceptableTiles([1, 2, 3]);
        easyStar.findPath(start.x, start.y, exit.x, exit.y, (path) => {
            if (path && path.length > 0) onSuccess();
            else onFail('The exit point is unreachable!!!');
        });
        easyStar.calculate();
    }


    function togglePreview() {
        gameLoseDisplay.style.display = 'none';
        if (gameWinDisplay) gameWinDisplay.style.display = 'none';
        let winMsg = document.querySelector('.win-message-overlay');
        if (winMsg) winMsg.style.display = 'none';
        
        if (appState === states_preview) {
            appState = states_editor;
            canvas.style.cursor = '';
            gameStartBtn.style.display = 'none';
            gameUI.style.display = 'none';
        } else {
            validateMaze(() => {
                appState = states_preview;
                prepareGame();
            }, err => alert(err));
        }
    }


    // ---- UI helpers ----
    function updateLivesDisplay() {
        let el = document.querySelector('.lives-display');
        if (el) el.textContent = '❤️'.repeat(livesRemaining);
    }


    function updateTimerDisplay(seconds) {
        let el = document.querySelector('.timer-display');
        if (el) {
            el.textContent = '⏱️ ' + Math.floor(seconds) + 's';
            el.style.color = seconds > 20 ? '#e74c3c' : 'white';
        }
    }


    function startTimer() {
        stopTimer();
        gameStartTime = Date.now();
        timerInterval = setInterval(() => {
            if (gameState !== gameStates_started) return;
            const elapsed = (Date.now() - gameStartTime) / 1000;
            updateTimerDisplay(elapsed);
        }, 100);
    }


    function stopTimer() {
        if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    }


    function showBannedScreen(reason) {
        isBanned = true;
        stopTimer();
        gameStartBtn.style.display = 'none';
        gameLoseDisplay.style.display = 'none';
        if (gameWinDisplay) gameWinDisplay.style.display = 'none';
        canvas.style.cursor = 'default';
        gameUI.style.display = 'none';
        document.querySelector('.banned-reason').textContent = reason;
        document.querySelector('.banned-overlay').style.display = 'flex';
        // Fail: advance the game flow after a short delay so the user can read the message
        setTimeout(() => {
            if (typeof window.__safegateComplete === 'function') {
                window.__safegateComplete(0.0);
            }
        }, 2500);
    }


    function prepareGame() {
        if (isBanned) return;
        
        let winMsg = document.querySelector('.win-message-overlay');
        if (winMsg) winMsg.style.display = 'none';
        
        gameState = gameStates_notStarted;
        stopTimer();
        updateTimerDisplay(0);
        canvas.style.cursor = 'none';
        gameUI.style.display = 'block';
        gameStartBtn.style.display = 'block';
        gameStartBtn.style.width = `${tileWidth}px`;
        gameStartBtn.style.height = `${tileHeight}px`;
        gameStartBtn.style.lineHeight = `${tileHeight}px`;
        updateStartTriggerPosition();
        updateLivesDisplay();
    }


    function updateStartTriggerPosition() {
        if (appState !== states_editor) {
            let start = getStartPoint();
            let pos = toScreenPoint(start);
            gameStartBtn.style.top = `${pos.y}px`;
            gameStartBtn.style.left = `${pos.x}px`;
        }
    }


    function gameOverLose() {
        if (isBanned) return;
        if (gameState !== gameStates_started) return;
        gameState = gameStates_notStarted;
        stopTimer();
        livesRemaining--;
        updateLivesDisplay();
        if (livesRemaining <= 0) {
            showBannedScreen('No ride for you today—please continue on foot.');
            return;
        }
        gameLoseDisplay.style.display = 'block';
        gameStartBtn.style.display = 'block';
        updateTimerDisplay(0);
    }


    function gameOverWin() {
        if (isBanned) return;
        if (gameState !== gameStates_started) return;
        const elapsed = gameStartTime ? (Date.now() - gameStartTime) / 1000 : 0;
        gameState = gameStates_notStarted;
        stopTimer();
        
        // Namesto prikaza slike, prikažemo tekstovno zmagovalno sporočilo
        gameWinSound.play(); // Zvok lahko obdržiš ali odstraniš
        
        // Ustvarimo tekstovno obvestilo v stilu win overlay-a
        let winMessageDiv = document.querySelector('.win-message-overlay');
        if (!winMessageDiv) {
            // Če še ne obstaja, ga ustvarimo
            winMessageDiv = document.createElement('div');
            winMessageDiv.className = 'win-message-overlay';
            winMessageDiv.innerHTML = `
                <div class="win-message-box">
                    <h2>🎉 GOOD JOB! 🎉</h2>
                    <p>Now you can enter the vehicle!</p>
                </div>
            `;
            document.querySelector('.game').appendChild(winMessageDiv);
        }
        
        winMessageDiv.style.display = 'flex';

        setTimeout(() => {
            winMessageDiv.style.display = 'none';
            if (elapsed > TIME_LIMIT) {
                showBannedScreen('You won! But your time was ' + Math.round(elapsed) + 's — over the ' + TIME_LIMIT + 's limit. ⏱️');
            } else {
                // Pass: completed within time limit — advance the game flow
                if (typeof window.__safegateComplete === 'function') {
                    window.__safegateComplete(1.0);
                }
            }
        }, 2000);
    }


    function startGame() {
        if (isBanned) return;
        gameLoseDisplay.style.display = 'none';
        gameStartBtn.style.display = 'none';
        if (gameState !== gameStates_started) {
            gameState = gameStates_started;
            startTimer();
        }
    }


    function play() {
        let data = mapDataInput.value;
        if (!data || data.length == 0) return;
        appState = states_game;
        gameView.style.display = 'block';
        menuView.style.display = 'none';
        editorUI.style.display = 'none';
        loadMapData(data);
        prepareGame();
    }


    function create() {
        gameView.style.display = 'block';
        menuView.style.display = 'none';
        gameUI.style.display = 'none';
        editorUI.style.display = 'block';
        loadMapData(mapDataInput.value);
        appState = states_editor;
    }


    function resetAndCreate() {
        resetMapData();
        gameLoseDisplay.style.display = 'none';
        gameView.style.display = 'block';
        editorUI.style.display = 'block';
        gameUI.style.display = 'none';
        gameStartBtn.style.display = 'none';
        menuView.style.display = 'none';
        canvas.style.cursor = 'default';
        appState = states_editor;
    }


    function resetMapData() {
        gridWidth = 32; gridHeight = 32; tileMap = [];
        for (let y = 0; y < gridHeight; ++y) {
            let row = [];
            for (let x = 0; x < gridWidth; ++x) row.push(0);
            tileMap.push(row);
        }
        gameStartTileX = -1; gameStartTileY = -1; gameExitTileX = -1; gameExitTileY = -1;
        selectImage(0); selectAudio(0);
        if (mapDataInput) mapDataInput.value = '';
    }


    function loadMapData(data) {
        if (data && data.length > 0) {
            let mapData = decodeMapData(data);
            gridWidth = mapData.width; gridHeight = mapData.height;
            tileMap = mapData.tiles;
            gameStartTileX = mapData.startX; gameStartTileY = mapData.startY;
            gameExitTileX = mapData.exitX; gameExitTileY = mapData.exitY;
            selectImage(mapData.imageIndex); selectAudio(mapData.soundIndex);
        }
    }


    function selectImage(index) {
        let current = document.querySelector("#img" + gameWinImageIndex);
        let next = document.querySelector("#img" + index);
        if (current) current.classList.remove("selected");
        if (next) next.classList.add("selected");
        gameWinImageIndex = index;
        gameWinImageUrl = availableImages[gameWinImageIndex];
    }


    function selectAudio(index) {
        gameWinSoundIndex = index;
        gameWinSound = availableSounds[gameWinSoundIndex];
    }


    /**
     *   EasyStar.js - github.com/prettymuchbryce/EasyStarJS - MIT license
     **/
    var EasyStar=function(t){function n(o){if(e[o])return e[o].exports;var r=e[o]={exports:{},id:o,loaded:!1};return t[o].call(r.exports,r,r.exports,n),r.loaded=!0,r.exports}var e={};return n.m=t,n.c=e,n.p="",n(0)}([function(t,n,e){var o={},r=e(1),i=e(2),s=e(3);const u=0,a=1;t.exports=o;var l=1;o.js=function(){var t,n,e,c=1,f=1.4,h=!1,p={},d={},v={},y={},T=!0,g={},x=[],O=Number.MAX_VALUE,b=!1;this.setAcceptableTiles=function(t){t instanceof Array?e=t:!isNaN(parseFloat(t))&&isFinite(t)&&(e=[t])},this.enableSync=function(){h=!0},this.disableSync=function(){h=!1},this.enableDiagonals=function(){b=!0},this.disableDiagonals=function(){b=!1},this.setGrid=function(n){t=n;for(var e=0;e<t.length;e++)for(var o=0;o<t[0].length;o++)d[t[e][o]]||(d[t[e][o]]=1)},this.setTileCost=function(t,n){d[t]=n},this.setAdditionalPointCost=function(t,n,e){void 0===v[n]&&(v[n]={}),v[n][t]=e},this.removeAdditionalPointCost=function(t,n){void 0!==v[n]&&delete v[n][t]},this.removeAllAdditionalPointCosts=function(){v={}},this.setDirectionalCondition=function(t,n,e){void 0===y[n]&&(y[n]={}),y[n][t]=e},this.removeAllDirectionalConditions=function(){y={}},this.setIterationsPerCalculation=function(t){O=t},this.avoidAdditionalPoint=function(t,n){void 0===p[n]&&(p[n]={}),p[n][t]=1},this.stopAvoidingAdditionalPoint=function(t,n){void 0!==p[n]&&delete p[n][t]},this.enableCornerCutting=function(){T=!0},this.disableCornerCutting=function(){T=!1},this.stopAvoidingAllAdditionalPoints=function(){p={}},this.findPath=function(n,o,i,u,a){var f=function(t){h?a(t):setTimeout(function(){a(t)})};if(void 0===e)throw new Error("You can't set a path without first calling setAcceptableTiles() on EasyStar.");if(void 0===t)throw new Error("You can't set a path without first calling setGrid() on EasyStar.");if(0>n||0>o||0>i||0>u||n>t[0].length-1||o>t.length-1||i>t[0].length-1||u>t.length-1)throw new Error("Your start or end point is outside the scope of your grid.");if(n===i&&o===u)return void f([]);for(var p=t[u][i],d=!1,v=0;v<e.length;v++)if(p===e[v]){d=!0;break}if(d===!1)return void f(null);var y=new r;y.openList=new s(function(t,n){return t.bestGuessDistance()-n.bestGuessDistance()}),y.isDoneCalculating=!1,y.nodeHash={},y.startX=n,y.startY=o,y.endX=i,y.endY=u,y.callback=f,y.openList.push(P(y,y.startX,y.startY,null,c));var T=l++;return g[T]=y,x.push(T),T},this.cancelPath=function(t){return t in g?(delete g[t],!0):!1},this.calculate=function(){if(0!==x.length&&void 0!==t&&void 0!==e)for(n=0;O>n;n++){if(0===x.length)return;h&&(n=0);var o=x[0],r=g[o];if("undefined"!=typeof r)if(0!==r.openList.size()){var i=r.openList.pop();if(r.endX!==i.x||r.endY!==i.y)i.list=u,i.y>0&&m(r,i,0,-1,c*F(i.x,i.y-1)),i.x<t[0].length-1&&m(r,i,1,0,c*F(i.x+1,i.y)),i.y<t.length-1&&m(r,i,0,1,c*F(i.x,i.y+1)),i.x>0&&m(r,i,-1,0,c*F(i.x-1,i.y)),b&&(i.x>0&&i.y>0&&(T||A(t,e,i.x,i.y-1)&&A(t,e,i.x-1,i.y))&&m(r,i,-1,-1,f*F(i.x-1,i.y-1)),i.x<t[0].length-1&&i.y<t.length-1&&(T||A(t,e,i.x,i.y+1)&&A(t,e,i.x+1,i.y))&&m(r,i,1,1,f*F(i.x+1,i.y+1)),i.x<t[0].length-1&&i.y>0&&(T||A(t,e,i.x,i.y-1)&&A(t,e,i.x+1,i.y))&&m(r,i,1,-1,f*F(i.x+1,i.y-1)),i.x>0&&i.y<t.length-1&&(T||A(t,e,i.x,i.y+1)&&A(t,e,i.x-1,i.y))&&m(r,i,-1,1,f*F(i.x-1,i.y+1)));else{var s=[];s.push({x:i.x,y:i.y});for(var a=i.parent;null!=a;)s.push({x:a.x,y:a.y}),a=a.parent;s.reverse();var l=s;r.callback(l),delete g[o],x.shift()}}else r.callback(null),delete g[o],x.shift();else x.shift()}};var m=function(n,o,r,i,s){var u=o.x+r,l=o.y+i;if((void 0===p[l]||void 0===p[l][u])&&A(t,e,u,l,o)){var c=P(n,u,l,o,s);void 0===c.list?(c.list=a,n.openList.push(c)):o.costSoFar+s<c.costSoFar&&(c.costSoFar=o.costSoFar+s,c.parent=o,n.openList.updateItem(c))}},A=function(t,n,e,o,r){var i=y[o]&&y[o][e];if(i){var s=E(r.x-e,r.y-o),u=function(){for(var t=0;t<i.length;t++)if(i[t]===s)return!0;return!1};if(!u())return!1}for(var a=0;a<n.length;a++)if(t[o][e]===n[a])return!0;return!1},E=function(t,n){if(0===t&&-1===n)return o.TOP;if(1===t&&-1===n)return o.TOP_RIGHT;if(1===t&&0===n)return o.RIGHT;if(1===t&&1===n)return o.BOTTOM_RIGHT;if(0===t&&1===n)return o.BOTTOM;if(-1===t&&1===n)return o.BOTTOM_LEFT;if(-1===t&&0===n)return o.LEFT;if(-1===t&&-1===n)return o.TOP_LEFT;throw new Error("These differences are not valid: "+t+", "+n)},F=function(n,e){return v[e]&&v[e][n]||d[t[e][n]]},P=function(t,n,e,o,r){if(void 0!==t.nodeHash[e]){if(void 0!==t.nodeHash[e][n])return t.nodeHash[e][n]}else t.nodeHash[e]={};var s=L(n,e,t.endX,t.endY);if(null!==o)var u=o.costSoFar+r;else u=0;var a=new i(o,n,e,u,s);return t.nodeHash[e][n]=a,a},L=function(t,n,e,o){if(b){var r=Math.abs(t-e),i=Math.abs(n-o);return i>r?f*r+i:f*i+r}var r=Math.abs(t-e),i=Math.abs(n-o);return r+i}},o.TOP="TOP",o.TOP_RIGHT="TOP_RIGHT",o.RIGHT="RIGHT",o.BOTTOM_RIGHT="BOTTOM_RIGHT",o.BOTTOM="BOTTOM",o.BOTTOM_LEFT="BOTTOM_LEFT",o.LEFT="LEFT",o.TOP_LEFT="TOP_LEFT"},function(t,n){t.exports=function(){this.pointsToAvoid={},this.startX,this.callback,this.startY,this.endX,this.endY,this.nodeHash={},this.openList}},function(t,n){t.exports=function(t,n,e,o,r){this.parent=t,this.x=n,this.y=e,this.costSoFar=o,this.simpleDistanceToTarget=r,this.bestGuessDistance=function(){return this.costSoFar+this.simpleDistanceToTarget}}},function(t,n,e){t.exports=e(4)},function(t,n,e){var o,r,i;(function(){var e,s,u,a,l,c,f,h,p,d,v,y,T,g,x;u=Math.floor,d=Math.min,s=function(t,n){return n>t?-1:t>n?1:0},p=function(t,n,e,o,r){var i;if(null==e&&(e=0),null==r&&(r=s),0>e)throw new Error("lo must be non-negative");for(null==o&&(o=t.length);o>e;)i=u((e+o)/2),r(n,t[i])<0?o=i:e=i+1;return[].splice.apply(t,[e,e-e].concat(n)),n},c=function(t,n,e){return null==e&&(e=s),t.push(n),g(t,0,t.length-1,e)},l=function(t,n){var e,o;return null==n&&(n=s),e=t.pop(),t.length?(o=t[0],t[0]=e,x(t,0,n)):o=e,o},h=function(t,n,e){var o;return null==e&&(e=s),o=t[0],t[0]=n,x(t,0,e),o},f=function(t,n,e){var o;return null==e&&(e=s),t.length&&e(t[0],n)<0&&(o=[t[0],n],n=o[0],t[0]=o[1],x(t,0,e)),n},a=function(t,n){var e,o,r,i,a,l;for(null==n&&(n=s),i=function(){l=[];for(var n=0,e=u(t.length/2);e>=0?e>n:n>e;e>=0?n++:n--)l.push(n);return l}.apply(this).reverse(),a=[],o=0,r=i.length;r>o;o++)e=i[o],a.push(x(t,e,n));return a},T=function(t,n,e){var o;return null==e&&(e=s),o=t.indexOf(n),-1!==o?(g(t,0,o,e),x(t,o,e)):void 0},v=function(t,n,e){var o,r,i,u,l;if(null==e&&(e=s),r=t.slice(0,n),!r.length)return r;for(a(r,e),l=t.slice(n),i=0,u=l.length;u>i;i++)o=l[i],f(r,o,e);return r.sort(e).reverse()},y=function(t,n,e){var o,r,i,u,c,f,h,v,y,T;if(null==e&&(e=s),10*n<=t.length){if(u=t.slice(0,n).sort(e),!u.length)return u;for(i=u[u.length-1],v=t.slice(n),c=0,h=v.length;h>c;c++)o=v[c],e(o,i)<0&&(p(u,o,0,null,e),u.pop(),i=u[u.length-1]);return u}for(a(t,e),T=[],r=f=0,y=d(n,t.length);y>=0?y>f:f>y;r=y>=0?++f:--f)T.push(l(t,e));return T},g=function(t,n,e,o){var r,i,u;for(null==o&&(o=s),r=t[e];e>n&&(u=e-1>>1,i=t[u],o(r,i)<0);)t[e]=i,e=u;return t[e]=r},x=function(t,n,e){var o,r,i,u,a;for(null==e&&(e=s),r=t.length,a=n,i=t[n],o=2*n+1;r>o;)u=o+1,r>u&&!(e(t[o],t[u])<0)&&(o=u),t[n]=t[o],n=o,o=2*n+1;return t[n]=i,g(t,a,n,e)},e=function(){function t(t){this.cmp=null!=t?t:s,this.nodes=[]}return t.push=c,t.pop=l,t.replace=h,t.pushpop=f,t.heapify=a,t.updateItem=T,t.nlargest=v,t.nsmallest=y,t.prototype.push=function(t){return c(this.nodes,t,this.cmp)},t.prototype.pop=function(){return l(this.nodes,this.cmp)},t.prototype.peek=function(){return this.nodes[0]},t.prototype.contains=function(t){return-1!==this.nodes.indexOf(t)},t.prototype.replace=function(t){return h(this.nodes,t,this.cmp)},t.prototype.pushpop=function(t){return f(this.nodes,t,this.cmp)},t.prototype.heapify=function(){return a(this.nodes,this.cmp)},t.prototype.updateItem=function(t){return T(this.nodes,t,this.cmp)},t.prototype.clear=function(){return this.nodes=[]},t.prototype.empty=function(){return 0===this.nodes.length},t.prototype.size=function(){return this.nodes.length},t.prototype.clone=function(){var n;return n=new t,n.nodes=this.nodes.slice(0),n},t.prototype.toArray=function(){return this.nodes.slice(0)},t.prototype.insert=t.prototype.push,t.prototype.top=t.prototype.peek,t.prototype.front=t.prototype.peek,t.prototype.has=t.prototype.contains,t.prototype.copy=t.prototype.clone,t}(),function(e,s){return r=[],o=s,i="function"==typeof o?o.apply(n,r):o,!(void 0!==i&&(t.exports=i))}(this,function(){return e})}).call(this)}]);


    // ---- Auto-start with a random maze (4 options) ----
    const randomMazes = [
        `32, 32, 0, 0, 32x0, 32x0, 32x0, 15x1, 17x0, 2x1, 2, 12x1, 17x0, 15x1, 17x0, 12x0, 3x1, 17x0, 12x0, 3x1, 17x0, 12x0, 3x1, 17x0, 12x0, 3x1, 17x0, 12x0, 16x1, 4x0, 12x0, 16x1, 4x0, 12x0, 16x1, 4x0, 25x0, 3x1, 4x0, 25x0, 3x1, 4x0, 25x0, 3x1, 4x0, 25x0, 3x1, 4x0, 25x0, 3x1, 4x0, 5x0, 23x1, 4x0, 5x0, 23x1, 4x0, 5x0, 23x1, 4x0, 5x0, 3x1, 24x0, 5x0, 3x1, 24x0, 5x0, 3x1, 24x0, 5x0, 3x1, 24x0, 5x0, 23x1, 4x0, 5x0, 20x1, 3, 2x1, 4x0, 5x0, 23x1, 4x0, 32x0, 32x0, 32x0, 32x0`,
        `32, 32, 0, 0, 8x0, 3x1, 21x0, 8x0, 3x1, 21x0, 8x0, 1, 2, 1, 21x0, 8x0, 3x1, 7x0, 12x1, 2x0, 8x0, 3x1, 7x0, 12x1, 2x0, 8x0, 3x1, 7x0, 12x1, 2x0, 8x0, 3x1, 7x0, 3x1, 6x0, 3x1, 2x0, 8x0, 3x1, 7x0, 3x1, 6x0, 3x1, 2x0, 8x0, 3x1, 7x0, 3x1, 6x0, 3x1, 2x0, 8x0, 3x1, 7x0, 3x1, 6x0, 3x1, 2x0, 8x0, 13x1, 6x0, 3x1, 2x0, 8x0, 13x1, 6x0, 3x1, 2x0, 8x0, 13x1, 6x0, 3x1, 2x0, 27x0, 3x1, 2x0, 27x0, 3x1, 2x0, 27x0, 3x1, 2x0, 13x0, 17x1, 2x0, 13x0, 17x1, 2x0, 13x0, 17x1, 2x0, 13x0, 3x1, 11x0, 3x1, 2x0, 13x0, 3x1, 11x0, 3x1, 2x0, 13x0, 3x1, 11x0, 3x1, 2x0, 13x0, 3x1, 11x0, 3x1, 2x0, 13x0, 3x1, 11x0, 3x1, 2x0, 13x0, 3x1, 11x0, 3x1, 2x0, 13x0, 3x1, 16x0, 4x0, 19x1, 9x0, 4x0, 1, 3, 17x1, 9x0, 4x0, 19x1, 9x0, 32x0, 32x0, 32x0`,
        `32, 32, 0, 0, 32x0, 4x0, 13x1, 15x0, 4x0, 2x1, 3, 10x1, 15x0, 4x0, 13x1, 15x0, 14x0, 3x1, 15x0, 14x0, 12x1, 6x0, 14x0, 12x1, 6x0, 14x0, 12x1, 6x0, 19x0, 3x1, 10x0, 19x0, 3x1, 10x0, 19x0, 3x1, 10x0, 19x0, 3x1, 10x0, 19x0, 3x1, 10x0, 19x0, 3x1, 10x0, 14x0, 12x1, 6x0, 14x0, 12x1, 6x0, 5x0, 3x1, 6x0, 12x1, 6x0, 5x0, 3x1, 6x0, 3x1, 15x0, 5x0, 3x1, 6x0, 3x1, 15x0, 5x0, 3x1, 6x0, 12x1, 6x0, 5x0, 3x1, 6x0, 12x1, 6x0, 5x0, 3x1, 6x0, 12x1, 6x0, 5x0, 3x1, 15x0, 3x1, 6x0, 5x0, 3x1, 15x0, 3x1, 6x0, 5x0, 3x1, 15x0, 3x1, 6x0, 5x0, 21x1, 6x0, 5x0, 21x1, 6x0, 5x0, 21x1, 6x0, 5x0, 3x1, 24x0, 5x0, 1, 2, 1, 24x0, 5x0, 3x1, 24x0, 5x0, 3x1, 24x0`,
        `32, 32, 0, 0, 32x0, 32x0, 32x0, 32x0, 32x0, 32x0, 6x0, 13x1, 13x0, 6x0, 2x1, 3, 11x1, 12x0, 6x0, 15x1, 11x0, 17x0, 5x1, 10x0, 18x0, 5x1, 9x0, 19x0, 5x1, 8x0, 20x0, 5x1, 7x0, 21x0, 5x1, 6x0, 22x0, 5x1, 5x0, 23x0, 4x1, 5x0, 7x0, 6x1, 11x0, 3x1, 5x0, 6x0, 8x1, 10x0, 3x1, 5x0, 5x0, 10x1, 8x0, 4x1, 5x0, 9x1, 2x0, 5x1, 6x0, 5x1, 5x0, 2x1, 2, 5x1, 4x0, 5x1, 4x0, 5x1, 6x0, 7x1, 6x0, 4x1, 3x0, 5x1, 7x0, 14x0, 10x1, 8x0, 14x0, 9x1, 9x0, 13x0, 9x1, 10x0, 12x0, 5x1, 15x0, 11x0, 5x1, 16x0, 11x0, 4x1, 17x0, 11x0, 3x1, 18x0, 32x0, 32x0, 32x0`
    ];




    // Počakaj da se vse naloži
    if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        (function autoStartRandomMaze() {
            const chosen = randomMazes[Math.floor(Math.random() * randomMazes.length)];
            appState = states_game;
            gameView.style.display = 'block';
            menuView.style.display = 'none';
            editorUI.style.display = 'none';
            
            // NAJPREJ naložimo podatke labirinta
            loadMapData(chosen);
            
            // POTEM pripravimo igro (to bo pravilno postavilo start gumb)
            prepareGame();
            
            // Posodobimo velikost canvasa in pozicijo start gumba
            setTimeout(() => {
                updateCanvasSize();
                updateStartTriggerPosition();
            }, 10);
        })();
    });
    } else {
    (function autoStartRandomMaze() {
            const chosen = randomMazes[Math.floor(Math.random() * randomMazes.length)];
            appState = states_game;
            gameView.style.display = 'block';
            menuView.style.display = 'none';
            editorUI.style.display = 'none';
            
            // NAJPREJ naložimo podatke labirinta
            loadMapData(chosen);
            
            // POTEM pripravimo igro (to bo pravilno postavilo start gumb)
            prepareGame();
            
            // Posodobimo velikost canvasa in pozicijo start gumba
            setTimeout(() => {
                updateCanvasSize();
                updateStartTriggerPosition();
            }, 10);
        })();
    }
}