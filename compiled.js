'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

// Declare component elements
var $body = document.body;
var $canvas = document.querySelector('canvas');
var $avatar = document.createElement('img');
var $prev = document.querySelector('.prev');
var $download = document.querySelector('.download');
var $next = document.querySelector('.next');

// Initialize panning options
var dragStart = { x: 0, y: 0 };
var imgPos = { x: 0, y: 0 };

// Helper function for when downloading
var cloneCanvas = function cloneCanvas(oldCanvas) {
  var newCanvas = document.createElement('canvas');
  var context = newCanvas.getContext('2d');
  newCanvas.width = oldCanvas.width;
  newCanvas.height = oldCanvas.height;
  context.drawImage(oldCanvas, 0, 0);
  return newCanvas;
};

// Apply a filter to a canvas
var applyFilter = function applyFilter(canvas) {
  return function (url) {
    return new Promise(function (resolve, reject) {
      var image = document.createElement('img');
      image.src = url;
      image.onload = function () {
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas);
      };
    });
  };
};

// Draw an avatar to a canvas
var drawAvatar = function drawAvatar(url) {
  imgPos = { x: 0, y: 0 };
  $avatar.src = url;
  $avatar.onload = function () {
    // Set the $canvas size to the $avatars shortest side
    $canvas.width = Math.min($avatar.width, $avatar.height);
    $canvas.height = Math.min($avatar.width, $avatar.height);
    // Draw the avatar $avatar to $canvas
    $canvas.getContext('2d').drawImage($avatar, 0, 0, $avatar.width, $avatar.height);
  };
};

// Create file blob from dataUrl and initiate a download
var download = function download(dataUrl) {
  var c = cloneCanvas($canvas);
  var f = document.querySelector('.active').src;
  applyFilter(c)(f).then(function (res) {
    var dataUrl = res.toDataURL('image/jpg');
    var data = atob(dataUrl.substring("data:image/png;base64,".length));
    var asArray = new Uint8Array(data.length);
    for (var i = 0, len = data.length; i < len; ++i) {
      asArray[i] = data.charCodeAt(i);
    }var f = new Blob([asArray.buffer], { type: 'application/octet-stream' });
    var a = document.createElement('a');
    window.URL = window.URL || window.webkitURL;
    a.href = window.URL.createObjectURL(f);
    a.download = 'filter.jpg';
    $body.appendChild(a);
    a.click();
    $body.removeChild($body.lastElementChild);
  });
};

// Move $avatar around canvas according to drag event
var track = function track(e) {
  var x = Math.max(Math.min(imgPos.x + (e.pageX - dragStart.x), 0), $canvas.width - $avatar.width);
  var y = Math.max(Math.min(imgPos.y + (e.pageY - dragStart.y), 0), $canvas.height - $avatar.height);
  // Draw the avatar on the $canvas
  $canvas.getContext('2d').drawImage($avatar, x, y, $avatar.width, $avatar.height);
};

// Setup at the start of a drag event
var start = function start(e) {
  dragStart = { x: e.pageX, y: e.pageY };
  $body.addEventListener('mousemove', track);
};

// Teardown ar the end of a drag event
var stop = function stop(e) {
  $body.removeEventListener('mousemove', track);
  imgPos = {
    x: Math.max(Math.min(imgPos.x + (e.pageX - dragStart.x), 0), $canvas.width - $avatar.width),
    y: Math.max(Math.min(imgPos.y + (e.pageY - dragStart.y), 0), $canvas.height - $avatar.height)
  };
};

// Extract image dataUrl from drop event
var processInput = function processInput(e) {
  e.stopPropagation();
  e.preventDefault();
  // Setup file reader
  var reader = new FileReader();
  var file = e.dataTransfer.files[0];
  var acceptedFiles = ['png', 'bmp', 'jpg', 'jpeg', 'gif'];
  // Ensure that the file type
  if (!acceptedFiles.includes(file.type.replace('image/', ''))) {
    alert('Incompatible file type!');
    return;
  }
  // Initiate reading of file
  reader.onload = function (file) {
    return drawAvatar(file.srcElement.result);
  };
  reader.readAsDataURL(file);
};

var nextFilter = function nextFilter() {
  var overlay = document.querySelector('overlay-');
  var index = parseInt(overlay.dataset.index, 10);
  if (index < overlay.children.length - 1) {
    overlay.dataset.index = ++index;
    overlay.style.transform = 'translateX(-' + index * 62 + 'vmin)';
    // Add active class to focus filter
    [].concat(_toConsumableArray(overlay.children)).forEach(function (x) {
      return x.classList.remove('active');
    });
    overlay.children[index].classList.add('active');
  }
};

var prevFilter = function prevFilter() {
  var overlay = document.querySelector('overlay-');
  var index = parseInt(overlay.dataset.index, 10);
  if (index > 0) {
    overlay.dataset.index = --index;
    overlay.style.transform = 'translateX(-' + index * 62 + 'vmin)';
    // Add active class to focus filter
    [].concat(_toConsumableArray(overlay.children)).forEach(function (x) {
      return x.classList.remove('active');
    });
    overlay.children[index].classList.add('active');
  }
};

// Create a drag-and-drop interface for images on entire body
$body.addEventListener('dragover', function (e) {
  e.stopPropagation();
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
});
// When the user drops or inputs an image process the image
$body.addEventListener('drop', processInput);

// Pan image on drag from $canvas
$canvas.addEventListener('mousedown', start);
// Stop any tracking at end of drag
$body.addEventListener('mouseup', stop);
$body.addEventListener('mouseleave', stop);

// When the user uses the arrow keys to change filter
$body.addEventListener('keyup', function (e) {
  // Right arrow for next filter
  if (e.keyCode === 39) nextFilter();
  // Left arrow for previous filter
  if (e.keyCode === 37) prevFilter();
  // Spacebar from download
  if (e.keyCode === 32) download();
});

// Listen for interaction with controls
$next.addEventListener('click', nextFilter);
$download.addEventListener('click', download);
$prev.addEventListener('click', prevFilter);

// Apply default avatar
drawAvatar('avatar.jpg');