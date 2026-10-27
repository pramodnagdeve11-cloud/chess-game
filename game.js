// Royal Chess Game Controller & UI Engine

class ChessGame {
    constructor() {
        this.chess = new Chess();
        this.boardEl = document.getElementById('chessboard');
        this.evalFillEl = document.getElementById('eval-bar-fill');
        this.evalWhiteEl = document.getElementById('eval-white-val');
        this.evalBlackEl = document.getElementById('eval-black-val');
        this.movesListEl = document.getElementById('moves-table-body');
        this.openingEl = document.getElementById('opening-name');
        this.statusTextEl = document.getElementById('status-text');
        this.statusIndicatorEl = document.getElementById('status-indicator');
        this.reviewBannerEl = document.getElementById('review-banner');

        // Players UI
        this.whiteClockEl = document.getElementById('white-clock');
        this.blackClockEl = document.getElementById('black-clock');
        this.whiteCapturedEl = document.getElementById('white-captured');
        this.blackCapturedEl = document.getElementById('black-captured');
        this.whiteMaterialEl = document.getElementById('white-material');
        this.blackMaterialEl = document.getElementById('black-material');
        this.whiteBarEl = document.getElementById('player-bar-white');
        this.blackBarEl = document.getElementById('player-bar-black');

        // Modals
        this.promoModal = document.getElementById('promo-modal');
        this.gameOverModal = document.getElementById('gameover-modal');
        this.newGameModal = document.getElementById('newgame-modal');

        // Configuration
        this.gameMode = 'ai'; // 'ai' or 'pass'
        this.aiLevel = 2; // 1: Easy, 2: Medium, 3: Hard
        this.moveSpeed = 'medium'; // 'fast' (0.4s), 'medium' (1.1s natural), 'slow' (2.2s)
        this.playerSide = 'w'; // 'w', 'b', or 'random'
        this.orientation = 'w'; // 'w' or 'b'
        this.timePreset = 600; // 10 mins default (in seconds), 0 = unlimited
        this.increment = 0; // seconds

        // State
        this.selectedSquare = null;
        this.legalMovesForSelected = [];
        this.lastMove = null;
        this.hintSquares = null;
        this.pendingPromotion = null;
        this.historySnapshots = []; // [{ fen, move, san }]
        this.viewingHistoryIndex = -1; // -1 means live position

        // Clock State
        this.whiteTime = 600;
        this.blackTime = 600;
        this.clockTimer = null;
        this.isGameOver = false;
        this.lastTouchTime = 0;

        this.initEventListeners();
        this.startNewGame();
    }

    startNewGame() {
        this.chess.reset();
        this.isGameOver = false;
        this.selectedSquare = null;
        this.legalMovesForSelected = [];
        this.lastMove = null;
        this.hintSquares = null;
        this.pendingPromotion = null;
        this.historySnapshots = [{ fen: this.chess.fen(), san: 'Start' }];
        this.viewingHistoryIndex = -1;
        this.reviewBannerEl.classList.remove('show');

        // Determine orientation
        if (this.playerSide === 'random') {
            this.orientation = Math.random() < 0.5 ? 'w' : 'b';
        } else {
            this.orientation = this.playerSide;
        }

        // Initialize Clocks
        this.whiteTime = this.timePreset;
        this.blackTime = this.timePreset;
        this.stopClock();
        this.updateClockDisplays();
        if (this.timePreset > 0) {
            this.startClock();
        }

        this.renderBoard();
        this.updateStatus();
        this.updateCapturedPieces();
        this.updateEvalBar();
        this.renderHistory();

        // If playing AI as Black, trigger AI first move
        if (this.gameMode === 'ai' && this.orientation === 'b' && this.chess.turn() === 'w') {
            this.statusTextEl.textContent = "AI is thinking...";
            this.statusIndicatorEl.classList.add('thinking');
            setTimeout(() => this.triggerAiMove(), this.getAiDelay());
        }
    }

    // --- Clock Logic ---
    startClock() {
        this.stopClock();
        if (this.timePreset <= 0 || this.isGameOver) return;

        this.clockTimer = setInterval(() => {
            if (this.isGameOver) return;
            const turn = this.chess.turn();
            if (turn === 'w') {
                this.whiteTime = Math.max(0, this.whiteTime - 1);
                if (this.whiteTime === 0) {
                    this.handleTimeout('w');
                }
            } else {
                this.blackTime = Math.max(0, this.blackTime - 1);
                if (this.blackTime === 0) {
                    this.handleTimeout('b');
                }
            }
            this.updateClockDisplays();
        }, 1000);
    }

