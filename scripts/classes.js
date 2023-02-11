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
    if (type === "text" || !type) input.dir = "auto";
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

    td.className = className ? className : "";
    td.textContent = value || "";

    return td;
  }

  static optionsCell({ tr, rowIndex, className }) {
    const td = document.createElement("td");
    td.textContent = rowIndex + 1;
    if (className) td.className = className;
    const inHead = rowIndex === 0;

    if (!inHead) {
      //   const img = document.createElement("img");

      //   img.src = "./assets/svg/drag_indicator_icon.svg";
      //   img.className = "table__row-options";

      Utils.addNumberingCellEvents({ orientation: "row", td, index: rowIndex });

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

      tr.appendChild(td);

      if (i === 0) return;
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

      // ! number cell index exceeds data cells by one
      Utils.addNumberingCellEvents({ td, index: i - 1, orientation: "column" });
    });

    tableElement.appendChild(tr);
    data.forEach((row, i) => {
      const tr = Components.tableRow({ head: i === 0 });

      row.forEach((cell) => {
        const td = Components.tableCell({
          className: "table__cell",
          value: cell,
        });
        if (i !== 0) Utils.addTableCellEvents(td);
        tr.appendChild(td);
      });

      const td = Components.optionsCell({
        rowIndex: i,
        tr,
        className: "table__number table__number--vertical",
      });

      tr.prepend(td);

      tableElement.appendChild(tr);
    });
  }

  static cellContextMenu({ index, dataIs, onRemove }) {
    const menu = document.createElement("ul");
    menu.className = "menu cell__context-menu";

    const options = [
      {
        text: "اضافة اجمالي ملفات",
        action: () => {
          FormBuilder.createFindtotalForm({
            insert: "values",
            insertInto: "row",
            index,
          });
        },
      },
      {
        text: dataIs === "row" ? "حذف الصف" : "حذف العمود",
        action: () => FormBuilder.confirmDeleteForm({ index, dataIs }),
      },
    ];

    options.forEach((option) => {
      const listItem = document.createElement("li");
      listItem.className = "context-menu__option";
      listItem.textContent = option.text;
      listItem.addEventListener("click", option.action);
      menu.appendChild(listItem);
    });

    const removeEl = () => {
      menu.remove();
      onRemove();
    };

    menu.removeEl = removeEl;

    return menu;
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

    form.addEventListener("submit", () => {
      form.remove();
      overlay.remove();
    });

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

  static addNumberingCellEvents({ orientation, td, index }) {
    td.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const onRemove = () => {
        const highZIndexEls = document.querySelectorAll(".z-100");
        highZIndexEls.forEach((el) => el.classList.remove("z-100"));

        const selectedColumnCells =
          document.querySelectorAll(".selected-column");

        selectedColumnCells.forEach((el) =>
          el.classList.remove("selected-column")
        );

        const selectedRows = document.querySelectorAll(".selected-row");
        selectedRows.forEach((el) => el.classList.remove("selected-row"));
      };

      Utils.closeContextMenus(e);

      const contextmenu = Components.cellContextMenu({
        index,
        dataIs: orientation,
        onRemove,
      });

      if (orientation === "column") {
        // ! Number cell index exceeds data cells by one so (index + 2) is the real order
        const sameColumnCells = Array.from(
          document.querySelectorAll(`.table__cell:nth-child(${index + 2})`)
        );

        sameColumnCells.forEach((el) => el.classList.add("selected-column"));
      } else if (orientation === "row") {
        td.parentElement.classList.add("selected-row");
      }

      td.classList.add("z-100");
      td.appendChild(contextmenu);
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
    const adjustedData = Utils.makeRowSameLength(data);
    FilesManager.activeFile = fileName;
    FilesManager.activeSheet = sheetName;
    if (sheets) Components.pagesNav(pagesNav, sheets);

    Components.tableBody(previewTable, adjustedData);
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

    return data;
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

    rows.slice(1, rows.length).forEach((row, i) => {
      const cells = Array.from(row.children);

      // Removing vertical number cells
      const filteredCells = cells.slice(1, cells.length);

      const rowValues = filteredCells.map((cell) => cell.textContent);

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
      const input = Components.input({
        className: "cell__input",
        value: td.textContent,
      });

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

  static createNewFile() {
    const fileName = "New file.xlsx";
    const sheetName = "1";
    let data = Utils.arrayOf(25, "");
    data = data.map((_) => Utils.arrayOf(20, ""));

    Components.openNewTab(fileName);

    Utils.createTable({
      fileName,
      sheetName,
      sheets: ["1"],
      data,
    });

    FilesManager.openedFiles[fileName] = { [sheetName]: data };
  }

  static closeContextMenus(e) {
    if (!e.target.classList.contains("menu")) {
      const openedMenus = document.querySelectorAll(".menu");
      if (openedMenus.length > 0) openedMenus.forEach((el) => el.removeEl());
    }
  }
}

// ========================================== FormBuilder ============================================== //

class FormBuilder {
  static createFindtotalForm({ insert, insertInto, index }) {
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
      const newData = Utils.mergeSimilarColumns(values.filesToMerge, columns);

      if (insertInto === "row") {
        const { activeFile, activeSheet, openedFiles } = FilesManager;
        openedFiles[activeFile][activeSheet][index] =
          insert === "title" ? newData[0] : newData[1];

        const data = openedFiles[activeFile][activeSheet];
        const sheets = Object.keys(openedFiles[activeFile]);

        Utils.createTable({
          fileName: activeFile,
          sheetName: activeSheet,
          data,
          sheets,
        });
      }
    });

    document.body.append(overlay, form);
  }

  static confirmDeleteForm({ index, dataIs }) {
    const { form, formControls, overlay, values } =
      Components.form("تأكيد الحذف؟");

    const formMessage = document.createElement("span");
    formMessage.className = "text--secondary";
    formMessage.textContent = "هل تريد تأكيد حذف البيانات؟";

    form.insertBefore(formMessage, formControls);

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const { openedFiles, activeFile, activeSheet } = FilesManager;

      if (dataIs === "row") {
        openedFiles[activeFile][activeSheet].splice(index, 1);
      } else if (dataIs === "column") {
        // const sameColumnCells = Array.from(
        //   document.querySelectorAll(`.table__cell:nth-child(${index + 1})`)
        // );

        openedFiles[activeFile][activeSheet].forEach((row) => {
          row.splice(index, 1);
        });
      }

      Utils.createTable({
        fileName: activeFile,
        sheetName: activeSheet,
        data: openedFiles[activeFile][activeSheet],
      });
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

// Create new file
const createNewFileBtn = document.querySelector(".tabs__create-new");

createNewFileBtn.addEventListener("click", () => {
  Utils.createNewFile();
});

// =========================================== Window events ============================================= //

window.addEventListener("click", Utils.closeContextMenus);
window.addEventListener("contextmenu", Utils.closeContextMenus);
