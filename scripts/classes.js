// ====================================== FilesManager =========================================== //

class FilesManager {
  static activeFile = null;
  static activeSheet = null;
  static openedFiles = {};

  static importFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    let fileName = file.name;
    if (!file) throw Error("Failed to load the file");

    if (FilesManager.activeFile === fileName)
      fileName = generateUniqueName(fileName);

    FilesManager.activeFile = fileName;
    FilesManager.openedFiles[fileName] = {};

    const reader = new FileReader();
    reader.readAsBinaryString(file);

    reader.addEventListener("load", (e) => {
      const contents = FilesManager.processExcel(e.target.result);
      Object.assign(FilesManager.openedFiles[fileName], { ...contents });
      FilesManager.previewFile(contents);
    });
  }

  static processExcel(data) {
    let workbook = XLSX.read(data, {
      type: "binary",
    });

    let firstSheet = workbook.SheetNames[0];
    let contents = this.to_json(workbook);

    return contents;
  }

  static to_json(workbook) {
    let result = {};
    workbook.SheetNames.forEach(function (sheetName) {
      let roa = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
        header: 1,
        raw: true,
      });
      if (roa.length) result[sheetName] = roa;
    });
    return JSON.parse(JSON.stringify(result, 2, 2));
  }

  static previewFile(data) {
    const sheets = Object.keys(data);
    const paperData = data[sheets[0]];

    Utils.makeRowSameLength(paperData);

    Components.openNewTab(FilesManager.activeFile);

    Utils.createTable({
      fileName: FilesManager.activeFile,
      data: paperData,
      sheets,
    });

    fileDroppers[1].classList.add("hidden");
    contentsPreview.classList.remove("empty");
  }

  static saveExcelFile(data) {
    const ws = XLSX.utils.json_to_sheet(data, { skipHeader: 1 });
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, this.activeFile);
    XLSX.writeFile(wb, this.activeFile);
  }
}

// ======================================= Components ========================================= //

class Components {
  static button({ type, text, className, childEl }) {
    const button = document.createElement("button");

    button.type = type ? type : "button";
    button.textContent = text ? text : "";
    if (childEl) button.appendChild(childEl);
    button.className = className;

    return button;
  }

  static input({ type, id, value, className }) {
    const input = document.createElement("input");
    input.type = type ? type : "text";
    if (id) input.id = id;
    input.value = value;
    input.className = className;

    return input;
  }

  static checkbox(label, callback) {
    const holder = document.createElement("section");
    const labelEL = document.createElement("label");
    const checkbox = Components.input({
      type: "checkbox",
      id: label,
      value: label,
      className: "checkbox__input",
    });

    checkbox.addEventListener("change", callback);

    labelEL.textContent = label;
    labelEL.setAttribute("for", label);

    holder.className = "form__checkbox";
    holder.append(checkbox, labelEL);

    return holder;
  }

  static closeTabBtn(title) {
    const closeIcon = document.createElement("img");
    closeIcon.src = "./assets/svg/close_icon.svg";
    closeIcon.className = "tab__close-icon";

    const button = this.button({
      className: "tab__close-btn",
      childEl: closeIcon,
    });

    button.addEventListener("click", (e) => {
      e.stopPropagation();
      const { openedFiles } = FilesManager;
      const openedFilesNames = Object.keys(FilesManager.openedFiles);

      const index = openedFilesNames.indexOf(title);
      const prevFile = openedFilesNames[index + 1];
      const nextFile = openedFilesNames[index - 1];
      let fileToOpen = undefined;

      delete FilesManager.openedFiles[title];

      const openedFilesCount = openedFilesNames.length - 1;

      if (openedFilesCount < 1) {
        fileDroppers[1].classList.remove("hidden");
        contentsPreview.classList.add("empty");
      } else if (prevFile) fileToOpen = prevFile;
      else if (nextFile) fileToOpen = nextFile;

      const sheets = Object.keys(openedFiles[fileToOpen]);
      Utils.createTable({
        fileName: fileToOpen,
        sheetName: sheets[0],
        data: openedFiles[fileToOpen][sheets[0]],
        sheets,
      });

      const tabs = Array.from(tabsNav.children);
      tabs.forEach((el) => {
        if (el.textContent === fileToOpen) el.classList.add("active");
      });

      button.parentElement.remove();
    });

    return button;
  }

