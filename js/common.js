commonPuzzle = function(puzzleData, controls) {
  this.NONE = "0";
  this.BOTTOM_RIGHT = "2";
  this.FOUR_SIDES = "4";
  this.id = puzzleData.id;
  this.typeCode = puzzleData.typeCode;
  this.parseDimension(puzzleData.dimension);
  this.cluePosition = this.outerCluePosition();
  this.initImages();
  this.createBoard();
  this.steps = [];
  this.initControls(controls);
}

commonPuzzle.prototype.parseDimension = function(dimension) {
  // Parse dimension string to values.
  var dimensions = dimension.split("x");
  this.rows = parseInt(dimensions[1]);
  this.cols = parseInt(dimensions[0]);
}

commonPuzzle.prototype.initImages = function() {
  // Images used for the given puzzle type.
  this.clues = [];
  this.togglers = [];
  this.togglers = ["white"];
  this.preloadImages(this.clues);
  this.preloadImages(this.togglers);
}

commonPuzzle.prototype.start = function() {
  this.pencilMarkMode = false;
  this.removeMessages();
  // Read clues from server and start the puzzle solving.
  $.getJSON("/puzzles/" + this.id + "/start")
    .done(data => this.showClues(data))
    .fail((jqxhr, textStatus, error) => {this.message = showError(jqxhr.responseText);});
}

commonPuzzle.prototype.check = function() {
  var data = this.collectData(true, false);
  this.removeMessages();
  // Read result from server and show.
  $.post("/puzzles/" + this.id + "/check", data)
    .done(response => this.showResult(response))
    .fail((jqxhr, textStatus, error) => {this.message = showError(jqxhr.responseText);});
}

commonPuzzle.prototype.collectData = function(needWhites, needClues) {
  var data = {};
  for (var y = 0; y < this.rows; y++) {
    for (var x = 0; x < this.cols; x++) {
      var collect = true;
      if (this.cells[y][x].isClue && !needClues) {
        collect = false;
      }
      if (this.cells[y][x].value == "white" && !needWhites) {
        collect = false;
      }
      if (collect) {
        var coord = String.fromCharCode('a'.charCodeAt(0) + x) + (y+1).toString();
        data[coord] = this.cells[y][x].value;
      }
    }
  }
  if (needClues) {
    if (this.bottom) {
      data["bottom"] = [];
      for (var x = 0; x < this.cols; x++) {
        data["bottom"].push(this.bottom[x].value);
      }
    }
    if (this.top) {
      data["top"] = [];
      for (var x = 0; x < this.cols; x++) {
        data["top"].push(this.top[x].value);
      }
    }
    if (this.right) {
      data["right"] = [];
      for (var y = 0; y < this.rows; y++) {
        data["right"].push(this.right[y].value);
      }
    }
    if (this.left) {
      data["left"] = [];
      for (var y = 0; y < this.rows; y++) {
        data["left"].push(this.left[y].value);
      }
    }
  }
  return data;
}

commonPuzzle.prototype.edit = function() {
  this.removeMessages();
  $(this.controls.revertBtn).show().prop('disabled', true);
  $(this.controls.saveBtn).show().prop('disabled', true);
  // Read clues from server and start the puzzle solving.
  $.getJSON("/puzzles/" + this.id + "/get")
    .done(data => this.showForEdit(data))
    .fail((jqxhr, textStatus, error) => {this.message = showError(jqxhr.responseText);});
}

commonPuzzle.prototype.save = function() {
  var data = this.collectData(false, true);
  this.removeMessages();
  // Read result from server and show.
  $.post("/puzzles/" + (this.id ? this.id: "0") + "/edit", data)
    .done(response => this.showSaveResult(response))
    .fail((jqxhr, textStatus, error) => {this.message = showError(jqxhr.responseText);});
}

commonPuzzle.prototype.addStep = function(cell, data ) {
  this.steps.push({cell: cell, data: data});
  $(this.controls.checkBtn).prop('disabled', false);
  $(this.controls.saveBtn).prop('disabled', false);
  $(this.controls.revertBtn).prop('disabled', false);
}

commonPuzzle.prototype.revertStep = function() {
  if (this.steps.length > 0) {
    var step = this.steps.pop(this);
    step.cell.revertTo(step.data);
  }
  if (this.steps.length == 0) {
    $(this.controls.checkBtn).prop('disabled', true);
    $(this.controls.saveBtn).prop('disabled', true);
    $(this.controls.revertBtn).prop('disabled', true);
  }
}

