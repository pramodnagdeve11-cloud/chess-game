// Chess AI Engine & Evaluation
// Supports Piece-Square Tables, Alpha-Beta Minimax, Move Ordering, and Opening Recognition

const PIECE_VALUES = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
};

// Piece-Square Tables (White perspective, rank 8 down to rank 1)
const PST = {
    p: [
        [  0,  0,  0,  0,  0,  0,  0,  0 ],
        [ 50, 50, 50, 50, 50, 50, 50, 50 ],
        [ 10, 10, 20, 30, 30, 20, 10, 10 ],
        [  5,  5, 10, 25, 25, 10,  5,  5 ],
        [  0,  0,  0, 20, 20,  0,  0,  0 ],
        [  5, -5,-10,  0,  0,-10, -5,  5 ],
        [  5, 10, 10,-20,-20, 10, 10,  5 ],
        [  0,  0,  0,  0,  0,  0,  0,  0 ]
    ],
    n: [
        [-50,-40,-30,-30,-30,-30,-40,-50 ],
        [-40,-20,  0,  0,  0,  0,-20,-40 ],
        [-30,  0, 10, 15, 15, 10,  0,-30 ],
        [-30,  5, 15, 20, 20, 15,  5,-30 ],
        [-30,  0, 15, 20, 20, 15,  0,-30 ],
        [-30,  5, 10, 15, 15, 10,  5,-30 ],
        [-40,-20,  0,  5,  5,  0,-20,-40 ],
        [-50,-40,-30,-30,-30,-30,-40,-50 ]
    ],
    b: [
        [-20,-10,-10,-10,-10,-10,-10,-20 ],
        [-10,  0,  0,  0,  0,  0,  0,-10 ],
        [-10,  0,  5, 10, 10,  5,  0,-10 ],
        [-10,  5,  5, 10, 10,  5,  5,-10 ],
        [-10,  0, 10, 10, 10, 10,  0,-10 ],
        [-10, 10, 10, 10, 10, 10, 10,-10 ],
        [-10,  5,  0,  0,  0,  0,  5,-10 ],
        [-20,-10,-10,-10,-10,-10,-10,-20 ]
    ],
    r: [
        [  0,  0,  0,  0,  0,  0,  0,  0 ],
        [  5, 10, 10, 10, 10, 10, 10,  5 ],
        [ -5,  0,  0,  0,  0,  0,  0, -5 ],
        [ -5,  0,  0,  0,  0,  0,  0, -5 ],
        [ -5,  0,  0,  0,  0,  0,  0, -5 ],
        [ -5,  0,  0,  0,  0,  0,  0, -5 ],
        [ -5,  0,  0,  0,  0,  0,  0, -5 ],
        [  0,  0,  0,  5,  5,  0,  0,  0 ]
    ],
    q: [
        [-20,-10,-10, -5, -5,-10,-10,-20 ],
        [-10,  0,  0,  0,  0,  0,  0,-10 ],
        [-10,  0,  5,  5,  5,  5,  0,-10 ],
        [ -5,  0,  5,  5,  5,  5,  0, -5 ],
        [  0,  0,  5,  5,  5,  5,  0, -5 ],
        [-10,  5,  5,  5,  5,  5,  0,-10 ],
        [-10,  0,  5,  0,  0,  0,  0,-10 ],
        [-20,-10,-10, -5, -5,-10,-10,-20 ]
    ],
    k: [
        [-30,-40,-40,-50,-50,-40,-40,-30 ],
        [-30,-40,-40,-50,-50,-40,-40,-30 ],
        [-30,-40,-40,-50,-50,-40,-40,-30 ],
        [-30,-40,-40,-50,-50,-40,-40,-30 ],
        [-20,-30,-30,-40,-40,-30,-30,-20 ],
        [-10,-20,-20,-20,-20,-20,-20,-10 ],
        [ 20, 20,  0,  0,  0,  0, 20, 20 ],
        [ 20, 30, 10,  0,  0, 10, 30, 20 ]
    ]
};

// Common Chess Openings Dictionary
const OPENINGS = [
    { pgn: "e4 e5 Nf3 Nc6 Bc4", name: "Italian Game" },
    { pgn: "e4 e5 Nf3 Nc6 Bb5", name: "Ruy Lopez (Spanish Opening)" },
    { pgn: "e4 e5 Nf3 Nc6 d4", name: "Scotch Game" },
    { pgn: "e4 e5 Nf3 Nf6", name: "Petrov's Defense" },
    { pgn: "e4 e5 f4", name: "King's Gambit" },
    { pgn: "e4 c5 Nf3 d6", name: "Sicilian Defense (Classical)" },
    { pgn: "e4 c5 Nf3 Nc6", name: "Sicilian Defense (Old Sicilian)" },
    { pgn: "e4 c5 Nf3 e6", name: "Sicilian Defense (French Variation)" },
    { pgn: "e4 c5", name: "Sicilian Defense" },
    { pgn: "e4 e6", name: "French Defense" },
    { pgn: "e4 c6", name: "Caro-Kann Defense" },
    { pgn: "e4 d5", name: "Scandinavian Defense" },
    { pgn: "e4 d6", name: "Pirc Defense" },
    { pgn: "e4 g6", name: "Modern Defense" },
    { pgn: "d4 d5 c4 e6", name: "Queen's Gambit Declined" },
    { pgn: "d4 d5 c4 dxc4", name: "Queen's Gambit Accepted" },
    { pgn: "d4 d5 c4 c6", name: "Slav Defense" },
    { pgn: "d4 d5 c4", name: "Queen's Gambit" },
    { pgn: "d4 d5 Bf4", name: "London System" },
    { pgn: "d4 d5 Nf3 Nf6 Bf4", name: "London System" },
    { pgn: "d4 Nf6 c4 g6", name: "King's Indian Defense" },
    { pgn: "d4 Nf6 c4 e6", name: "Nimzo-Indian / Queen's Indian" },
    { pgn: "d4 Nf6 c4 c5", name: "Benoni Defense" },
    { pgn: "d4 f5", name: "Dutch Defense" },
    { pgn: "c4", name: "English Opening" },
    { pgn: "Nf3", name: "Reti Opening" },
    { pgn: "f4", name: "Bird's Opening" },
    { pgn: "b3", name: "Nimzo-Larsen Attack" }
];