  static openNewTab(title) {
    const closeBtn = this.closeTabBtn(title);

    const button = this.button({
      text: title,
      className: "tabs__btn active",
      childEl: closeBtn,
    });

    const tabs = Array.from(tabsNav.children);
    Utils.removeClassActive(tabs);

    button.addEventListener("click", (e) => Utils.openFileFromTab(e.target));
    button.addEventListener("dblclick", (e) => Utils.editTab(e.target));

    tabsNav.prepend(button);
  }

  static tableRow({ head, className }) {
    const tr = document.createElement("tr");

    if (head) tr.className = "table__head pos-sticky";
    else tr.className = "table__row";

    if (className) tr.classList.add(className);

    return tr;
  }

  static tableCell({ value, className }) {
    const td = document.createElement("td");

    td.className = `table__cell ${className ? className : ""}`;
    td.textContent = value || "";

    return td;
  }

  static optionsCell({ inHead, tr, value, className }) {
    const td = document.createElement("td");
    td.textContent = value;
    if (className) td.className = className;

    if (!inHead) {
      //   const img = document.createElement("img");

      //   img.src = "./assets/svg/drag_indicator_icon.svg";
      //   img.className = "table__row-options";

      td.addEventListener("dblclick", () => {
        if (tr.classList.contains("pos-sticky"))
          tr.classList.remove("pos-sticky");
        else tr.classList.add("pos-sticky");
      });

      //   td.appendChild(img);
    }

    return td;
  }

  static tableBody(tableElement, data) {
    if (!tableElement)
      throw Error("Cannot add to tableElement = " + tableElement);

    tableElement.textContent = "";

    const tr = Components.tableRow({ className: "table__numbering" });

    [...data[1], ""].forEach((_, i) => {
      const td = Components.tableCell({
        value: i !== 0 ? i : "",
        className: "table__number",
      });

      td.addEventListener("dblclick", () => {
        const sameColumnCells = Array.from(
          document.querySelectorAll(`.table__cell:nth-child(${i + 1})`)
        );

        if (td.classList.contains("sticky-column")) {
          td.classList.remove("sticky-column");
        } else {
          td.classList.add("sticky-column");
        }

        sameColumnCells.forEach((el) => {
          if (el === td) return;

          if (el.classList.contains("pos-sticky--x")) {
            el.classList.remove("pos-sticky--x");
          } else {
            el.classList.add("pos-sticky--x");
          }
        });
      });

      tr.appendChild(td);
    });

    tableElement.appendChild(tr);
    data.forEach((row, i) => {
      const tr = Components.tableRow({ head: i === 0 });

      row.forEach((cell) => {
        const td = Components.tableCell({ value: cell });
        if (i !== 0) Utils.addTableCellEvents(td);
        tr.appendChild(td);
      });

      const td = Components.optionsCell({
        inHead: i === 0,
        tr,
        value: i + 1,
        className: "table__number table__number--vertical",
      });

      tr.prepend(td);

      tableElement.appendChild(tr);
    });
  }

  static cellContextMenu() {
    // const
  }

  static filePaginationButton({ makeActive, sheetName }) {
    const button = Components.button({
      text: sheetName,
      className: "btn pages__btn",
    });

    if (makeActive) {
      button.classList.add("active");
      FilesManager.activeSheet = sheetName;
    }

    button.addEventListener("click", () => {
      const pagesBtns = document.querySelectorAll(".pages__btn");
      Utils.removeClassActive(pagesBtns);

      button.classList.add("active");

      const fileName = FilesManager.activeFile;
      const paperData = FilesManager.openedFiles[fileName][sheetName];
      Utils.makeRowSameLength(paperData);
      Utils.createTable({ fileName, sheetName, data: paperData });
    });

    return button;
  }

  static pagesNav(navElement, sheets) {
    navElement.textContent = "";

    sheets.forEach((sheetName, i) => {
      const button = Components.filePaginationButton({
        makeActive: i === 0,
        sheetName,
      });

      navElement.appendChild(button);
    });
  }

  static form(title, data) {
    const form = document.createElement("form");
    const overlay = document.createElement("div");
    const titleEl = document.createElement("h3");
    const formControls = this.formControls(form, overlay);
    const values = {};

    form.className = "form form--fixed";
    overlay.className = "overlay";
    overlay.addEventListener("click", () => {
      form.remove();
      overlay.remove();
    });
    titleEl.textContent = title;

    form.append(titleEl, formControls);

    return { form, values, overlay, formControls };
  }