commonPuzzle.prototype.render = function(snap) {
  // Draw puzzle grid
  this.snap = snap;
  this.findCellSize();
  this.gridProperty = {
    fill: "#fff",
    stroke: "#000",
    strokeWidth: 1,
    boldWidth: this.cellSize < 48 ? 4: this.cellSize/12
  }
  var board = this.snap.rect(this.leftGap, this.topGap, this.cols * this.cellSize, this.rows * this.cellSize);
  board.attr({
      fill: this.gridProperty.fill,
      stroke: this.gridProperty.stroke,
      strokeWidth: this.gridProperty.boldWidth
  });
  this.allCells.forEach(cell=>cell.renderCell())
  var edge = this.snap.rect(this.leftGap, this.topGap, this.cols * this.cellSize, this.rows * this.cellSize);
  edge.attr({
      fill: "none",
      stroke: this.gridProperty.stroke,
      strokeWidth: this.gridProperty.boldWidth
  });
  var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  this.snap.node.setAttribute("height", this.snap.getBBox().height + this.cellSize / (isSafari ? 2 : 4));
}

commonPuzzle.prototype.createBoard = function() {
  // Create 2D array of Cells
  this.cells = [];
  this.allCells = [];
  for (var y = 0; y < this.rows; y++) {
    this.cells[y] = new Array(this.cols);
    for (var x = 0; x < this.cols; x++) {
      this.cells[y][x] = new squarePuzzleCell(this, x, y);
      this.allCells.push(this.cells[y][x]);
    }
  }
  if (this.cluePosition == this.BOTTOM_RIGHT || this.cluePosition == this.FOUR_SIDES) {
    this.bottom = [];
    for (var x = 0; x < this.cols; x++) {
      this.bottom[x] = new squarePuzzleCell(this, x, this.rows);
      this.allCells.push(this.bottom[x]);
    }
    this.right = [];
    for (var y = 0; y < this.rows; y++) {
      this.right[y] = new squarePuzzleCell(this, this.cols, y);
      this.allCells.push(this.right[y]);
    }
  }
  if (this.cluePosition == this.FOUR_SIDES) {
    this.top = [];
    for (var x = 0; x < this.cols; x++) {
      this.top[x] = new squarePuzzleCell(this, x, -1);
      this.allCells.push(this.top[x]);
    }
    this.left = [];
    for (var y = 0; y < this.rows; y++) {
      this.left[y] = new squarePuzzleCell(this, -1, y);
      this.allCells.push(this.left[y]);
    }
  }
}

commonPuzzle.prototype.findCellSize = function() {
  // Find cell size based on size of the window.
  var hSizeLimit = this.snap.node.clientWidth*0.90;
  var vSizeLimit = window.innerHeight*0.57;
  var cols = this.cols;
  var rows = this.rows;
  if (this.cluePosition == this.BOTTOM_RIGHT) {
    cols++;
    rows++;
  } else if (this.cluePosition == this.FOUR_SIDES) {
    cols = cols + 2;
    rows = rows + 2;
  }
  this.cellSize = Math.min(hSizeLimit / cols, vSizeLimit / rows);
  this.leftGap = (this.snap.node.clientWidth - this.cellSize * cols)/2;
  this.topGap = 1;
  if (this.cluePosition == this.FOUR_SIDES) {
    this.topGap = this.topGap + this.cellSize;
    this.leftGap = this.leftGap + this.cellSize;
  }
}
 
commonPuzzle.prototype.preloadImages = function(imageList) {
  // Preload images to prevent delays when solving.
  imageList.forEach(name => new Image().src = this.imageUrl(name));
}

commonPuzzle.prototype.imageUrl = function(imageName) {
  // Url for image with the given name.
  return "/images/"+imageName+".png";
}

commonPuzzle.prototype.showClues = function(data) {
  // Parse clues.
  for (const [key, value] of Object.entries(data)) {
    if (key=="bottom") {
      if (this.bottom) {
        for (var i=0;i<value.length;i++) {
          this.bottom[i].setClue(value[i]);
        }
      }
    } else if (key=="right") {
      if (this.right) {
        for (var i=0;i<value.length;i++) {
          this.right[i].setClue(value[i]);
        }
      }
    } else if (key=="top") {
      if (this.top) {
        for (var i=0;i<value.length;i++) {
          this.top[i].setClue(value[i]);
        }
      }
    } else if (key=="left") {
      if (this.left) {
        for (var i=0;i<value.length;i++) {
          this.left[i].setClue(value[i]);
        }
      }
    } else {
      var x = key.charCodeAt(0) - 'a'.charCodeAt(0);
      var y = parseInt(key.substring(1)) - 1;
      this.cells[y][x].setClue(value);
    }
  }
  // All non-clue cells are general togglable.
  this.allCells.forEach(cell=> {
    if (!cell.isClue) {
      cell.setRegular(this.togglers);
    }
    cell.syncCell();
  });
  this.startTimer();
  $(this.controls.startBtn).html('Restart');
  $(this.controls.revertBtn).show().prop('disabled', true);
  $(this.controls.checkBtn).show().prop('disabled', true);
  $(this.controls.pencilMarkCtrl).show();
  $(this.controls.pencilMarkCb).prop( "checked", false );
}

