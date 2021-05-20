
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

class SweepView {
    constructor (boardSide) {
        this.boardSide = boardSide;
    }

    display = (data) => {
        const boardSideString = this.boardSide + "";
        let boardDisplayString = " " + this.addSpace("", boardSideString) + "| ";
        for (let i = 0; i < this.boardSide; i++) {
            boardDisplayString += this.addSpace(i + "", boardSideString) + "| ";
        }
        const dividerLength = boardDisplayString.length;
        let dash = "";
        for (let i = 0; i < dividerLength; i++) {
            dash += "-";
        }
        boardDisplayString += "\n" + dash + "\n ";
        for (let i = 0; i < this.boardSide; i++) {
            boardDisplayString += this.addSpace(i + "", boardSideString) + "| ";
            for (let j = 0; j < this.boardSide; j++) {
                boardDisplayString += this.addSpace(this.printValue(data.board[i][j]), boardSideString) + "| ";
            }
            boardDisplayString += "\n" + dash + "\n ";
        }
        console.log(boardDisplayString);
    }

    addSpace = (current, target) => {
        while (current.length < target.length + 1) {
            current += " ";
        }
        return current;
    }

    printValue = (data) => {
        if (data.isVisible === false) {
            return "?"
        } else if (data.isBomb === true) {
            return "*";
        } else if (data.value > 0) {
            return data.value + "";
        } else {
            return " ";
        }
    }

    parseInput = (cell) => {
        const res = cell.split(",");
        if (res.length !== 2) throw new Error ("Please reenter a valid input.");
        const y = parseInt(res[0]);
        const x = parseInt(res[1]);
        if (isNaN(x) || isNaN(y)) throw new Error ("Please reenter a valid input.");
        return { x, y };
    }

    run = () => {
        rl.question('Please enter the coordinates of the cell you would like to search: ', (searchCell) => {
            try {
                const { x, y } = this.parseInput(searchCell);
                const data = sweeperModel.userMove(x, y);
                if (!data) throw new Error ("Please reenter a valid input.")
                this.display(data);
                if (data.state === "lost") {
                    console.log("You've exploded! Please play again.")
                    return rl.close();
                } else if (data.state === "won") {
                    console.log("You've disarmed the bombs! Congrats");
                    return rl.close();
                }
            } catch (err) {
                console.log(err.message);
            }
            this.run();
        });
    }
}

class SweepModel {
    constructor (boardSide, bombCount) {
        this.boardSide = boardSide;
        this.remainingCells = boardSide * boardSide;
        this.bombCount = bombCount;
        this.board = this.createBoard();
        this.state = "ongoing"; //ongoing, won, lost
    }

    createBoard = () => {
        let board = new Array(this.boardSide);
        for (let i = 0; i < this.boardSide; i++) {
            board[i] = new Array(this.boardSide);
            for (let j = 0; j < this.boardSide; j++) {
                board[i][j] = {
                    isVisible: false,
                    value: 0,
                    isBomb: false
                }
            }
        }
        this.placeBombs(board);
        this.countAdjacentBombs(board);
        return board;
    }

    placeBombs = (board) => {
        let i = 0;
        while(i < this.bombCount) {
            let x = Math.floor(Math.random() * this.boardSide);
            let y = Math.floor(Math.random() * this.boardSide);
            if (board[x][y].isBomb !== true) {
                board[x][y].isBomb = true;
                i++;
            }
        }
    }

    countAdjacentBombs = (board) => {
        for (let i = 0; i < this.boardSide; i++) {
            for (let j = 0; j < this.boardSide; j++) {
                if (board[i][j].isBomb) {
                    const neighbors = this.getNeighbors(i, j);
                    for (let neighbor of neighbors) {
                        board[neighbor[0]][neighbor[1]].value += 1;
                    }
                }
            }
        }
    }

    getNeighbors = (i, j) => {
        const offset = [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, -1], [-1, 1], [1, -1]]
        return offset.map(x => [x[0] + i, x[1] + j]).filter(x => this.isWithinBounds(x[0], x[1]));
    }

    isWithinBounds = (x, y) => x >= 0 && x < this.boardSide && y >= 0 && y < this.boardSide;

    userMove = (x, y) => {
        if(this.isInputValid(x, y)) {
            this.showCell(x, y);
            this.updateState(x, y);
            return { 
                board: this.board,
                state: this.state
            };
        }
        return null;
    }

    isInputValid = (x, y) => {
        if (!this.isWithinBounds(x, y)) return false;
        if (this.board[x][y].isVisible) return false;
        return true;
    }

    showCell = (x, y) => {
        if (this.board[x][y].isVisible) return;
        this.board[x][y].isVisible = true;
        this.remainingCells -= 1;
        if (this.board[x][y].value !== 0) return;
        const neighbors = this.getNeighbors(x, y);
        for (let neighbor of neighbors) {
            this.showCell(neighbor[0], neighbor[1])
        }
    }

    updateState = (x, y) => {
        if (this.board[x][y].isBomb) {
            this.state = "lost";
        } else if (this.remainingCells === this.bombCount) {
            this.state = "won";
        }
    }

}

const boardSide = 5;
const bombCount = 1;

const sweeperModel = new SweepModel(boardSide, bombCount);
const sweeperView = new SweepView(boardSide);


sweeperView.run();