  static formControls(form, overlay) {
    const holder = document.createElement("section");

    const submitBtn = Components.button({
      type: "submit",
      text: "تأكيد",
      className: "btn btn--primary",
    });

    const closeBtn = Components.button({
      text: "إلغاء",
      className: "btn btn--secondary",
    });

    closeBtn.addEventListener("click", () => Utils.closeForm(form, overlay));

    holder.className = "flex gap-3";
    holder.append(submitBtn, closeBtn);
    return holder;
  }
}

// ======================================== Utils =============================================== //

class Utils {
  static generateUniqueName(name) {
    let i = 1;
    while (true) {
      const newName = name.replace(/.xlsx/i, `(${i}).xlsx`);

      if (!FilesManager[newName]) return newName;

      i++;
    }
  }

  static activateFileDropper() {
    fileDroppers[1].classList.remove("hidden");
    contentsPreview.classList.add("dragover");
    contentsPreview.addEventListener("mouseout", Utils.windowMouseUp);
  }

  static windowMouseUp() {
    fileDroppers[1].classList.add("hidden");
    contentsPreview.classList.remove("dragover");
    this.removeEventListener("mouseout", Utils.windowMouseUp);
  }

  static openFileFromTab(tabEl) {
    const { openedFiles, activeFile, activeSheet } = FilesManager;
    const fileName = tabEl.textContent;
    const sheets = Object.keys(openedFiles[fileName]);
    const fileAlreadyOpened =
      activeFile === fileName && activeSheet === sheets[0];

    if (fileAlreadyOpened) return;

    const tabs = Array.from(tabsNav.children);
    Utils.removeClassActive(tabs);
    tabEl.classList.add("active");

    const data = openedFiles[fileName][sheets[0]];

    Utils.createTable({
      fileName,
      sheetName: sheets[0],
      data,
      sheets,
    });
  }

  static editTab(tabEl) {
    const oldValue = tabEl.textContent;
    const input = Components.input({
      value: oldValue,
      className: "tab__input",
    });

    tabEl.textContent = "";
    tabEl.appendChild(input);

    input.addEventListener("click", (e) => e.stopPropagation());
    input.addEventListener("dblclick", (e) => e.stopPropagation());
    input.addEventListener("blur", () =>
      Utils.renameTab({ input, parentEl: tabEl, oldValue })
    );
    input.addEventListener("keydown", (e) => {
      if (e.key === "ENTER")
        Utils.renameTab({ input, parentEl: tabEl, oldValue });
    });

    return input;
  }

  static createTable({ fileName, sheetName, data, sheets }) {
    FilesManager.activeFile = fileName;
    FilesManager.activeSheet = sheetName;
    if (sheets) Components.pagesNav(pagesNav, sheets);

    Components.tableBody(previewTable, data);
  }