commonPuzzle.prototype.startTimer = function() {
  if (!this.controls.timer || this.timer) {
    return;
  }
  self = this;
  this.startTime = new Date();
  this.showTime();
  this.timer = setInterval(() => self.showTime(),1000);
}

commonPuzzle.prototype.stopTimer = function() {
  if (this.timer) {
    clearInterval(this.timer);
    this.timer = null;
  }
}

commonPuzzle.prototype.showTime = function() {
  var formatNumber = function(num){
    if (num < 10) return '0' + num.toString();
    return num.toString();
  }
  var currentTime = new Date();
  var d = Math.round((currentTime.getTime() - this.startTime.getTime()) / 1000);
  var mins = Math.floor(d / 60);
  var secs = d - mins * 60;
  var hours = Math.floor(mins / 60);
  mins = mins - hours * 60;
  hours = hours > 0?formatNumber(hours)+":":"";
  mins = formatNumber(mins) + ":";
  secs = formatNumber(secs);
  $(this.controls.timer).show().text(hours + mins + secs);
}

commonPuzzle.prototype.showSaveResult = function(result) {
  this.removeMessages();
  if (result.status == 'OK') {
    this.stopTimer();
    this.message = showMessage("The puzzle has been saved!");
  } else {
    this.message = showError("Error while saving. " + result.status + ".");
    this.showErrorCells(result);
  }
}

commonPuzzle.prototype.showResult = function(result) {
  this.removeMessages();
  if (result.status == 'OK') {
    this.stopTimer();
    this.message = showMessage("Congratulations! The puzzle has been solved correctly!");
  } else {
    this.message = showError("Sorry, there is a mistake. " + result.status + ". Try again.");
    this.showErrorCells(result);
  }
}

commonPuzzle.prototype.showErrorCells = function(result) {
  if (result.errors) {
    result.errors.forEach(coord => {
      var x = coord.charCodeAt(0) - 'a'.charCodeAt(0);
      var y = parseInt(coord.substring(1)) - 1;
      this.cells[y][x].markError();
    });
  }
}

commonPuzzle.prototype.removeMessages = function() {
  if (this.message) {
    this.message.remove();
    this.message = null;
  }
}

commonPuzzle.prototype.showForEdit = function (data) {
  this.showClues(data);
  var editTogglers = ["white"].concat(this.clues);
  // All non-clue cells are general togglable.
  this.allCells.forEach(cell=> {
    var index = editTogglers.indexOf(cell.value);
    cell.setRegular(editTogglers);
    cell.setValue(index);
  });
}

commonPuzzle.prototype.initControls = function (controls) {
  self = this;
  this.controls = controls;
  $(this.controls.startBtn).click(() => self.start());
  $(this.controls.revertBtn).hide().click(() => self.revertStep());
  $(this.controls.checkBtn).prop('disabled', true).click(() => self.check());
  $(this.controls.saveBtn).click(() => self.save());
  $(this.controls.pencilMarkCtrl).hide();
  $(this.controls.pencilMarkCb).click(() => self.togglePencilMarkMode());
}

commonPuzzle.prototype.togglePencilMarkMode = function() {
  this.pencilMarkMode = $(this.controls.pencilMarkCb).is(':checked');
}

var squarePuzzleCell = function(puzzle, col, row) {
  // Element of the grid.
  this.puzzle = puzzle;
  this.col = col;
  this.row = row;
  this.isClue = false;
  this.value = "white";
  this.togglers = []
  this.cellSize = this.puzzle.cellSize;
  this.pencilMarks = null;
  this.markElements = [];
  this.reset();
}

squarePuzzleCell.prototype.setClue = function(value) {
  // Mark cell as a clue.
  this.isClue = true;
  this.value = value;
  this.pencilMarks = null;
  this.reset();
}

squarePuzzleCell.prototype.setRegular = function(togglers) {
  // Mark cell as a regular.
  this.togglers = togglers;
  this.isClue = false;
  this.valueIndex = 0;
  this.value = this.togglers[this.valueIndex];
  this.pencilMarks = null;
  this.reset();
}

