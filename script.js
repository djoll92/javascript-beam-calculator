window.addEventListener("load", function() {

  // constants
  var CANVAS_WIDTH = 800;
  var CANVAS_HEIGHT = 300;
  var BEAM_LENGTH = 600;
  var CANVAS_BG_COLOR = "#F5F5F5";

  // point's A and B coordinates on canvas
  var cXA = (CANVAS_WIDTH - BEAM_LENGTH) / 2;
  var cXB = cXA + BEAM_LENGTH;
  var cY = CANVAS_HEIGHT / 2; // same for both points

  var pointLoadCounter = 1;
  var momentCounter = 1;
  var uniDisLoadCounter = 1;
  var trapLoadCounter = 1;

  var resetCounters = function() {
    pointLoadCounter = 1;
    momentCounter = 1;
    uniDisLoadCounter = 1;
    trapLoadCounter = 1;
  }

  // various load arrays
  var pointLoads = [];
  var moments = [];
  var uniformlyDistributedLoads = [];
  var trapezoidalLoads = [];

  // grab the canvas and context
  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");

  // grab the select elements for units settings
  var measureUnitSelect = document.getElementById("measure-units");
  var forceUnitSelect = document.getElementById("force-units");

  // grab span elements in dialogs
  var locationMeasures = document.querySelectorAll("span[class=length-measure]");
  var forceMeasures = document.querySelectorAll("span[class=force-measure]");

  // span innerHTML setters
  var setSpanMeasures = function() {
    locationMeasures.forEach(function(element) {
      element.innerHTML = measureUnitSelect.value;
    });
  };
  var setSpanForce = function() {
    forceMeasures.forEach(function(element) {
      element.innerHTML = forceUnitSelect.value;
    });
  };
  var changeLoadMeasures = function(loads, counter) {
    if (counter > 1) {
      loads.forEach(function(load) {
        var loadSpan = document.getElementById(load.id);
        if (loadSpan !== null) {
          loadSpan.querySelector("span").innerHTML = getEditedLoadInfo(load);
        }
      });
    } else {
      loads.forEach(function(load) {
        var loadSpan = document.getElementById(load.id);
        if (loadSpan !== null) {
          loadSpan.querySelector("span").innerHTML = getLoadInfo(load);
        }
      });
    }
  };
  var changeMeasures = function() {
    changeLoadMeasures(pointLoads, pointLoadCounter);
    changeLoadMeasures(moments, momentCounter);
    changeLoadMeasures(uniformlyDistributedLoads, uniDisLoadCounter);
    changeLoadMeasures(trapezoidalLoads, trapLoadCounter);
  }

  // set span InnerHTML
  setSpanMeasures();
  measureUnitSelect.addEventListener("change", function() {
    setSpanMeasures();
    resetCounters();
    changeMeasures();
    draw();
  });
  setSpanForce();
  forceUnitSelect.addEventListener("change", function() {
    setSpanForce();
    resetCounters();
    changeMeasures();
    draw();
  });

  // grab the beam length value
  var beamLengthInput = document.getElementById("length");
  var beamLength = beamLengthInput.value;

  // assign value of beam lenght to the variable on every new input
  beamLengthInput.addEventListener("input", function() {
    beamLength = beamLengthInput.value;
    draw();
  });

  // grab the select elements for setting the beam supports
  var beamTypeSelect = document.getElementById("beam-type");

  // grab elements for setting the beam load
  var dialogElements = [
    {
      type: "point",
      dialog: document.getElementById("point-load-dialog"),
      button: document.getElementById("add-point-load-btn")
    },
    {
      type: "moment",
      dialog: document.getElementById("moment-dialog"),
      button: document.getElementById("add-moment-btn")
    },
    {
      type: "distributed",
      dialog: document.getElementById("distributed-load-dialog"),
      button: document.getElementById("add-distributed-load-btn")
    },
    {
      type: "trapezoidal",
      dialog: document.getElementById("trapezoidal-load-dialog"),
      button: document.getElementById("add-trapezoidal-load-btn")
    }
  ];

  // add dialog listeners
  dialogElements.forEach(function(element) {
    element.button.addEventListener("click", function() {
      showDialog(element.dialog);
    });
    element.dialog.addEventListener("submit", function() {
      var id = element.dialog.querySelector("input[name=id]").value;
      switch (element.type) {
        case "point":
          if (checkForId(id, pointLoads)) {
            processEditDialogForm(element.dialog, getLoadById(id, pointLoads));
          } else {
            processDialogForm(element.dialog, pointLoads);
          }
          break;
        case "moment":
          if (checkForId(id, moments)) {
            processEditDialogForm(element.dialog, getLoadById(id, moments));
          } else {
            processDialogForm(element.dialog, moments);
          }
          break;
        case "distributed":
          if (checkForId(id, uniformlyDistributedLoads)) {
            processEditDialogForm(element.dialog, getLoadById(id, uniformlyDistributedLoads));
          } else {
            processDialogForm(element.dialog, uniformlyDistributedLoads);
          }
          break;
        case "trapezoidal":
          if (checkForId(id, trapezoidalLoads)) {
            processEditDialogForm(element.dialog, getLoadById(id, trapezoidalLoads));
          } else {
            processDialogForm(element.dialog, trapezoidalLoads);
          }
          break;
      }
    });
    element.dialog.addEventListener("reset", function() {
      cancelDialog(element.dialog);
    });
  });

  var solveButton = document.getElementById("solve-beam");
  solveButton.addEventListener("click", function() {
    drawDiagram(beamTypeSelect[beamTypeSelect.selectedIndex].value, canvas);
  });

  var getLoadById = function(id, loads) {
    var load = {};
    loads.forEach(function(obj) {
      if (obj.id == id) {
        load = obj;
      }
    });
    return load;
  };

  var checkForId = function(id, loads) {
    var bool = false;
    loads.forEach(function(obj) {
      if (obj.id == id) {
        bool = true;
      }
    });
    return bool;
  };

  // create image objects
  var images = {};
  var loadImages = function() {
    images.arrow = new Image();
    images.arrow.src = "img/point_load.svg";

    images.counterclockwise = new Image();
    images.counterclockwise.src = "img/counterclockwise_moment.svg";

    images.clockwise = new Image();
    images.clockwise.src = "img/clockwise_moment.svg";
  };
  loadImages();

  // degree to radians converter
  var toRadians = function(degree) {
    return degree * Math.PI / 180;
  };

  var drawLine = function(x1, y1, x2, y2, lineWidth, lineColor) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = lineColor;
    ctx.stroke();
  };

  var drawDimension = function(length, measure) {
    var y = CANVAS_HEIGHT - 25;
    var color = "gray";
    drawLine(cXA, y, cXB, y, 0.5, color);
    drawLine(cXA, y - 20, cXA, y + 20, 0.5, color);
    drawLine(cXA - 10, y + 10, cXA + 10, y - 10, 0.25, color);
    drawLine(cXB, y - 20, cXB, y + 20, 0.5, color);
    drawLine(cXB - 10, y + 10, cXB + 10, y - 10, 0.25, color);
    var text = length + " (" + measure + ")";
    ctx.font = "13px sans-serif";
    var x = (CANVAS_WIDTH - ctx.measureText(text).width) / 2;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y - 4);
  };

  // draw the beam on the screen
  var drawBeam = function() {
    // draw background
    ctx.fillStyle = CANVAS_BG_COLOR;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // draw beam
    drawLine(cXA, cY, cXB, cY, 2, "black");
  };

  // draw the pinned support symbol on the screen
  var drawPinnedSupport = function(cX) {
    ctx.beginPath();
    ctx.moveTo(cX, cY);
    ctx.lineTo(cX - 15, cY + 30);
    ctx.lineTo(cX + 15, cY + 30);
    ctx.closePath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
    ctx.stroke();
  };

  // draw the roller support symbol on the screen
  var drawRollerSupport = function(cX) {
    drawPinnedSupport(cX);
    ctx.beginPath();
    var y = cY + 35;
    ctx.moveTo(cX - 15, y);
    ctx.lineTo(cX + 15, y);
    ctx.closePath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
    ctx.stroke();
  };

  // draw the fixed support symbol on the screen
  var drawFixedSupport = function(cX) {
    drawLine(cX, cY - 30, cX, cY + 30, 2, "black");

    var y = cY - 28;
    for (var i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(cX, y + 12 * i);
      if (cX < cXB) {
        ctx.lineTo(cX - 10, y + 10 + 12 * i);
      } else {
        ctx.lineTo(cX + 10, y + 10 + 12 * i);
      }
      ctx.closePath();
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  };

  var drawSupport = function(beamType) {
    if (beamType === "simply-supported") {
      drawPinnedSupport(cXA);
      ctx.font = "30px sans-serif";
      ctx.fillStyle = "red";
      ctx.fillText("A", cXA - 50, cY + 15);
      drawRollerSupport(cXB);
      ctx.font = "30px sans-serif";
      ctx.fillStyle = "red";
      ctx.fillText("B", cXB + 50 - ctx.measureText("B").width, cY + 15);
    } else if (beamType === "cantilever"){
      drawFixedSupport(cXA);
      ctx.font = "30px sans-serif";
      ctx.fillStyle = "red";
      ctx.fillText("A", cXA - 50, cY + 15);
    }
  }

  var drawArrow = function(xCoord, yCoord, angle, width, height) {
    // negating angle so that positive mathematical direction can be counterclockwise
    var degree = toRadians(-angle);
    ctx.save();
    ctx.translate(xCoord, yCoord);
    ctx.rotate(degree);
    ctx.drawImage(images.arrow, 0 , -height/2, width, height);
    ctx.restore();
  };

  var drawLoadSymbol = function(text, posX, posY) {
    ctx.fillStyle = "Green";
    ctx.font = "15px sans-serif";
    ctx.fillText(text, posX, posY);
  }

  // draw point load function
  var drawPointLoad = function(load) {
    var x = cXA + BEAM_LENGTH / beamLength * load.location;
    drawArrow(x, cY, load.angle * Math.abs(load.magnitude) / load.magnitude, 90, 30);
    var sufix = load.sufix;
    if (sufix === undefined) {
      sufix = pointLoadCounter;
    }
    var text = "F" + sufix;
    var xPos = x + 90 - load.angle - 9 * (1 + Math.cos(toRadians(load.angle)));
    if (load.magnitude > 0) {
      drawLoadSymbol(text, xPos, cY - 4 - 90 * Math.sin(toRadians(load.angle)));
    } else {
      drawLoadSymbol(text, xPos, cY + 16 + 90 * Math.sin(toRadians(load.angle)));
    }
  };

  // draw moment function
  var drawMoment = function(moment) {
    var x = cXA + BEAM_LENGTH / beamLength * moment.location;
    var sufix = moment.sufix;
    if (sufix === undefined) {
      sufix = momentCounter;
    }
    var text = "M" + sufix;
    ctx.save();
    ctx.translate(x, cY);
    if (moment.magnitude > 0) {
      ctx.drawImage(images.counterclockwise, -58, -93, 100, 100);
    } else {
      ctx.drawImage(images.clockwise, -42, -93, 100, 100);
    }
    drawLoadSymbol(text, -9, -110);
    ctx.restore();
  };

  // draw distributed load function
  var drawDistributedLoad = function(startLocation, endLocation, startMagnitude, endMagnitude, maxMagnitude, sufix) {
    var startX = cXA + BEAM_LENGTH / beamLength * startLocation;
    var endX = cXA + BEAM_LENGTH / beamLength * endLocation;
    var width = endX - startX;
    var startHeight = startMagnitude / maxMagnitude * 60; // maxHeight = 60
    var endHeight = endMagnitude / maxMagnitude * 60;
    var startY = cY - startHeight;
    var endY = cY - endHeight;

    drawLine(startX, startY, endX, endY, 1);

    var arrowWidth = 10;
    var xFromStart = 0;
    var space = 3 * arrowWidth;
    var calculateHeight = function(x) {
      return startHeight + ((endHeight - startHeight) / width) * x;
    }
    var calculateAngle = function(height) {
      if (height >= 0) {
        return 90;
      } else {
        return -90;
      }
    };

    drawArrow(startX, cY, calculateAngle(startHeight), Math.abs(startHeight), arrowWidth);
    drawArrow(endX, cY, calculateAngle(endHeight), Math.abs(endHeight), arrowWidth);

    var length = width - space;
    var newStartX = startX;

    while (length > arrowWidth) {
      newStartX += space ;
      xFromStart += space;
      var height = calculateHeight(xFromStart);
      drawArrow(newStartX, cY, calculateAngle(height), Math.abs(height), arrowWidth);
      length -= space;
    };

    var counter = sufix;
    var xPos = startX + width / 2 - 9;
    var dY = 0;
    if (calculateHeight(xPos) > 0) {
      dY += 20;
    } else {
      dY -= 7;
    }

    if (startMagnitude != endMagnitude) {
      if (counter === undefined) {
        counter = trapLoadCounter;
      }
      drawLoadSymbol("Q" + counter, xPos, cY + dY);
    } else {
      if (counter === undefined) {
        counter = uniDisLoadCounter;
      }
      drawLoadSymbol("q" + counter, xPos, cY + dY);
    }

  }

  // draw trapezoidal load function
  var drawTrapezoidalLoad = function(load, maxMagnitude) {
    drawDistributedLoad(load.startLocation, load.endLocation, load.startMagnitude, load.endMagnitude, maxMagnitude, load.sufix);
  };

  // draw uniformly distributed load function
  var drawUniformlyDistributedLoad = function(load, maxMagnitude) {
    drawDistributedLoad(load.startLocation, load.endLocation, load.magnitude, load.magnitude, maxMagnitude, load.sufix);
  };

  // function for finding maximum magnitude value for all distributed loads
  var findMaxMagnitude = function() {
    var magnitudes = [];
    if (trapezoidalLoads.length > 0) {
      trapezoidalLoads.forEach(function(load) {
        magnitudes.push(Math.abs(load.startMagnitude));
        magnitudes.push(Math.abs(load.endMagnitude));
      });
    }
    if (uniformlyDistributedLoads.length > 0) {
      uniformlyDistributedLoads.forEach(function(load) {
        magnitudes.push(Math.abs(load.magnitude));
      });
    }
    if (magnitudes.length > 0) {
      return magnitudes.sort(function(a, b) {
          return b - a;
        })[0];
    }
    return 0;
  };

  var draw = function() {
      // clear the canvas
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // draw beam line
      drawBeam();

      // draw initial supports
      drawSupport(beamTypeSelect[beamTypeSelect.selectedIndex].value);

      // calling draw point load function
      if (pointLoads.length > 0) {
        pointLoads.forEach(function(pointLoad) {
          drawPointLoad(pointLoad);
        });
      };

      // calling draw moment function
      if (moments.length > 0) {
        moments.forEach(function(moment) {
          drawMoment(moment);
        });
      };

      // max magnitude value for distributed loads
      var maxMagnitude = findMaxMagnitude();

      // calling draw distributed load function
      if (uniformlyDistributedLoads.length > 0) {
        uniformlyDistributedLoads.forEach(function(load) {
          drawUniformlyDistributedLoad(load, maxMagnitude);
        });
      }

      // calling draw trapezoidal load function
      if (trapezoidalLoads.length > 0) {
        trapezoidalLoads.forEach(function(load) {
          drawTrapezoidalLoad(load, maxMagnitude);
        });
      }

      drawDimension(beamLength, measureUnitSelect.value);

      // draw supports on every change
      beamTypeSelect.addEventListener("change", function(){
        draw();
      });
  };

  // function that returns key load parameters
  var getLoadInfo = function(load) {
    var info = "";
    if (load.type === "point") {
      info = "F" + pointLoadCounter + " = " + load.magnitude + " (" + forceUnitSelect.value + "), " + load.angle + "\xB0";
      load.sufix = pointLoadCounter;
      pointLoadCounter++;
    } else if (load.type === "moment") {
      info = "M" + momentCounter + " = " + load.magnitude + " (" + forceUnitSelect.value + "*" + measureUnitSelect.value + ")";
      load.sufix = momentCounter;
      momentCounter++;
    } else if (load.type === "uniformly-distributed") {
      info = "q"  + uniDisLoadCounter + " = " + load.magnitude + " (" + forceUnitSelect.value + "/" + measureUnitSelect.value + ")";
      load.sufix = uniDisLoadCounter;
      uniDisLoadCounter++;
    } else if (load.type === "trapezoidal") {
      info = "Q" + trapLoadCounter + " = " + load.startMagnitude + "; " + load.endMagnitude + " (" + forceUnitSelect.value + "/" + measureUnitSelect.value + ")";
      load.sufix = trapLoadCounter;
      trapLoadCounter++;
    }
    return info;
  };

  var getEditedLoadInfo = function(load) {
    var info = "";
    if (load.type === "point") {
      info = "F" + load.sufix + " = " + load.magnitude + " (" + forceUnitSelect.value + "), " + load.angle + "\xB0";
    } else if (load.type === "moment") {
      info = "M" + load.sufix + " = " + load.magnitude + " (" + forceUnitSelect.value + "*" + measureUnitSelect.value + ")";
    } else if (load.type === "uniformly-distributed") {
      info = "q"  + load.sufix + " = " + load.magnitude + " (" + forceUnitSelect.value + "/" + measureUnitSelect.value + ")";
    } else if (load.type === "trapezoidal") {
      info = "Q" + load.sufix + " = " + load.startMagnitude + "; " + load.endMagnitude + " (" + forceUnitSelect.value + "/" + measureUnitSelect.value + ")";
    }
    return info;
  };

  // returns new array without objects with inputed id
  var removeLoadById = function(id, loads) {
    return loads.filter(function(load) {
      return load.id !== id;
    });
  };

  // function for removing an html element from document
  var removeElementById = function(id) {
    var element = document.getElementById(id);
    if (element !== null) {
      element.parentNode.removeChild(element);
    }
    pointLoads = removeLoadById(id, pointLoads);
    moments = removeLoadById(id, moments);
    uniformlyDistributedLoads = removeLoadById(id, uniformlyDistributedLoads);
    trapezoidalLoads = removeLoadById(id, trapezoidalLoads);
  };

  // function creating new HTML elements for every new load submited
  var createLoadElement = function(load, dialog) {
    var addLoadButton = dialog.parentNode.children[1];  // dialog.parentNode.children[1] = button after dialog element
    var newDiv = document.createElement("div");
    newDiv.id = load.id;
    var span = document.createElement("span");
    span.innerHTML = getLoadInfo(load);
    var delBtn = document.createElement("button");
    delBtn.innerHTML = "remove";
    var editBtn = document.createElement("button");
    editBtn.innerHTML = "edit";
    newDiv.appendChild(span);
    newDiv.appendChild(delBtn);
    newDiv.appendChild(editBtn);
    addLoadButton.parentNode.insertBefore(newDiv, addLoadButton.nextSibiling);

    delBtn.addEventListener("click", function() {
      removeElementById(load.id);
      resetCounters();
      changeMeasures();
      draw();
    });

    editBtn.addEventListener("click", function() {
      showEditDialog(dialog, load);
    });
  };

  // show modal dialog form function
  var showDialog = function(dialog) {
    if (beamLength !== "" && beamLength !== 0) {
      dialog.showModal();
    } else {
      alert("Enter the beam length first."); // change to modal
    }
  };

  var showEditDialog = function(dialog, load) {
    var inputs = dialog.querySelectorAll("input");
    inputs.forEach(function(input) {
      input.value = load[input.name];
    });
    showDialog(dialog);
  };

  // cancel dialog function
  var cancelDialog = function(dialog) {
    dialog.close();
  };

  // function that grabs input from dialog forms
  var processDialogForm = function(dialog, loads) {
    var inputs = dialog.querySelectorAll("input");
    var load = {};
    inputs.forEach(function(input) {
      if (input.name === "id") {
        load[input.name] = Date.now().toString();
      } else if (input.name === "type") {
        load[input.name] = input.value;
      } else {
        load[input.name] = Number(input.value);
      }
    });
    loads.push(load);
    dialog.querySelector("button[type=reset]").click(); // click cancel button
    draw();
    createLoadElement(load, dialog);
  };

  var processEditDialogForm = function(dialog, load) {
    var inputs = dialog.querySelectorAll("input");
    inputs.forEach(function(input) {
      if (input.name === "type") {
        load[input.name] = input.value;
      } else {
        load[input.name] = Number(input.value);
      }
    });
    dialog.querySelector("button[type=reset]").click();
    dialog.querySelector("input[name=id]").value = undefined;
    changeMeasures();
    draw();
  };

  var drawDiagram = function(beamType, canvasToCopy) {
    var diagramCanvas;
    if (document.getElementById("diagram-canvas") === null) {
      diagramCanvas = document.createElement("canvas");
      diagramCanvas.id = "diagram-canvas";
      diagramCanvas.width = 800;
      diagramCanvas.height = 900;
      document.querySelector("script").parentNode.insertBefore(diagramCanvas, document.querySelector("script"));
    } else {
      diagramCanvas = document.getElementById("diagram-canvas");
    }
    var ctx = diagramCanvas.getContext("2d");
    var diagMaxValue = 90;
    ctx.clearRect(0, 0, 800, 900);
    ctx.fillStyle = CANVAS_BG_COLOR;
    ctx.fillRect(0, 0, 800, 900);

    var pointLoadMoment = function(distance, force) {
      return force * distance;
    };

    var distributedLoadMoment = function(load) {
      var length = load.endLocation - load.startLocation;
      return pointLoadMoment(load.startLocation + length / 2, load.magnitude * length);
    };

    var triangularLoadMoment = function(load, distanceFromLoad) {
      var length = load.endLocation - load.startLocation;
      var magnitude = 0;
      var distance = 0;
      if (load.startMagnitude >= 0) {
        magnitude = Math.abs(load.endMagnitude - load.startMagnitude);
      } else {
        magnitude = -1 * Math.abs(Math.abs(load.endMagnitude) + load.startMagnitude);
      }
      if (Math.abs(load.startMagnitude) > Math.abs(load.endMagnitude)) {
        distance = 1 / 3;
      }
      else {
        distance = 2 / 3;
      }
      return pointLoadMoment(distanceFromLoad + length * distance, magnitude * length * 0.5);
    };

    var getMinLoadMagnitude = function(load) {
      var minMagnitude = 0;
      if (load.startMagnitude >= 0) {
        minMagnitude = Math.min(load.startMagnitude, load.endMagnitude);
      } else {
        minMagnitude = Math.max(load.startMagnitude, load.endMagnitude);
      }
      return minMagnitude;
    };

    var trapezoidalLoadMoment = function(load) {
      var rectangularPart = {startLocation: load.startLocation, endLocation: load.endLocation, magnitude: getMinLoadMagnitude(load)};
      var rectangularPartPartMoment = distributedLoadMoment(rectangularPart);
      var triangularPartMoment = triangularLoadMoment(load, load.startLocation);
      return rectangularPartPartMoment + triangularPartMoment;
    };

    var calculateYB = function(){
      if (beamType === "cantilever") {
        return 0;
      }
      var yB = 0;
      pointLoads.forEach(function(load) {
        var fY = load.magnitude * Math.sin(toRadians(load.angle));
        yB += pointLoadMoment(load.location, fY) / beamLength;
      });
      moments.forEach(function(moment) {
        yB -= moment.magnitude / beamLength;
      });
      uniformlyDistributedLoads.forEach(function(load) {
        yB += distributedLoadMoment(load) / beamLength;
      });
      trapezoidalLoads.forEach(function(load) {
        yB += trapezoidalLoadMoment(load) / beamLength;
      });
      return yB;
    };

    var calculateYA = function() {
      var yA = 0;
      yA -= calculateYB();
      pointLoads.forEach(function(load) {
        var fY = load.magnitude * Math.sin(toRadians(load.angle));
        yA += fY;
      });
      uniformlyDistributedLoads.forEach(function(load) {
        var length = load.endLocation - load.startLocation;
        yA += load.magnitude * length;
      });
      trapezoidalLoads.forEach(function(load) {
        var length = load.endLocation - load.startLocation;
        if (load.startMagnitude > 0) {
          yA += Math.abs(load.startMagnitude - load.endMagnitude) * length * 0.5;
        } else {
          yA += -1 * Math.abs(Math.abs(load.endMagnitude) + load.startMagnitude) * length * 0.5;
        }
        yA += getMinLoadMagnitude(load) * length;
      });
      return yA;
    }

    calculateXA = function() {
      var xA = 0;
      pointLoads.forEach(function(load) {
        var fX = Math.abs(load.magnitude) * Math.cos(toRadians(load.angle));
        xA += fX;
      });
      return -1 * xA;
    }

    var drawLine = function(x1, y1, x2, y2, lineWidth, lineColor) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.closePath();
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = lineColor;
      ctx.stroke();
    };

    var drawDot = function(x, y) {
      ctx.fillStyle = "blue"
      ctx.fillRect(x, y, 1, 1);
    }

    var loadLengthByZ = function(z, load) {
      return z / BEAM_LENGTH * beamLength - (beamLength - load.endLocation);
    };

    var momentDots = [];
    var m = 0;
    var mBefore;
    var yB = calculateYB();

    var findMomentDots = function(x) {
      for (var z = BEAM_LENGTH; z >= 0; z--) {
        mBefore = m;
        m = pointLoadMoment(z / BEAM_LENGTH * beamLength, yB);
        pointLoads.forEach(function(pointLoad) {
          if (z >= BEAM_LENGTH * (1 - pointLoad.location / beamLength)) {
            var fY = Math.sin(toRadians(pointLoad.angle)) * pointLoad.magnitude;
            m -= pointLoadMoment(pointLoad.location - beamLength * (1 - z / BEAM_LENGTH), fY);
          }
        });
        moments.forEach(function(moment) {
          if (z >= BEAM_LENGTH * (1 - moment.location / beamLength)) {
            m += moment.magnitude * 1;
          }
        });
        uniformlyDistributedLoads.forEach(function(load) {
          if (z >= BEAM_LENGTH * (1 - load.endLocation / beamLength)) {
            if (z >= BEAM_LENGTH * (1 - load.startLocation / beamLength)) {
              var loc = load.startLocation - (BEAM_LENGTH - z) * beamLength / BEAM_LENGTH;
              var length = load.endLocation - load.startLocation;
              m -= pointLoadMoment(loc + length / 2, load.magnitude * length);
            } else {
              m -= pointLoadMoment(loadLengthByZ(z, load) / 2, load.magnitude * loadLengthByZ(z, load));
            }
          }
        });
        trapezoidalLoads.forEach(function(load) {
          var loadLength = load.endLocation - load.startLocation;
          if (z >= BEAM_LENGTH * (1 - load.endLocation / beamLength)) {
            if (z >= BEAM_LENGTH * (1 - load.startLocation / beamLength)) {
              var loc = load.startLocation - (BEAM_LENGTH - z) * beamLength / BEAM_LENGTH;
              m -= pointLoadMoment(loc + loadLength / 2, getMinLoadMagnitude(load) * loadLength);
              m -= triangularLoadMoment(load, loc);
            } else {
              m -= pointLoadMoment(loadLengthByZ(z, load) / 2, getMinLoadMagnitude(load) * loadLengthByZ(z, load));
              var dQ = 0;
              var qZ = 0;
              if (load.startMagnitude >= 0) {
                dQ =  Math.abs(load.endMagnitude - load.startMagnitude);
                if (load.startMagnitude >= load.endMagnitude) {
                  qZ = dQ * loadLengthByZ(z, load) / loadLength;
                  m -= pointLoadMoment(loadLengthByZ(z, load) / 3, qZ * loadLengthByZ(z, load) * 0.5);
                } else {
                  var leftZ = beamLength - loadLengthByZ(z, load);
                  qZ = dQ * (leftZ - load.startLocation) / loadLength;
                  m -= pointLoadMoment((load.endLocation - leftZ) / 2, qZ * (load.endLocation - leftZ));
                  m -= pointLoadMoment(loadLengthByZ(z, load) * 2 / 3, (dQ - qZ) * loadLengthByZ(z, load) * 0.5);
                }
              } else {
                dQ = -Math.abs(Math.abs(load.endMagnitude) + load.startMagnitude);
                if (load.startMagnitude <= load.endMagnitude) {
                  qZ = dQ * loadLengthByZ(z, load) / loadLength;
                  m -= pointLoadMoment(loadLengthByZ(z, load) / 3, qZ * loadLengthByZ(z, load) * 0.5);
                } else {
                  var leftZ = beamLength - loadLengthByZ(z, load);
                  qZ = dQ * leftZ / loadLength;
                  m -= pointLoadMoment((load.endLocation - leftZ) / 2, qZ * (load.endLocation - leftZ));
                  m -= pointLoadMoment(loadLengthByZ(z, load) * 2 / 3, (dQ - qZ) * loadLengthByZ(z, load) * 0.5);
                }
              }
            }
          }
        });
        momentDots.push({x, m, mBefore});
        x++;
      }
    };
    findMomentDots(cXA);

    var tForceDots = [];
    var yA = calculateYA();

    var findTForceDots = function(x, f) {
      for (var z = BEAM_LENGTH; z >= 0; z--) {
        var fBefore = f;
        f = yA;
        pointLoads.forEach(function(pointLoad) {
          if (z <= BEAM_LENGTH * (1 - pointLoad.location / beamLength)) {
            var fY = Math.sin(toRadians(pointLoad.angle)) * pointLoad.magnitude;
            f -= fY;
          }
        });
        uniformlyDistributedLoads.forEach(function(load) {
          var length = load.endLocation - load.startLocation;
          if (z <= BEAM_LENGTH * (1 - load.startLocation / beamLength)) {
            if (z >= BEAM_LENGTH * (1 - load.endLocation / beamLength)) {
              f -= load.magnitude * (length - loadLengthByZ(z, load));
            } else {
              f -= load.magnitude * length;
            }
          }
        });
        trapezoidalLoads.forEach(function(load) {
          var length = load.endLocation - load.startLocation;
          if (z <= BEAM_LENGTH * (1 - load.startLocation / beamLength)) {
            if (z >= BEAM_LENGTH * (1 - load.endLocation / beamLength)) {
              var leftZ = length - loadLengthByZ(z, load);
              f -= getMinLoadMagnitude(load) * (leftZ);
              var dQ = Math.abs(Math.abs(load.startMagnitude) - Math.abs(load.endMagnitude));
              if (Math.abs(load.startMagnitude) >= Math.abs(load.endMagnitude)) {
                var qZ = dQ * loadLengthByZ(z, load) / length;
                f -= (qZ * leftZ + 0.5 * (dQ - qZ) * leftZ) * (Math.abs(load.endMagnitude) / load.endMagnitude);
              } else {
                var qZ = dQ * leftZ / length;
                f -= 0.5 * qZ * leftZ * (Math.abs(load.endMagnitude) / load.endMagnitude);
              }
            } else {
              f -= getMinLoadMagnitude(load) * length;
              if (load.startMagnitude >= 0) {
                f -= 0.5 * length * Math.abs(load.startMagnitude - load.endMagnitude);
              } else {
                f -= -0.5 * length * Math.abs(Math.abs(load.startMagnitude) + load.endMagnitude);
              }
            }
          }
        });
        if (z == 0) {
          f += yB;
        }
        tForceDots.push({x, f, fBefore});
        x++;
      }
    };
    findTForceDots(cXA, 0);

    var aForceDots = [];
    var xA = calculateXA();
    console.log(xA);
    var findAForceDots = function(x, f) {
      for (var z = BEAM_LENGTH; z >= 0; z--) {
        var fBefore = f;
        f = xA;
        pointLoads.forEach(function(pointLoad) {
          if (z <= BEAM_LENGTH * (1 - pointLoad.location / beamLength)) {
            var fX = Math.cos(toRadians(pointLoad.angle)) * Math.abs(pointLoad.magnitude);
            f += fX;
          }
        });
        aForceDots.push({x, f, fBefore});
        x++;
      }
    };
    findAForceDots(cXA, 0);

    var findMaxMoment = function(dots) {
      var moms = [];
      if (dots.length > 0) {
        dots.forEach(function(dot) {
          moms.push(Math.abs(dot.m));
        });
      }
      if (moms.length > 0) {
        return moms.sort(function(a, b) {
            return b - a;
          })[0];
      }
      return 0;
    };

    var findMaxForce = function(dots) {
      var array = [];
      if (dots.length > 0) {
        dots.forEach(function(dot) {
          array.push(Math.abs(dot.f));
        });
      }
      if (array.length > 0) {
        return array.sort(function(a, b) {
          return b- a;
        })[0];
      }
      return 0;
    };

    var maxMoment = findMaxMoment(momentDots);
    var maxTForce = findMaxForce(tForceDots);
    var maxAForce = findMaxForce(aForceDots);

    var drawMomentDiagram = function(dots){
      drawLine(cXA, cY + 650, cXB, cY + 650, 1, "Black");
      dots.forEach(function(dot, index) {
        var y = cY + 650 + dot.m / maxMoment * diagMaxValue;
        var yBefore = cY + 650 + dot.mBefore / maxMoment * diagMaxValue;
        if (Math.abs(yBefore - y) > 1) {
          drawLine(dot.x, yBefore, dot.x, y, 1, "blue");
        }
        drawDot(dot.x, y);
        if (index % 20 == 0) {
          drawLine(dot.x, cY + 650, dot.x, y, 0.5, "gray");
        }
      });
    };
    var drawForceDiagram = function(dots, loc, maxF) {
      drawLine(cXA, loc, cXB, loc, 1, "Black");
      dots.forEach(function(dot, index) {
        var y = loc - dot.f / maxF * diagMaxValue;
        var yBefore = loc - dot.fBefore / maxF * diagMaxValue;
        if (Math.abs(yBefore - y) > 1) {
          drawLine(dot.x, yBefore, dot.x, y, 1, "blue");
        }
        drawDot(dot.x, y);
        if (index % 20 == 0) {
          drawLine(dot.x, loc, dot.x, y, 0.5, "gray");
        }
      });
    };

    ctx.drawImage(canvasToCopy, 0, 0)
    drawForceDiagram(aForceDots, 400, maxAForce)
    drawForceDiagram(tForceDots, 600, maxTForce);
    drawMomentDiagram(momentDots);
  };

  draw();

});

// REMOVE LOADS! add IDs
// !SAME LOADS IN SAME LOCATION
// Positive force direction?
// startLocation < endLocation


    // var precise = function(number, decimals) {
    //   return Number.parseFloat(number).toFixed(decimals);
    // };
