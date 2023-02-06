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
const contentsPreview = document.querySelector(".contents-preview");
const tableHolder = document.querySelector(".table-holder");
const fileDroppers = document.querySelectorAll(".file_input");

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

const tabsNav = document.querySelector(".tabs");
const previewTable = document.querySelector(".table");
const pagesNav = document.querySelector(".pages");
let excelData = {};

fileDroppers.forEach((el) => el.addEventListener("input", importFile));

async function importFile(e) {
  const file = e.target.files[0];

  if (!file) return;

  let fileName = file.name;

  if (!file) throw Error("Failed to load the file");

  if (excelData.currentFile === fileName)
    fileName = generateUniqueName(fileName);

  Object.assign(excelData, { currentFile: fileName });
  excelData[fileName] = {};

  const reader = new FileReader();
  reader.readAsBinaryString(file);

  reader.addEventListener("load", (e) => {
    const contents = processExcel(e.target.result);

    Object.assign(excelData[fileName], { ...contents });

    previewFile(contents);
  });
}

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

const toggleBordersBtn = document.querySelector(".enable-borders-btn");

toggleBordersBtn.addEventListener("click", () => {
  if (previewTable.classList.contains("borders")) {
    previewTable.classList.remove("borders");
    toggleBordersBtn.classList.remove("active");
  } else {
    previewTable.classList.add("borders");
    toggleBordersBtn.classList.add("active");
  }
});

const mergeColumnsBtn = document.querySelector(".merge-columns-btn");

mergeColumnsBtn.addEventListener("click", () => {
  const filesOpened = Object.keys(excelData).length - 2;
  if (filesOpened < 1) return;
  createFindtotalForm();
});

// =================================== Functions ==============================//

function generateUniqueName(name) {
  let i = 1;
  while (true) {
    const newName = name.replace(/.xlsx/i, `(${i}).xlsx`);

    if (!excelData[newName]) return newName;

    i++;
  }
}

function processExcel(data) {
  var workbook = XLSX.read(data, {
    type: "binary",
  });

  var firstSheet = workbook.SheetNames[0];
  var data = to_json(workbook);

  return data;
}

function to_json(workbook) {
  var result = {};
  workbook.SheetNames.forEach(function (sheetName) {
    var roa = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      raw: true,
    });
    if (roa.length) result[sheetName] = roa;
  });
  return JSON.parse(JSON.stringify(result, 2, 2));
}

function previewFile(data) {
  const pages = Object.keys(data);
  const paperData = data[pages[0]];

  adjustColumns(paperData);

  openNewTab(excelData.currentFile);
  addPagesNav(pages);
  createTable(excelData.currentFile, pages[0], paperData);

  fileDroppers[1].classList.add("hidden");
  contentsPreview.classList.remove("empty");
}

function addPagesNav(pages) {
  pagesNav.textContent = "";

  pages.forEach((page, i) => {
    const button = document.createElement("button");
    button.textContent = page;
    button.className = "btn pages__btn";

    if (i === 0) button.classList.add("active");

    button.addEventListener("click", () => {
      const pagesBtns = document.querySelectorAll(".pages__btn");

      removeActive(pagesBtns);

      button.classList.add("active");

      const paperData = excelData[excelData.currentFile][page];

      adjustColumns(paperData);

      createTable(excelData.currentFile, page, paperData);
    });

    pagesNav.appendChild(button);
  });
}

function adjustColumns(data) {
  const rowLength = data.reduce((prev, curr) => {
    if (!Array.isArray(curr)) return;
    return Math.max(prev, curr.length);
  }, 0);

  data.forEach((row) => {
    if (row.length < rowLength) {
      const diff = rowLength - row.length;

      for (let i = 0; i < diff; i++) {
        row.push("");
      }
    }
  });
}