  static makeRowSameLength(data) {
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

  static renameTab({ input, parentEl, oldValue }) {
    let newValue = input.value;
    input.remove();
    if (oldValue === newValue) return;

    if (!newValue.includes(".xlsx")) newValue = `${newValue}.xlsx`;
    parentEl.textContent = newValue;

    FilesManager.activeFile = newValue;
    FilesManager.openedFiles[newValue] = FilesManager.openedFiles[oldValue];

    delete FilesManager.openedFiles[oldValue];
  }

  static saveTableChanges() {
    const values = [];

    const rows = Array.from(previewTable.children);

    rows.forEach((row) => {
      const cells = Array.from(row.children);

      const rowValues = cells.map((cell) => cell.textContent);

      values.push(rowValues);
    });

    const { activeFile, activeSheet } = FilesManager;

    FilesManager.openedFiles[activeFile][activeSheet] = values;
  }

  static closeForm(form, overlay) {
    if (form) form.remove();
    if (overlay) overlay.remove();
  }

  static checkAvailableColumns(fileNames, sheetsToSkip) {
    let result = [];

    fileNames.forEach((file) => {
      const { openedFiles } = FilesManager;
      const sheets = Object.keys(openedFiles[file]);

      sheets.forEach((sheet, i) => {
        if (sheetsToSkip.includes(i)) return;
        const sheetData = openedFiles[file][sheet];

        result = sheetData[1].reduce((prev, curr) => {
          const cellIsEmpty = !curr || curr === "";
          const duplicateData = result.includes(curr);

          if (cellIsEmpty || duplicateData) return prev;
          return [...prev, curr];
        }, result);
      });
    });

    return result;
  }

  static mergeSimilarColumns(fileNames, columns) {
    let result = [columns, Utils.arrayOf(columns.length, 0)];
    // return fileNames.reduce((prev, currFile) => {
    //   return this.getTotalValues(prev, columns, currFile);
    // }, intialValues);
    const rowsToSkip = [52, 53, 54];

    fileNames.forEach((fileName) => {
      const { openedFiles } = FilesManager;

      const sheets = Object.keys(openedFiles[fileName]);

      sheets.forEach((sheet) => {
        const sheetData = openedFiles[fileName][sheet];
        const indexes = Utils.getIndexes(columns, sheetData[1]); // TODO: SHEET ROW IS TO BE DYNAMIC

        result = sheetData.reduce((prev, currRow, i) => {
          if (rowsToSkip.includes(i)) return prev;
          currRow.forEach((el, k) => {
            if (indexes[k] === -1 || isNaN(+el)) return;
            prev[1][indexes[k]] += +el;

            // Utils.addRowValues();
          });
          return prev;
        }, result);
      });
    });

    console.log(result);

    return result;
  }

  static getTotalValues({ previousValues, columns, file }) {
    const rowsToSkip = [51, 52, 53];
    const pagesToSkip = [0];

    const finalValues = pages.reduce((prev, curr, i) => {
      if (pagesToSkip.includes(i)) return prev;

      const pageData = FilesManager[file][curr];

      // pageData.forEach((row, j) => {
      //   if (j < 2 || rowsToSkip.includes(j)) return prev;

      //   console.log(pageData, prev, j, i);

      //   return addRowValues(row, prev, indexes);
      // });

      let result = null;

      for (let j = 0; j < pageData.length; j++) {
        const row = pageData[j];
        if (j < 2 || rowsToSkip.includes(j)) continue;

        result = this.addRowValues(row, prev, indexes);
      }

      return result;
    }, previousValues);

    return finalValues;
  }

  static getIndexes(columns, pageHeader) {
    console.lo;
    return pageHeader.reduce(
      (prev, curr) => [...prev, columns.indexOf(curr)],
      []
    );
  }

  static addRowValues(result, indexes) {}

  static arrayOf(length, value) {
    return [...Array(length)].map((el) => value);
  }

  static removeClassActive(elements) {
    elements.forEach((el) => el.classList.remove("active"));
  }

  static addTableCellEvents(td) {
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
        input.remove();
        Utils.saveTableChanges();
      });
    });
  }
}

// ========================================== FormBuilder ============================================== //

class FormBuilder {
  static createFindtotalForm(data) {
    const { form, formControls, overlay, values } =
      Components.form("حدد الملفات");
    const { openedFiles } = FilesManager;
    const fileNames = Object.keys(openedFiles);

    fileNames.forEach((file) => {
      const checkbox = Components.checkbox(file, (e) => {
        const checkboxValue = values["filesToMerge"];
        const { value } = e.target;

        if (checkboxValue) {
          if (checkboxValue.includes(value)) {
            values["filesToMerge"] = checkboxValue.filter((el) => el !== value);
          } else values["filesToMerge"].push(value);
        } else values["filesToMerge"] = [value];
      });

      form.insertBefore(checkbox, formControls);
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const columns = Utils.checkAvailableColumns(values.filesToMerge, [0]);
      Utils.mergeSimilarColumns(values.filesToMerge, columns);
    });

    document.body.append(overlay, form);
  }
}

// ================================= Events ======================================= //

// Contents preview

const previewTable = document.querySelector(".table");
const fileDroppers = document.querySelectorAll(".file_input");
const tabsNav = document.querySelector(".tabs");
const pagesNav = document.querySelector(".pages");

fileDroppers.forEach((el) =>
  el.addEventListener("input", FilesManager.importFile)
);

const contentsPreview = document.querySelector(".contents-preview");

contentsPreview.addEventListener("dragover", () => {
  if (!hiddenDropBox) return;
  Utils.activateFileDropper();
});

// Taggle borders

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

// getTotalValues
const getTotalBtn = document.querySelector(".get-total-btn");

getTotalBtn.addEventListener("click", () => {
  const { openedFiles } = FilesManager;
  const noFilesOpened = Object.keys(openedFiles).length < 1;

  if (noFilesOpened) return;
  FormBuilder.createFindtotalForm();
});