class ChessEngine {
    constructor() {
        this.cache = new Map();
    }

    // Evaluate position from White's perspective (positive = White leads, negative = Black leads)
    evaluateBoard(chess) {
        if (chess.in_checkmate()) {
            return chess.turn() === 'w' ? -99999 : 99999;
        }
        if (chess.in_draw() || chess.in_stalemate() || chess.in_threefold_repetition()) {
            return 0;
        }

        const board = chess.board();
        let totalScore = 0;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (!piece) continue;

                const val = PIECE_VALUES[piece.type] || 0;
                let posVal = 0;

                if (PST[piece.type]) {
                    // For white: row r, col c
                    // For black: invert row (7 - r)
                    if (piece.color === 'w') {
                        posVal = PST[piece.type][r][c];
                    } else {
                        posVal = PST[piece.type][7 - r][c];
                    }
                }

                const pieceTotal = val + posVal;
                if (piece.color === 'w') {
                    totalScore += pieceTotal;
                } else {
                    totalScore -= pieceTotal;
                }
            }
        }

        return totalScore;
    }

    // Order moves to optimize Alpha-Beta pruning
    orderMoves(moves) {
        return moves.sort((a, b) => {
            let scoreA = 0;
            let scoreB = 0;

            if (a.captured) {
                const victim = PIECE_VALUES[a.captured] || 100;
                const attacker = PIECE_VALUES[a.piece] || 100;
                scoreA += 1000 + (victim * 10 - attacker);
            }
            if (b.captured) {
                const victim = PIECE_VALUES[b.captured] || 100;
                const attacker = PIECE_VALUES[b.piece] || 100;
                scoreB += 1000 + (victim * 10 - attacker);
            }

            if (a.promotion) scoreA += 900;
            if (b.promotion) scoreB += 900;

            if (a.san.includes('+')) scoreA += 50;
            if (b.san.includes('+')) scoreB += 50;

            return scoreB - scoreA;
        });
    }

    // Minimax search with alpha-beta pruning
    minimax(chess, depth, alpha, beta, isMaximizing) {
        if (depth === 0 || chess.game_over()) {
            return { score: this.evaluateBoard(chess) };
        }

        const rawMoves = chess.moves({ verbose: true });
        const moves = this.orderMoves(rawMoves);

        let bestMove = null;

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of moves) {
                chess.move(move);
                const evaluation = this.minimax(chess, depth - 1, alpha, beta, false).score;
                chess.undo();

                if (evaluation > maxEval) {
                    maxEval = evaluation;
                    bestMove = move;
                }
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) break; // Beta cutoff
            }
            return { score: maxEval, move: bestMove };
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                chess.move(move);
                const evaluation = this.minimax(chess, depth - 1, alpha, beta, true).score;
                chess.undo();

                if (evaluation < minEval) {
                    minEval = evaluation;
                    bestMove = move;
                }
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) break; // Alpha cutoff
            }
            return { score: minEval, move: bestMove };
        }
    }

    // Get best move based on difficulty
    // level: 1 (Easy), 2 (Medium), 3 (Hard)
    findBestMove(chess, level = 2) {
        const moves = chess.moves({ verbose: true });
        if (moves.length === 0) return null;

        const isWhite = chess.turn() === 'w';

        // Level 1: Casual/Easy - 70% 1-ply tactical, 30% random
        if (level === 1) {
            if (Math.random() < 0.35) {
                return moves[Math.floor(Math.random() * moves.length)];
            }
            const result = this.minimax(chess, 1, -Infinity, Infinity, isWhite);
            return result.move || moves[0];
        }

        // Level 2: Medium - 2-ply Minimax
        if (level === 2) {
            const result = this.minimax(chess, 2, -Infinity, Infinity, isWhite);
            return result.move || moves[0];
        }

        // Level 3: Hard - 3-ply Minimax with deep search & Alpha-Beta
        if (level >= 3) {
            const result = this.minimax(chess, 3, -Infinity, Infinity, isWhite);
            return result.move || moves[0];
        }

        return moves[0];
    }

    // Identify opening from moves history
    detectOpening(historySans) {
        if (!historySans || historySans.length === 0) return "Starting Position";
        const playedMoves = historySans.join(" ");

        let matched = null;
        for (const op of OPENINGS) {
            if (playedMoves.startsWith(op.pgn) || playedMoves === op.pgn) {
                if (!matched || op.pgn.length > matched.pgn.length) {
                    matched = op;
                }
            }
        }
        return matched ? matched.name : (historySans.length > 8 ? "Middlegame" : "Custom Opening");
    }
}

window.chessEngine = new ChessEngine();