function openNewTab(title) {
  const button = document.createElement("button");
  const closeBtn = document.createElement("span");
  const closeIcon = document.createElement("img");

  closeIcon.src = "./assets/svg/close_icon.svg";
  closeIcon.className = "tab__close-icon";
  closeBtn.className = "tab__close-btn";
  closeBtn.appendChild(closeIcon);

  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const openedFiles = Object.keys(excelData);

    const index = openedFiles.indexOf(title);
    const prevFile = openedFiles[index + 1];
    const nextFile = openedFiles[index - 1];
    let fileToOpen = undefined;

    delete excelData[title];

    if (openedFiles.length - 1 < 3) contentsPreview.classList.add("empty");
    else if (prevFile) {
      const page = Object.keys(excelData[prevFile])[0];
      addPagesNav(Object.keys(excelData[excelData.currentFile]));
      createTable(prevFile, page, excelData[prevFile]);
    } else if (nextFile) {
      const page = Object.keys(excelData[nextFile])[0];
      addPagesNav(Object.keys(excelData[excelData.currentFile]));
      createTable(nextFile, page, excelData[nextFile]);
    }

    const tabs = Array.from(tabsNav.children);

    tabs.forEach((el) => {
      if (el.textContent === fileToOpen) el.classList.add("active");
    });

    excelData.currentFile = fileToOpen;

    button.remove();
  });

  button.textContent = title;
  button.appendChild(closeBtn);
  button.className = "tabs__btn active";

  const tabs = Array.from(tabsNav.children);
  removeActive(tabs);

  button.addEventListener("click", () => {
    const tabs = Array.from(tabsNav.children);
    removeActive(tabs);
    button.classList.add("active");

    const page = Object.keys(excelData[title])[0];
    const data = excelData[title][page];
    excelData.currentFile = title;

    addPagesNav(Object.keys(excelData[excelData.currentFile]));
    createTable(title, page, data);
  });

  button.addEventListener("dblclick", () => {
    const oldValue = button.textContent;
    const input = document.createElement("input");
    input.value = button.textContent;
    input.className = "tab__input";

    button.textContent = "";
    button.appendChild(input);

    input.addEventListener("click", (e) => e.stopPropagation());
    input.addEventListener("dblclick", (e) => e.stopPropagation());
    input.addEventListener("blur", () =>
      applyInputVal(input, button, oldValue)
    );
    input.addEventListener("keydown", (e) => {
      if (e.key === "ENTER") applyInputVal(input, button, oldValue);
    });
  });

  tabsNav.prepend(button);
}

function applyInputVal(input, el, oldValue) {
  let newValue = input.value;
  input.remove();

  if (!newValue.includes(".xlsx")) newValue = `${newValue}.xlsx`;
  el.textContent = newValue;

  if (oldValue === newValue) return;

  excelData.currentFile = newValue;
  excelData[newValue] = excelData[oldValue];

  delete excelData[oldValue];
}

function removeActive(elements) {
  elements.forEach((el) => el.classList.remove("active"));
}

function createTable(title, page, data) {
  excelData.currentFile = title;
  excelData.activePage = page;
  previewTable.textContent = "";

  data.forEach((row, i) => {
    const tr = document.createElement("tr");

    if (i === 0) tr.className = "table__head pos-sticky";
    else tr.classList.add("table__row");

    row.forEach((cell) => {
      const td = document.createElement("td");

      td.className = "table__cell";
      td.textContent = cell || "";

      if (i !== 0) addTableCellEvents(td);

      tr.appendChild(td);
    });

    const td = document.createElement("td");
    if (i !== 0) {
      const img = document.createElement("img");

      img.src = "./assets/svg/drag_indicator_icon.svg";
      img.className = "table__row-options";

      td.addEventListener("dblclick", () => {
        if (tr.classList.contains("pos-sticky"))
          tr.classList.remove("pos-sticky");
        else tr.classList.add("pos-sticky");
      });

      td.appendChild(img);
    }

    tr.prepend(td);

    previewTable.appendChild(tr);
  });
}

function addTableCellEvents(td) {
  td.addEventListener("click", () => {
    const input = document.createElement("input");
    input.className = "cell__input";
    input.value = td.textContent;

    td.textContent = "";
    td.appendChild(input);
    input.focus();

    input.addEventListener("click", (e) => e.stopPropagation());

    input.addEventListener("blur", () => {
      td.textContent = input.value;
      saveChanges();
      input.remove();
    });
  });
}

function saveChanges() {
  const values = [];

  const rows = Array.from(previewTable.children);

  rows.forEach((row) => {
    const cells = Array.from(row.children);

    const cellsVal = cells.map((cell) => cell.textContent);

    values.push(cellsVal);
  });

  excelData[excelData.currentFile][excelData.activePage] = values;
}

function saveExcelFile(data) {
  const ws = XLSX.utils.json_to_sheet(data, { skipHeader: 1 });
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, excelData.currentFile);
  XLSX.writeFile(wb, excelData.currentFile);
}

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