    stopClock() {
        if (this.clockTimer) {
            clearInterval(this.clockTimer);
            this.clockTimer = null;
        }
    }

    formatTime(seconds) {
        if (seconds <= 0) return "0:00";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    updateClockDisplays() {
        if (this.timePreset <= 0) {
            this.whiteClockEl.textContent = "∞";
            this.blackClockEl.textContent = "∞";
            return;
        }
        this.whiteClockEl.textContent = this.formatTime(this.whiteTime);
        this.blackClockEl.textContent = this.formatTime(this.blackTime);

        this.whiteClockEl.classList.toggle('active', this.chess.turn() === 'w' && !this.isGameOver);
        this.blackClockEl.classList.toggle('active', this.chess.turn() === 'b' && !this.isGameOver);

        this.whiteClockEl.classList.toggle('danger', this.whiteTime <= 30 && this.chess.turn() === 'w');
        this.blackClockEl.classList.toggle('danger', this.blackTime <= 30 && this.chess.turn() === 'b');
    }

    handleTimeout(loserColor) {
        this.stopClock();
        this.isGameOver = true;
        const winner = loserColor === 'w' ? 'Black' : 'White';
        window.chessAudio.playGameEnd(winner === (this.orientation === 'w' ? 'White' : 'Black'));
        this.showGameOverModal(`${winner} Won!`, `${loserColor === 'w' ? 'White' : 'Black'} ran out of time.`);
    }

    // --- Board Rendering ---
    renderBoard() {
        this.boardEl.innerHTML = '';
        const board = this.chess.board();
        const isFlipped = this.orientation === 'b';

        // Check if King is in check
        let inCheckSquare = null;
        if (this.chess.in_check()) {
            const kingColor = this.chess.turn();
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const piece = board[r][c];
                    if (piece && piece.type === 'k' && piece.color === kingColor) {
                        const file = 'abcdefgh'[c];
                        const rank = 8 - r;
                        inCheckSquare = `${file}${rank}`;
                    }
                }
            }
        }

        for (let rowIdx = 0; rowIdx < 8; rowIdx++) {
            for (let colIdx = 0; colIdx < 8; colIdx++) {
                // Actual board coordinates based on orientation
                const r = isFlipped ? 7 - rowIdx : rowIdx;
                const c = isFlipped ? 7 - colIdx : colIdx;
                const squareName = `${'abcdefgh'[c]}${8 - r}`;
                const piece = board[r][c];

                const squareEl = document.createElement('div');
                squareEl.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
                squareEl.dataset.square = squareName;

                // Rank & File labels on edge squares
                if (colIdx === 0) {
                    const rankLabel = document.createElement('span');
                    rankLabel.className = 'coord-rank';
                    rankLabel.textContent = 8 - r;
                    squareEl.appendChild(rankLabel);
                }
                if (rowIdx === 7) {
                    const fileLabel = document.createElement('span');
                    fileLabel.className = 'coord-file';
                    fileLabel.textContent = 'abcdefgh'[c];
                    squareEl.appendChild(fileLabel);
                }

                // Square highlights
                if (this.selectedSquare === squareName) {
                    squareEl.classList.add('selected');
                }
                if (this.lastMove && (this.lastMove.from === squareName || this.lastMove.to === squareName)) {
                    squareEl.classList.add('last-move');
                }
                if (inCheckSquare === squareName) {
                    squareEl.classList.add('in-check');
                }
                if (this.hintSquares && (this.hintSquares.from === squareName || this.hintSquares.to === squareName)) {
                    squareEl.classList.add('hint-move');
                }

                // Legal move indicators
                const legalTarget = this.legalMovesForSelected.find(m => m.to === squareName);
                if (legalTarget) {
                    if (legalTarget.captured || (piece && piece.color !== this.chess.turn())) {
                        squareEl.classList.add('legal-capture');
                    } else {
                        squareEl.classList.add('legal-move');
                    }
                }

                // Piece Image
                if (piece) {
                    const img = document.createElement('img');
                    img.src = `pieces/${piece.color}${piece.type.toUpperCase()}.svg`;
                    img.alt = `${piece.color}${piece.type}`;
                    img.className = 'piece';
                    squareEl.appendChild(img);
                }

                // Attach robust mobile & desktop events
                this.attachSquareEvents(squareEl, squareName);
                this.boardEl.appendChild(squareEl);
            }
        }

