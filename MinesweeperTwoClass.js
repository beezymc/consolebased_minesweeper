
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

//The Minesweeper View 
class SweepView {
    constructor (boardSide) {
        this.boardSide = boardSide; //The printed board is X by X size, where X is the initial boardSide given by the user.
    }
    //this method takes in data from the Model and prints it into the console. 
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

    //this method adds padding to minesweeper cells to keep row/column alignment when row/column heading numbers get to double or triple digits.  
    addSpace = (current, target) => {
        while (current.length < target.length + 1) {
            current += " ";
        }
        return current;
    }

    // this method determines what value is to be printed in a given cell depending on the data provided by the Model: 
    // '?' by default,
    // '*' if the cell is revealed by the user and it has a bomb value,
    //  the number value corresponding to the number of adjacent bombs if the user-revealed cell is not a bomb,
    //  and blank if that value is 0.
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

    //This method checks if a user input is valid; it expects an x,y coordinate and throws an error otherwise.
    parseInput = (cell) => {
        const res = cell.split(",");
        if (res.length !== 2) throw new Error ("Please reenter a valid input.");
        const y = parseInt(res[0]);
        const x = parseInt(res[1]);
        if (isNaN(x) || isNaN(y)) throw new Error ("Please reenter a valid input.");
        return { x, y };
    }

    //This is the Minesweeper run method, which runs recursively until either a 'won' or 'lost' condition is hit (as determined by the model).
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

//The Minesweeper Model
class SweepModel {
    constructor (boardSide, bombCount) {
        this.boardSide = boardSide; //The model board is X by X size, where X is the initial boardSide given by the user. This should match the view.
        this.remainingCells = boardSide * boardSide; //value to be tracked that triggers the win condition
        this.bombCount = bombCount; //This value represents the number of bombs the user wishes to place when the game is initialized. 
        this.board = this.createBoard();
        this.state = "ongoing"; //ongoing, won, lost
    }

    //This method generates the Model for the game board, which is stored in a 2-D array.
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

    //This method places bombs (not entirely) randomly into the model until all bombs are placed in unique cells.
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

    //This method gives each cell a number value by finding bombs within the board and incrementing the value of adjacent cells by 1.
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

    //This method generates coordinate pairs of existing neighbor cells to a given cell.
    getNeighbors = (i, j) => {
        const offset = [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, -1], [-1, 1], [1, -1]]
        return offset.map(x => [x[0] + i, x[1] + j]).filter(x => this.isWithinBounds(x[0], x[1]));
    }

    //This method checks if a given coordinate pair is within the bounds of the board, returning true if so/false if not.
    isWithinBounds = (x, y) => x >= 0 && x < this.boardSide && y >= 0 && y < this.boardSide;

    //This method takes in the user's coordinate pair given in the View, 
    //and returns the current board and game state to the View if the input was valid, and once the Model has been updated.
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

    //This method checks if the user-provided coordinate pair was valid as relates to the model (it's within board bounds and the value wasn't already revealed).
    isInputValid = (x, y) => {
        if (!this.isWithinBounds(x, y)) return false;
        if (this.board[x][y].isVisible) return false;
        return true;
    }

    //Given the user-provided coordinate pair is valid, this method makes cells visible. 
    //If the value of a cell is 0, it recursively turns adjacent cells visible until non-zero values are flipped.
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

    //this method updates the state of the game to 'lost' or 'won' if either condition is hit:
    //the revealed cell is a bomb,
    //or the only cells that remain on the board are bombs.
    updateState = (x, y) => {
        if (this.board[x][y].isBomb) {
            this.state = "lost";
        } else if (this.remainingCells === this.bombCount) {
            this.state = "won";
        }
    }

}

//initial values; can be changed here if desired. Note that boardSide must be below a certain value (depending on user display) to display properly.
const boardSide = 5;
const bombCount = 1;

const sweeperModel = new SweepModel(boardSide, bombCount);
const sweeperView = new SweepView(boardSide);


sweeperView.run();