function createFindtotalForm(data) {
  const form = document.createElement("form");
  const overlay = document.createElement("div");
  const title = document.createElement("h3");
  const formControls = createFormControls(form, overlay);
  const values = {};

  form.className = "form form--fixed";
  overlay.className = "overlay";
  overlay.addEventListener("click", () => {
    form.remove();
    overlay.remove();
  });
  title.textContent = "حدد الملفات";

  form.appendChild(title);

  const { currentFile, activePage, ...files } = excelData;
  const openedFiles = Object.keys(files);

  openedFiles.forEach((file) => {
    const checkbox = createCheckbox(file, (e) => {
      const checkboxValue = values["filesToMerge"];
      const { value } = e.target;

      if (checkboxValue) {
        if (checkboxValue.includes(value)) {
          values["filesToMerge"] = checkboxValue.filter((el) => el !== value);
        } else values["filesToMerge"].push(value);
      } else values["filesToMerge"] = [value];
    });
    form.appendChild(checkbox);
  });

  form.appendChild(formControls);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    console.log(values);
    const columns = checkAvailableData(values.filesToMerge);
    mergeSimilarColumns(values.filesToMerge, columns);
  });

  document.body.append(overlay, form);
}

function createCheckbox(label, callback) {
  const holder = document.createElement("section");
  const checkbox = document.createElement("input");
  const labelEL = document.createElement("label");

  checkbox.type = "checkbox";
  checkbox.value = label;
  checkbox.className = "checkbox__input";
  checkbox.id = label;
  checkbox.addEventListener("change", callback);

  labelEL.textContent = label;
  labelEL.setAttribute("for", label);

  holder.className = "form__checkbox";
  holder.append(checkbox, labelEL);

  return holder;
}

function createFormControls(form, overlay) {
  const holder = document.createElement("section");
  const submitBtn = document.createElement("button");
  const closeBtn = document.createElement("button");

  submitBtn.type = "submit";
  submitBtn.className = "btn btn--primary";
  submitBtn.textContent = "تأكيد";

  closeBtn.type = "button";
  closeBtn.className = "btn btn--secondary";
  closeBtn.textContent = "إلغاء";
  closeBtn.addEventListener("click", () => closeForm(form, overlay));
  holder.className = "flex gap-3";

  holder.append(submitBtn, closeBtn);

  return holder;
}

function closeForm(form, overlay) {
  if (form) form.remove();
  if (overlay) overlay.remove();
}

function checkAvailableData(fileNames) {
  let result = [];

  fileNames.forEach((file) => {
    const pages = Object.keys(excelData[file]);
    const pagesToSkip = [0];

    pages.forEach((page, i) => {
      if (pagesToSkip.includes(i)) return;

      const pageData = excelData[file][page];

      result = result.concat(
        pageData[1].reduce((prev, curr) => {
          if (curr !== null && curr !== undefined) return [...prev, curr];
          else return prev;
        }, [])
      );
    });
  });

  return result;
}

// ! BUG: Values are doubled

function mergeSimilarColumns(fileNames, columns) {
  let intialValues = [columns, arrayOf(columns.length, 0)];
  return fileNames.reduce((prev, currFile) => {
    return getTotalValues(prev, columns, currFile);
  }, intialValues);
}

function getTotalValues(intialValues, columns, file) {
  const pages = Object.keys(excelData[file]);
  const rowsToSkip = [51, 52, 53];
  const pagesToSkip = [0];

  const finalValues = pages.reduce((prev, curr, i) => {
    if (pagesToSkip.includes(i)) return prev;

    const pageData = excelData[file][curr];
    const indexes = getIndexes(columns, pageData[1]);

    // pageData.forEach((row, j) => {
    //   if (j < 2 || rowsToSkip.includes(j)) return prev;

    //   console.log(pageData, prev, j, i);

    //   return addRowValues(row, prev, indexes);
    // });

    let result = null;

    for (let j = 0; j < pageData.length; j++) {
      const row = pageData[j];
      if (j < 2 || rowsToSkip.includes(j)) continue;

      console.log(addRowValues(row, prev, indexes));

      result = addRowValues(row, prev, indexes);
    }

    return result;
  }, intialValues);

  return finalValues;
}

function getIndexes(columns, pageHeader) {
  return pageHeader.reduce(
    (prev, curr) => [...prev, columns.indexOf(curr)],
    []
  );
}

function addRowValues(row, result, indexes) {
  row.forEach((el, k) => {
    if (indexes[k] === -1) return;

    if (!isNaN(+el)) result[1][indexes[k]] = result[1][indexes[k]] + +el;
  });

  return result;
}

function arrayOf(length, value) {
  return [...Array(length)].map((el) => value);
}
