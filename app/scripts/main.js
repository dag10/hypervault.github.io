// Progress indicator

// Set up SVG animation
// see http://jakearchibald.com/2013/animated-line-drawing-svg/
var progressPath = document.querySelector('.progress path');
var pathLength = progressPath.getTotalLength();
progressPath.style.transition = progressPath.style.WebkitTransition =
  'none';
progressPath.style.strokeDasharray = pathLength + ' ' + pathLength;
progressPath.style.strokeDashoffset = pathLength;
progressPath.getBoundingClientRect();
progressPath.style.transition = progressPath.style.WebkitTransition =
  'stroke-dashoffset 300ms linear';

var updateProgress = function (percent) {
  var progress = pathLength - pathLength*(percent/100.0);
  progressPath.style.strokeDashoffset = progress;
  document.getElementById("percent").innerHTML = percent+"%";
}

// Progress hook
var progress = [];

var reset_progress = function () {
  progress = [];
  document.getElementById("progress-summary").innerHTML = '';
};

var progress_hook = function(p) {
  var h, pr, _i, _len;
  var progressPercent = 0;
  if (progress.length && (progress[progress.length - 1].what === p.what)) {
    progress[progress.length - 1] = p;
  } else {
    progress.push(p);
  }
  h = "";
  for (_i = 0, _len = progress.length; _i < _len; _i++) {
    pr = progress[_i];
    h += "<li>" + pr.what + " " + pr.i + "/" + pr.total + "</li>";
    if (_i == 0) {
      progressPercent += (10.0 * (pr.i / pr.total));
    }
    else {
      progressPercent += (15.0 * (pr.i / pr.total));
    }
  }
  updateProgress(Math.floor(progressPercent));
  document.getElementById("progress-summary").innerHTML = h;
};

//////////////////////////////////////////////////////////////////////////////////// Read file stuff
var globalFileData = {name:"", type:"", data:""};
var fileDataRaw = "";

function readFileData(fileObj, callback) {
  var reader = new FileReader();

  reader.onload = (function(theFile) {
    return function(e) {
      callback(theFile.name, theFile.type, e.target.result);
    };
  })(fileObj);

  // Read in the image file as a data URL.
  // reader.readAsArrayBuffer
  reader.readAsDataURL(fileObj);
}

function getFileData() {
  var fileList = document.getElementById("uploadInput").files;
  var file1 = fileList[0];
  readFileData(file1, function (fileName, fileType, fileData) {
      fileDataRaw = fileData;
      globalFileData['name'] = fileName;
      globalFileData['type'] = fileType;
      globalFileData['data'] = fileData;
      console.log('File name:' + fileName);
      console.log('File type:' + fileType);
      console.log(fileData);
  });
}

/////////////////////////////////////////////////////////////////////////////////// Encryption stuff
function encryptFileData(fileData, password, callback) {
  var data = new triplesec.Buffer(fileData);
  var key = new triplesec.Buffer(password);

  reset_progress();
  triplesec.encrypt({key:key, progress_hook: progress_hook, data:data}, function (err, encryptedData) {
    callback(err, encryptedData.toString('base64'));
  });
}

//////////////////////////////////////////////////////////////////////////////////// Vault rendering

function getVaultTemplate(callback) {
  url = "vault.html"
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      callback(xhr.responseText);
    }
  }
  xhr.send();
}

function stripDataPrefix(dataUrl) {
  var firstCommaIndex = dataUrl.indexOf(',');
  return dataUrl.slice(firstCommaIndex+1);
}

function renderVault(fileName, fileType, fileData, callback) {
  getVaultTemplate(function (vaultTemplate) {
    // Replace the 3 placeholders with the file name, file type, and file data
    var vault = vaultTemplate.replace('REPLACE_WITH_FILE_NAME', fileName)
      .replace('REPLACE_WITH_FILE_TYPE', fileType)
      .replace('REPLACE_WITH_FILE_DATA', fileData);
    callback(vault);
  });
}

function saveVault(vaultData, vaultFileName) {
  var vaultBlob = new Blob([vaultData], {type: "text/html;charset=utf-8"});
  saveAs(vaultBlob, vaultFileName);
}

function createVault() {
  var password = document.getElementById('password_input').value;
  var base64FileData = stripDataPrefix(globalFileData['data']);

  encryptFileData(base64FileData, password, function (err, encryptedData) {
    renderVault(globalFileData['name'], globalFileData['type'], encryptedData, function (vaultData) {
      saveVault(vaultData, "vault1.html");
    });
  });
}

