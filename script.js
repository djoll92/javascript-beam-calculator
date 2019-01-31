window.addEventListener("load", function() {

  // constants
  var CANVAS_WIDTH = 800;
  var CANVAS_HEIGHT = 300;
  var CANVAS_BG_COLOR = "#F5F5F5";
  var BEAM_LENGTH = 600;

  // point's A and B coordinates on canvas
  var cXA = (CANVAS_WIDTH - BEAM_LENGTH) / 2;
  var cXB = cXA + BEAM_LENGTH;
  // same for both points
  var cY = CANVAS_HEIGHT / 2;

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
  var changeLoadMeasures = function(loads) {
    if ((pointLoadCounter + momentCounter + uniDisLoadCounter + trapLoadCounter) > 4) {
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
    changeLoadMeasures(pointLoads);
    changeLoadMeasures(moments);
    changeLoadMeasures(uniformlyDistributedLoads);
    changeLoadMeasures(trapezoidalLoads);
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
  var onLeftSelect = document.getElementById("on-left");
  var onRightSelect = document.getElementById("on-right");

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
    var y = CANVAS_HEIGHT - 50;
    var color = "gray";
    drawLine(cXA, y, cXB, y, 0.5, color);
    drawLine(cXA, y - 20, cXA, y + 20, 0.5, color);
    drawLine(cXA - 10, y + 10, cXA + 10, y - 10, 0.25, color);
    drawLine(cXB, y - 20, cXB, y + 20, 0.5, color);
    drawLine(cXB - 10, y + 10, cXB + 10, y - 10, 0.25, color);
    var text = length + " (" + measure + ")";
    ctx.font = "14px sans-serif";
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

  var drawSupport = function(support, cX) {
    if (support === "pinned-support") {
      drawPinnedSupport(cX);
    } else if (support === "roller-support") {
      drawRollerSupport(cX);
    } else if (support === "fixed-support"){
      drawFixedSupport(cX);
    }
  }

  var drawLeftSupport = function(leftSupport) {
      drawSupport(leftSupport, cXA);
      ctx.font = "30px sans-serif";
      ctx.fillStyle = "red";
      ctx.fillText("A", cXA - 50, cY + 15);
  };

  var drawRightSupport = function(rightSupport) {
    drawSupport(rightSupport, cXB);
    ctx.font = "30px sans-serif";
    ctx.fillStyle = "red";
    ctx.fillText("B", cXB + 50 - ctx.measureText("B").width, cY + 15);
  };

  var drawArrow = function(xCoord, yCoord, angle, width, height) {
    // negating angle so that positive mathematical direction can be counterclockwise
    var degree = toRadians(-angle);
    ctx.save();
    ctx.translate(xCoord, yCoord);
    ctx.rotate(degree);
    ctx.drawImage(images.arrow, 0 , -height/2, width, height);
    ctx.restore();
  };

  // draw point load function
  var drawPointLoad = function(location, angle) {
    var x = cXA + BEAM_LENGTH / beamLength * location;
    drawArrow(x, cY, angle, 100, 30);
  };

  // draw moment function
  var drawMoment = function(location, magnitude) {
    var x = cXA + BEAM_LENGTH / beamLength * location;
    ctx.save();
    ctx.translate(x, cY);
    if (magnitude > 0) {
      ctx.drawImage(images.counterclockwise, -58, -93, 100, 100);
    } else {
      ctx.drawImage(images.clockwise, -42, -93, 100, 100);
    }
    ctx.restore();
  };

  // draw distributed load function
  var drawDistributedLoad = function(startLocation, endLocation, startMagnitude, endMagnitude, maxMagnitude) {
    var startX = cXA + BEAM_LENGTH / beamLength * startLocation;
    var endX = cXA + BEAM_LENGTH / beamLength * endLocation;
    var width = endX - startX;
    var startHeight = startMagnitude / maxMagnitude * 100; // maxHeight = 100
    var endHeight = endMagnitude / maxMagnitude * 100;
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

    while (length > arrowWidth) {
      startX += space ;
      xFromStart += space;
      var height = calculateHeight(xFromStart);
      drawArrow(startX, cY, calculateAngle(height), Math.abs(height), arrowWidth);
      length -= space;
    };
  }

  // draw trapezoidal load function
  var drawTrapezoidalLoad = function(startLocation, endLocation, startMagnitude, endMagnitude, maxMagnitude) {
    drawDistributedLoad(startLocation, endLocation, startMagnitude, endMagnitude, maxMagnitude);
  };

  // draw uniformly distributed load function
  var drawUniformlyDistributedLoad = function(startLocation, endLocation, magnitude, maxMagnitude) {
    drawDistributedLoad(startLocation, endLocation, magnitude, magnitude, maxMagnitude);
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
      drawLeftSupport(onLeftSelect[onLeftSelect.selectedIndex].value);
      drawRightSupport(onRightSelect[onRightSelect.selectedIndex].value);

      // calling draw point load function
      if (pointLoads.length > 0) {
        pointLoads.forEach(function(element) {
          drawPointLoad(element.location, element.angle);
        });
      };

      // calling draw moment function
      if (moments.length > 0) {
        moments.forEach(function(element) {
          drawMoment(element.location, element.magnitude);
        });
      };

      // max magnitude value for distributed loads
      var maxMagnitude = findMaxMagnitude();

      // calling draw distributed load function
      if (uniformlyDistributedLoads.length > 0) {
        uniformlyDistributedLoads.forEach(function(element) {
          drawUniformlyDistributedLoad(element.startLocation, element.endLocation, element.magnitude, maxMagnitude);
        });
      }

      // calling draw trapezoidal load function
      if (trapezoidalLoads.length > 0) {
        trapezoidalLoads.forEach(function(element) {
          drawTrapezoidalLoad(element.startLocation, element.endLocation, element.startMagnitude, element.endMagnitude, maxMagnitude);
        });
      }

      drawDimension(beamLength, measureUnitSelect.value);

      // draw supports on every change
      onLeftSelect.addEventListener("change", function(){
        draw();
      });
      onRightSelect.addEventListener("change", function(){
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
      } else {
        load[input.name] = input.value;
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
      load[input.name] = input.value;
    });
    dialog.querySelector("button[type=reset]").click();
    dialog.querySelector("input[name=id]").value = undefined;
    changeMeasures();
    draw();
  };

  draw();

});

// REMOVE LOADS! add IDs
// !SAME LOADS IN SAME LOCATION
// Positive force direction?