        // Active turn highlight on player bars
        const turn = this.chess.turn();
        this.whiteBarEl.classList.toggle('active-turn', turn === 'w' && !this.isGameOver);
        this.blackBarEl.classList.toggle('active-turn', turn === 'b' && !this.isGameOver);
    }

    // --- Unified Mobile & Desktop Event Handling ---
    attachSquareEvents(squareEl, squareName) {
        // Desktop Click (debounced so touch never triggers duplicate click)
        squareEl.addEventListener('click', (e) => {
            if (Date.now() - this.lastTouchTime < 450) {
                return;
            }
            this.handleSquareClick(squareName);
        });

        // Touch handling (Mobile Tap-to-move & Smooth Drag)
        let touchStartX = 0;
        let touchStartY = 0;
        let isDragging = false;
        let ghost = null;
        let touchPiece = null;

        squareEl.addEventListener('touchstart', (e) => {
            if (this.viewingHistoryIndex !== -1 || this.isGameOver) return;
            if (this.gameMode === 'ai' && this.chess.turn() !== this.orientation) return;

            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            isDragging = false;
            touchPiece = this.chess.get(squareName);
        }, { passive: true });

        squareEl.addEventListener('touchmove', (e) => {
            if (!touchPiece || touchPiece.color !== this.chess.turn()) return;
            const touch = e.touches[0];
            const dx = touch.clientX - touchStartX;
            const dy = touch.clientY - touchStartY;
            const dist = Math.hypot(dx, dy);

            if (dist > 14 && !isDragging) {
                isDragging = true;
                if (this.selectedSquare !== squareName) {
                    this.selectedSquare = squareName;
                    this.legalMovesForSelected = this.chess.moves({ square: squareName, verbose: true });
                    this.renderBoard();
                }

                // Create floating piece ghost
                ghost = document.createElement('img');
                ghost.src = `pieces/${touchPiece.color}${touchPiece.type.toUpperCase()}.svg`;
                ghost.className = 'touch-ghost';
                ghost.style.left = `${touch.clientX - 28}px`;
                ghost.style.top = `${touch.clientY - 28}px`;
                ghost.style.width = '56px';
                ghost.style.height = '56px';
                document.body.appendChild(ghost);
            }

            if (isDragging && ghost) {
                if (e.cancelable) e.preventDefault();
                ghost.style.left = `${touch.clientX - 28}px`;
                ghost.style.top = `${touch.clientY - 28}px`;
            }
        }, { passive: false });

        squareEl.addEventListener('touchend', (e) => {
            this.lastTouchTime = Date.now();

            if (isDragging && ghost) {
                const touch = e.changedTouches[0];
                ghost.remove();
                ghost = null;
                isDragging = false;

                const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
                const targetSquareEl = targetEl?.closest('.square');
                if (targetSquareEl && targetSquareEl.dataset.square) {
                    const targetSquare = targetSquareEl.dataset.square;
                    if (targetSquare !== squareName) {
                        this.executeMoveAttempt(squareName, targetSquare);
                        if (e.cancelable) e.preventDefault();
                        return;
                    }
                }
            } else {
                // User tapped square
                this.handleSquareClick(squareName);
            }
            if (e.cancelable) e.preventDefault();
        });
    }

    // --- Drag and Drop Handlers ---
    handleDragStart(e, square) {
        if (this.viewingHistoryIndex !== -1 || this.isGameOver) {
            e.preventDefault();
            return;
        }

        const piece = this.chess.get(square);
        if (!piece || piece.color !== this.chess.turn()) {
            e.preventDefault();
            return;
        }

        if (this.gameMode === 'ai' && this.chess.turn() !== this.orientation) {
            e.preventDefault();
            return;
        }

        e.dataTransfer.setData('text/plain', square);
        e.target.classList.add('dragging');

        // Select square
        this.selectedSquare = square;
        this.legalMovesForSelected = this.chess.moves({ square, verbose: true });
        this.renderBoard();
    }

    handleDrop(e, targetSquare) {
        e.preventDefault();
        const sourceSquare = e.dataTransfer.getData('text/plain');
        if (sourceSquare && sourceSquare !== targetSquare) {
            this.executeMoveAttempt(sourceSquare, targetSquare);
        }
    }

    // --- Click to Move Handler ---
    handleSquareClick(square) {
        if (this.viewingHistoryIndex !== -1) {
            this.exitHistoryReview();
            return;
        }
        if (this.isGameOver) return;

        // If AI is currently thinking, ignore human clicks
        if (this.gameMode === 'ai' && this.chess.turn() !== this.orientation) {
            return;
        }

        const clickedPiece = this.chess.get(square);

        // Case 1: Square already selected -> attempt move to target
        if (this.selectedSquare) {
            if (this.selectedSquare === square) {
                // Deselect
                this.selectedSquare = null;
                this.legalMovesForSelected = [];
                this.renderBoard();
                return;
            }

            const isLegal = this.legalMovesForSelected.some(m => m.to === square);
            if (isLegal) {
                this.executeMoveAttempt(this.selectedSquare, square);
                return;
            }

            // If clicked own friendly piece, switch selection
            if (clickedPiece && clickedPiece.color === this.chess.turn()) {
                this.selectedSquare = square;
                this.legalMovesForSelected = this.chess.moves({ square, verbose: true });
                this.renderBoard();
                return;
            }

            // Clicked empty or enemy non-legal -> deselect
            this.selectedSquare = null;
            this.legalMovesForSelected = [];
            this.renderBoard();
            return;
        }

        // Case 2: No square selected -> select if current player's piece
        if (clickedPiece && clickedPiece.color === this.chess.turn()) {
            this.selectedSquare = square;
            this.legalMovesForSelected = this.chess.moves({ square, verbose: true });
            this.renderBoard();
        }
    }

    // --- Move Execution & Validation ---
    executeMoveAttempt(from, to) {
        // Check for pawn promotion
        const piece = this.chess.get(from);
        const isPromotion = piece && piece.type === 'p' && (to.endsWith('8') || to.endsWith('1'));

        if (isPromotion) {
            // Check if this move is legal with a Queen promotion
            const testMove = this.chess.moves({ square: from, verbose: true }).find(m => m.to === to && m.promotion);
            if (testMove) {
                this.pendingPromotion = { from, to };
                this.showPromotionModal(piece.color);
                return;
            }
        }

        // Normal move
        this.makeMove({ from, to });
    }

    makeMove(moveObj) {
        const move = this.chess.move(moveObj);
        if (!move) {
            // Illegal move
            this.selectedSquare = null;
            this.legalMovesForSelected = [];
            this.renderBoard();
            return null;
        }

        // Move was legal and applied
        this.lastMove = move;
        this.selectedSquare = null;
        this.legalMovesForSelected = [];
        this.hintSquares = null;

        // Sound effects
        if (this.chess.in_checkmate()) {
            window.chessAudio.playGameEnd(move.color === this.orientation);
        } else if (this.chess.in_check()) {
            window.chessAudio.playCheck();
        } else if (move.flags.includes('k') || move.flags.includes('q')) {
            window.chessAudio.playCastle();
        } else if (move.captured) {
            window.chessAudio.playCapture();
        } else {
            window.chessAudio.playMove();
        }

        // Add clock increment
        if (this.increment > 0 && this.timePreset > 0) {
            if (move.color === 'w') this.whiteTime += this.increment;
            else this.blackTime += this.increment;
        }

        // Save history snapshot
        this.historySnapshots.push({
            fen: this.chess.fen(),
            san: move.san,
            from: move.from,
            to: move.to
        });

        this.renderBoard();
        this.updateStatus();
        this.updateCapturedPieces();
        this.updateEvalBar();
        this.renderHistory();

        // Check for Game Over conditions
        if (this.chess.game_over()) {
            this.handleGameOver();
            return move;
        }

        // If playing vs AI and it's AI's turn
        if (this.gameMode === 'ai' && this.chess.turn() !== this.orientation) {
            this.statusTextEl.textContent = "AI is thinking...";
            this.statusIndicatorEl.classList.add('thinking');
            setTimeout(() => this.triggerAiMove(), this.getAiDelay());
        }

        return move;
    }

    // --- AI Speed Delay Helper ---
    getAiDelay() {
        // Natural, comfortable speed delays
        const delays = {
            fast: 400,
            medium: 1100, // Medium speed as requested: comfortable ~1 second thinking delay
            slow: 2200
        };
        return delays[this.moveSpeed] || 1100;
    }

    // --- AI Move Execution ---
    triggerAiMove() {
        if (this.isGameOver) return;
        this.statusIndicatorEl.classList.remove('thinking');
        const bestMove = window.chessEngine.findBestMove(this.chess, this.aiLevel);
        if (bestMove) {
            this.makeMove(bestMove);
        }
    }

    // --- Promotion Modal ---
    showPromotionModal(color) {
        const promoPieces = ['q', 'r', 'b', 'n'];
        const choicesEl = document.getElementById('promo-choices');
        choicesEl.innerHTML = '';

        promoPieces.forEach(p => {
            const btn = document.createElement('button');
            btn.className = 'promo-btn';
            btn.innerHTML = `<img src="pieces/${color}${p.toUpperCase()}.svg" alt="${p}">`;
            btn.addEventListener('click', () => {
                this.promoModal.classList.remove('active');
                if (this.pendingPromotion) {
                    this.makeMove({
                        from: this.pendingPromotion.from,
                        to: this.pendingPromotion.to,
                        promotion: p
                    });
                    this.pendingPromotion = null;
                }
            });
            choicesEl.appendChild(btn);
        });

        this.promoModal.classList.add('active');
    }

    // --- Captured Pieces & Material Calculation ---
    updateCapturedPieces() {
        const fullSet = { p: 8, n: 2, b: 2, r: 2, q: 1 };
        const currentWhite = { p: 0, n: 0, b: 0, r: 0, q: 0 };
        const currentBlack = { p: 0, n: 0, b: 0, r: 0, q: 0 };

        const board = this.chess.board();
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (piece && piece.type !== 'k') {
                    if (piece.color === 'w') currentWhite[piece.type]++;
                    else currentBlack[piece.type]++;
                }
            }
        }

        // Captured from White (captured by Black)
        const whiteLost = [];
        let whiteLostPoints = 0;
        for (const t in fullSet) {
            const lost = fullSet[t] - currentWhite[t];
            for (let i = 0; i < lost; i++) {
                whiteLost.push(t);
                whiteLostPoints += PIECE_VALUES[t];
            }
        }

        // Captured from Black (captured by White)
        const blackLost = [];
        let blackLostPoints = 0;
        for (const t in fullSet) {
            const lost = fullSet[t] - currentBlack[t];
            for (let i = 0; i < lost; i++) {
                blackLost.push(t);
                blackLostPoints += PIECE_VALUES[t];
            }
        }

        // Display captured for White player (pieces Black lost)
        this.whiteCapturedEl.innerHTML = blackLost.map(t => `<img src="pieces/b${t.toUpperCase()}.svg">`).join('');
        // Display captured for Black player (pieces White lost)
        this.blackCapturedEl.innerHTML = whiteLost.map(t => `<img src="pieces/w${t.toUpperCase()}.svg">`).join('');

        // Advantage calculation
        const diff = (blackLostPoints - whiteLostPoints) / 100;
        if (diff > 0) {
            this.whiteMaterialEl.textContent = `+${diff}`;
            this.blackMaterialEl.textContent = '';
        } else if (diff < 0) {
            this.blackMaterialEl.textContent = `+${Math.abs(diff)}`;
            this.whiteMaterialEl.textContent = '';
        } else {
            this.whiteMaterialEl.textContent = '';
            this.blackMaterialEl.textContent = '';
        }
    }

    // --- Evaluation Bar ---
    updateEvalBar() {
        const evalScore = window.chessEngine.evaluateBoard(this.chess);
        // Map centipawns (-1000 to +1000) to percentage (5% to 95%)
        // Sigmoid mapping for smooth scaling
        const winChance = 1 / (1 + Math.pow(10, -evalScore / 400));
        const heightPercent = Math.max(5, Math.min(95, winChance * 100));

        this.evalFillEl.style.height = `${heightPercent}%`;

        const scoreInPawns = (evalScore / 100).toFixed(1);
        if (evalScore >= 0) {
            this.evalWhiteEl.textContent = `+${scoreInPawns}`;
            this.evalBlackEl.textContent = '';
        } else {
            this.evalBlackEl.textContent = scoreInPawns;
            this.evalWhiteEl.textContent = '';
        }
    }

    // --- Status and Opening Detection ---
    updateStatus() {
        const turn = this.chess.turn();
        const turnName = turn === 'w' ? 'White' : 'Black';

        this.statusIndicatorEl.className = `status-indicator ${turn === 'b' ? 'black-turn' : ''}`;

        if (this.chess.in_checkmate()) {
            const winner = turn === 'w' ? 'Black' : 'White';
            this.statusTextEl.textContent = `Checkmate! ${winner} wins.`;
        } else if (this.chess.in_draw()) {
            this.statusTextEl.textContent = "Game Draw!";
        } else if (this.chess.in_check()) {
            this.statusTextEl.textContent = `${turnName} is in Check!`;
        } else {
            this.statusTextEl.textContent = `${turnName} to move`;
        }

        // Detect Opening name
        const historySans = this.chess.history();
        const opening = window.chessEngine.detectOpening(historySans);
        this.openingEl.textContent = opening;
    }

    // --- Move History List ---
    renderHistory() {
        this.movesListEl.innerHTML = '';
        const history = this.chess.history();

        for (let i = 0; i < history.length; i += 2) {
            const row = document.createElement('tr');
            const turnNumber = Math.floor(i / 2) + 1;

            const numCell = document.createElement('td');
            numCell.className = 'move-num';
            numCell.textContent = `${turnNumber}.`;
            row.appendChild(numCell);

            // White move
            const whiteCell = document.createElement('td');
            whiteCell.className = `move-san ${this.viewingHistoryIndex === i + 1 ? 'active-history' : ''}`;
            whiteCell.textContent = history[i];
            whiteCell.addEventListener('click', () => this.reviewHistoryMove(i + 1));
            row.appendChild(whiteCell);

            // Black move (if exists)
            const blackCell = document.createElement('td');
            if (i + 1 < history.length) {
                blackCell.className = `move-san ${this.viewingHistoryIndex === i + 2 ? 'active-history' : ''}`;
                blackCell.textContent = history[i + 1];
                blackCell.addEventListener('click', () => this.reviewHistoryMove(i + 2));
            }
            row.appendChild(blackCell);

            this.movesListEl.appendChild(row);
        }

        // Auto-scroll to bottom of history
        const container = document.querySelector('.history-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    // --- Historical Review / Move Stepping ---
    reviewHistoryMove(index) {
        if (index < 0 || index >= this.historySnapshots.length) return;
        this.viewingHistoryIndex = index;
        const snapshot = this.historySnapshots[index];

        // Temporary board load
        const tempChess = new Chess(snapshot.fen);
        this.renderHistoryBoard(tempChess, snapshot);
        this.renderHistory();

        this.reviewBannerEl.textContent = `Viewing move ${index} of ${this.historySnapshots.length - 1} • Click here to resume live game`;
        this.reviewBannerEl.classList.add('show');
    }

    renderHistoryBoard(tempChess, snapshot) {
        this.boardEl.innerHTML = '';
        const board = tempChess.board();
        const isFlipped = this.orientation === 'b';

        for (let rowIdx = 0; rowIdx < 8; rowIdx++) {
            for (let colIdx = 0; colIdx < 8; colIdx++) {
                const r = isFlipped ? 7 - rowIdx : rowIdx;
                const c = isFlipped ? 7 - colIdx : colIdx;
                const squareName = `${'abcdefgh'[c]}${8 - r}`;
                const piece = board[r][c];

                const squareEl = document.createElement('div');
                squareEl.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
                squareEl.dataset.square = squareName;

                if (snapshot && (snapshot.from === squareName || snapshot.to === squareName)) {
                    squareEl.classList.add('last-move');
                }

                if (piece) {
                    const img = document.createElement('img');
                    img.src = `pieces/${piece.color}${piece.type.toUpperCase()}.svg`;
                    img.className = 'piece';
                    squareEl.appendChild(img);
                }

                this.boardEl.appendChild(squareEl);
            }
        }
    }

    exitHistoryReview() {
        this.viewingHistoryIndex = -1;
        this.reviewBannerEl.classList.remove('show');
        this.renderBoard();
        this.renderHistory();
    }

    // --- Game Over Handling ---
    handleGameOver() {
        this.isGameOver = true;
        this.stopClock();

        let title = "Game Finished";
        let reason = "";

        if (this.chess.in_checkmate()) {
            const winner = this.chess.turn() === 'w' ? 'Black' : 'White';
            title = `${winner} Won!`;
            reason = `Checkmate! ${winner} captured victory.`;
        } else if (this.chess.in_stalemate()) {
            title = "Draw";
            reason = "Stalemate! No legal moves available.";
        } else if (this.chess.in_threefold_repetition()) {
            title = "Draw";
            reason = "Draw by threefold repetition of position.";
        } else if (this.chess.insufficient_material()) {
            title = "Draw";
            reason = "Draw by insufficient material to checkmate.";
        } else if (this.chess.in_draw()) {
            title = "Draw";
            reason = "Draw by 50-move rule.";
        }

        setTimeout(() => this.showGameOverModal(title, reason), 600);
    }

    showGameOverModal(title, subtitle) {
        document.getElementById('gameover-title').textContent = title;
        document.getElementById('gameover-reason').textContent = subtitle;
        this.gameOverModal.classList.add('active');
    }

    // --- Interactive Actions: Undo, Hint, Flip, Resign ---
    undoMove() {
        if (this.isGameOver || this.viewingHistoryIndex !== -1) return;

        if (this.gameMode === 'ai') {
            // Undo AI's move AND player's move so player can try again
            this.chess.undo();
            this.chess.undo();
            if (this.historySnapshots.length > 2) {
                this.historySnapshots.splice(-2);
            }
        } else {
            this.chess.undo();
            if (this.historySnapshots.length > 1) {
                this.historySnapshots.pop();
            }
        }

        this.lastMove = null;
        this.selectedSquare = null;
        this.legalMovesForSelected = [];
        this.hintSquares = null;
        this.renderBoard();
        this.updateStatus();
        this.updateCapturedPieces();
        this.updateEvalBar();
        this.renderHistory();
    }

    showHint() {
        if (this.isGameOver || this.viewingHistoryIndex !== -1) return;
        const bestMove = window.chessEngine.findBestMove(this.chess, 3);
        if (bestMove) {
            this.hintSquares = { from: bestMove.from, to: bestMove.to };
            this.renderBoard();
            setTimeout(() => {
                this.hintSquares = null;
                this.renderBoard();
            }, 3000);
        }
    }

    flipBoard() {
        this.orientation = this.orientation === 'w' ? 'b' : 'w';
        this.renderBoard();
    }

    resignGame() {
        if (this.isGameOver) return;
        if (!confirm("Are you sure you want to resign this game?")) return;

        this.isGameOver = true;
        this.stopClock();
        const loser = this.orientation === 'w' ? 'White' : 'Black';
        const winner = loser === 'White' ? 'Black' : 'White';
        window.chessAudio.playGameEnd(false);
        this.showGameOverModal(`${winner} Won!`, `${loser} resigned.`);
    }

    offerDraw() {
        if (this.isGameOver) return;
        if (this.gameMode === 'ai') {
            const score = window.chessEngine.evaluateBoard(this.chess);
            // AI accepts draw if evaluation is roughly even (-150 to +150 centipawns)
            if (Math.abs(score) <= 150) {
                this.isGameOver = true;
                this.stopClock();
                window.chessAudio.playGameEnd(true);
                this.showGameOverModal("Draw Agreed", "The Computer accepted your draw offer.");
            } else {
                alert("Computer declines the draw offer. Keep playing!");
            }
        } else {
            if (confirm("Opponent offers a draw. Do you accept?")) {
                this.isGameOver = true;
                this.stopClock();
                window.chessAudio.playGameEnd(true);
                this.showGameOverModal("Draw Agreed", "Both players agreed to a draw.");
            }
        }
    }

    // --- UI Controls and Event Listeners ---
    initEventListeners() {
        // Top Nav Buttons
        document.getElementById('btn-new-game').addEventListener('click', () => {
            this.newGameModal.classList.add('active');
        });
        document.getElementById('btn-theme').addEventListener('click', () => {
            const themes = ['emerald', 'wood', 'slate', 'midnight'];
            const currentTheme = document.body.dataset.theme || 'emerald';
            const nextTheme = themes[(themes.indexOf(currentTheme) + 1) % themes.length];
            document.body.dataset.theme = nextTheme;
            localStorage.setItem('chess_theme', nextTheme);
        });
        document.getElementById('btn-sound').addEventListener('click', (e) => {
            const muted = !window.chessAudio.muted;
            window.chessAudio.setMuted(muted);
            e.currentTarget.textContent = muted ? '🔇' : '🔊';
        });

        // Review banner click
        this.reviewBannerEl.addEventListener('click', () => this.exitHistoryReview());

        // Action panel buttons
        document.getElementById('btn-hint').addEventListener('click', () => this.showHint());
        document.getElementById('btn-undo').addEventListener('click', () => this.undoMove());
        document.getElementById('btn-flip').addEventListener('click', () => this.flipBoard());
        document.getElementById('btn-resign').addEventListener('click', () => this.resignGame());
        document.getElementById('btn-draw').addEventListener('click', () => this.offerDraw());

        // Modals close / confirm
        document.getElementById('btn-play-again').addEventListener('click', () => {
            this.gameOverModal.classList.remove('active');
            this.startNewGame();
        });
        document.getElementById('btn-review-game').addEventListener('click', () => {
            this.gameOverModal.classList.remove('active');
            this.reviewHistoryMove(0);
        });

        // New Game modal setup
        this.initNewGameModal();

        // Restore saved theme
        const savedTheme = localStorage.getItem('chess_theme');
        if (savedTheme) {
            document.body.dataset.theme = savedTheme;
        }

        // Restore saved sound state
        if (window.chessAudio.muted) {
            document.getElementById('btn-sound').textContent = '🔇';
        }
    }

    initNewGameModal() {
        const setupPillGroup = (groupId, callback) => {
            const container = document.getElementById(groupId);
            if (!container) return;
            container.querySelectorAll('.pill-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    container.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    callback(btn.dataset.val);
                });
            });
        };

        let chosenMode = 'ai';
        let chosenLevel = 2;
        let chosenSide = 'w';
        let chosenTime = 600;
        let chosenSpeed = 'medium';

        setupPillGroup('group-mode', val => chosenMode = val);
        setupPillGroup('group-difficulty', val => chosenLevel = parseInt(val));
        setupPillGroup('group-side', val => chosenSide = val);
        setupPillGroup('group-time', val => chosenTime = parseInt(val));
        setupPillGroup('group-speed', val => chosenSpeed = val);

        document.getElementById('btn-start-game').addEventListener('click', () => {
            this.gameMode = chosenMode;
            this.aiLevel = chosenLevel;
            this.playerSide = chosenSide;
            this.timePreset = chosenTime;
            this.moveSpeed = chosenSpeed;

            // Update opponent name/rating in UI
            const oppNameEl = document.getElementById('opponent-name');
            const oppRatingEl = document.getElementById('opponent-rating');
            const oppAvatarEl = document.getElementById('opponent-avatar');

            if (this.gameMode === 'ai') {
                const levels = { 1: ['Easy Bot', '800', '🤖'], 2: ['Medium Bot', '1400', '🧠'], 3: ['Grandmaster Bot', '2000', '⚡'] };
                const [name, rating, avatar] = levels[this.aiLevel] || levels[2];
                oppNameEl.textContent = name;
                oppRatingEl.textContent = rating;
                oppAvatarEl.textContent = avatar;
            } else {
                oppNameEl.textContent = 'Player 2';
                oppRatingEl.textContent = 'Pass & Play';
                oppAvatarEl.textContent = '👤';
            }

            this.newGameModal.classList.remove('active');
            this.startNewGame();
        });

        document.getElementById('btn-cancel-game').addEventListener('click', () => {
            this.newGameModal.classList.remove('active');
        });
    }
}

// Instantiate game on load
window.addEventListener('DOMContentLoaded', () => {
    window.game = new ChessGame();
    // Unlock Web Audio API on first mobile user gesture
    const unlockAudio = () => {
        if (window.chessAudio) window.chessAudio.init();
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('click', unlockAudio);
    };
    document.addEventListener('touchstart', unlockAudio, { passive: true });
    document.addEventListener('click', unlockAudio, { passive: true });
});
