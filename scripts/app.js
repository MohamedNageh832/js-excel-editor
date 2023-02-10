Array.prototype.hasArray = function hasArray(arr) {
  if (this.length < 1) return false;

  for (let i = 0; i < this.length; i++) {
    const item = this[i];

    if (!Array.isArray(item)) continue;

    if (item.filter((val) => arr.includes(val)).length === arr.length)
      return true;
  }

  return false;
};

const tableHolder = document.querySelector(".table-holder");
const fileDroppers = document.querySelectorAll(".file_input");

const contentsPreview = document.querySelector(".contents-preview");

contentsPreview.addEventListener("dragover", () => {
  if (!hiddenDropBox) return;
  fileDroppers[1].classList.remove("hidden");
  contentsPreview.classList.add("dragover");
  contentsPreview.addEventListener("mouseout", windowMouseUp);
});

function windowMouseUp() {
  fileDroppers[1].classList.add("hidden");
  contentsPreview.classList.remove("dragover");
  this.removeEventListener("mouseout", windowMouseUp);
}

let excelData = {};

const mergeBtn = document.querySelector(".merge-btn");

mergeBtn.addEventListener("click", () => {
  const { currentFile, ...openedFiles } = excelData;
  const filesToMerge = Object.keys(openedFiles);

  mergeData(filesToMerge, "newFile");
});

const saveBtn = document.querySelector(".save-btn");

saveBtn.addEventListener("click", () => {
  if (Object.keys(excelData).length < 2) return;
  saveExcelFile(excelData[excelData.currentFile]);
});

// =================================== Functions ==============================//

// TODO: Add to class

function mergeData(fileNamesArray = [], newFileName) {
  if (fileNamesArray.length < 2) return;

  if (!newFileName.includes(".xlsx")) newFileName = `${newFileName}.xlsx`;
  const result = [];

  fileNamesArray.forEach((file) => {
    if (!excelData[file]) throw Error("Failed to merge");

    excelData[file].forEach((row) => {
      // console.log(result, row);

      // console.log(result.hasArray(row));
      if (result.hasArray(row)) return;

      result.push(row);
    });
  });

  excelData.currentFile = newFileName;
  excelData[newFileName] = result;

  openNewTab(newFileName);
  addPagesNav(Object.keys(excelData[excelData.currentFile]));
  createTable(newFileName, result);
}

// ! BUG: Values are doubled