squarePuzzleCell.prototype.reset = function() {
}

squarePuzzleCell.prototype.renderCell = function() {
  // Draw cell in the canvas.
  this.cellSize = this.puzzle.cellSize;
  var corner = this.getCorner();
  this.element = this.puzzle.snap.image(
    this.puzzle.imageUrl(this.value), 
    corner.x, corner.y, this.cellSize, this.cellSize);
  if (this.overGrid()) {
    if (this.puzzle.useTopColor) {
      $(this.element.node).css("filter","url(#topclue)");
    } else {
      $(this.element.node).css("filter","url(#bottomclue)");
    }
  }
  if (this.belowGrid()) {
    $(this.element.node).css("filter","url(#bottomclue)");
  }
  this.element.cell = this;
  this.rect = this.puzzle.snap.rect(corner.x, corner.y, this.cellSize, this.cellSize);
  this.rect.attr({
    fill: "none",
    stroke: this.puzzle.gridProperty.stroke,
    strokeWidth: this.puzzle.gridProperty.strokeWidth
  });
}

squarePuzzleCell.prototype.markError = function() {
  var center = this.getCenter();
  var errorElem = this.puzzle.snap.circle(center.x, center.y, 0);
  errorElem.attr({fill: "#f08", opacity: 0.5});
  var radius = this.cellSize/3;
  // Blinking animation
  var errorInterval = setInterval(() => {
      errorElem.attr({r: 0});
      errorElem.animate({r: radius}, 200);
    }, 400);
  // Remove animation after 5 sec.
  setTimeout(() => {errorElem.remove(); clearInterval(errorInterval);}, 5000);
}

squarePuzzleCell.prototype.getCenter = function() {
  var corner = this.getCorner();
  return {
    x: corner.x + this.cellSize/2,
    y: corner.y + this.cellSize/2
  };
}

squarePuzzleCell.prototype.getCorner = function() {
  return {
    x: this.puzzle.leftGap + this.col*this.cellSize,
    y: this.puzzle.topGap + this.row*this.cellSize
  };
}

squarePuzzleCell.prototype.overGrid = function() {
  return this.col < 0 || this.row < 0;
}

squarePuzzleCell.prototype.belowGrid = function() {
  return this.col >= this.puzzle.cols || this.row >= this.puzzle.rows;
}

squarePuzzleCell.prototype.syncCell = function() {
  // Sync cell image.
  if (this.element != undefined) {
    for (var i=0;i<this.markElements.length;i++) {
      this.markElements[i].remove();
    }
    this.markElements = [];
    if (this.value) {
      this.element.attr({href: this.puzzle.imageUrl(this.value)});
    }
    if (this.pencilMarks) {
      var corner = this.getCorner();
      var markRows = 4;
      if (this.togglers.length <= 10) {
        markRows = 3;
      }
      if (this.togglers.length <= 5) {
        markRows = 2;
      }
      for (var i=0;i<this.pencilMarks.length;i++) {
        var index = this.pencilMarks[i];
        var row = Math.floor((index - 1)/markRows);
        var col = (index - 1)%markRows;
        if (this.togglers.length == 3 && index == 2) {
          row = 1;
        }
        var element = this.puzzle.snap.image(
          this.puzzle.imageUrl(this.togglers[this.pencilMarks[i]]),
          corner.x + col * this.cellSize/markRows, corner.y + row * this.cellSize/markRows,
          this.cellSize/markRows, this.cellSize/markRows);
        element.cell = this;
        this.markElements.push(element);
      }
    }
  }
  this.syncAdditional()
}

squarePuzzleCell.prototype.syncAdditional = function() {
}

squarePuzzleCell.prototype.setValue = function(valueIndex) {
  if (!this.isClue) {
    this.pencilMarks = null;
    this.valueIndex = valueIndex;
    if (this.valueIndex < 0) this.valueIndex = this.togglers.length - 1;
    if (this.valueIndex >= this.togglers.length) this.valueIndex = 0;
    this.value = this.togglers[this.valueIndex];
  }
  this.syncCell();
}

squarePuzzleCell.prototype.togglePencilMark = function(valueIndex) {
  if (!this.isClue && valueIndex != 0) {
    if (!this.pencilMarks) {
      this.pencilMarks = [];
    }
    if (this.pencilMarks.includes(valueIndex)) {
      this.pencilMarks.splice(this.pencilMarks.indexOf(valueIndex),1);
    } else {
      this.pencilMarks.push(valueIndex);
    }
  }
  this.syncCell();
}

