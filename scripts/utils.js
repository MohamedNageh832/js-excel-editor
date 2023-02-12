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

  static addBefore({ index, dataIs }) {
    const { openedFiles, activeFile, activeSheet } = FilesManager;

    if (dataIs === "row") {
      const rowLength = openedFiles[activeFile][activeSheet][1].length;
      FilesManager.openedFiles[activeFile][activeSheet].splice(
        index,
        0,
        Utils.arrayOf(rowLength, "")
      );
    } else if (dataIs === "column") {
      FilesManager.openedFiles[activeFile][activeSheet].forEach((row) => {
        row.splice(index, 0, "");
      });
    } else throw Error("Please provide an orientation");

    Utils.createTable({
      fileName: activeFile,
      sheetName: activeSheet,
      data: openedFiles[activeFile][activeSheet],
    });
  }

  static addAfter({ index, dataIs }) {
    const { openedFiles, activeFile, activeSheet } = FilesManager;

    if (dataIs === "row") {
      const rowLength = openedFiles[activeFile][activeSheet][1].length;
      FilesManager.openedFiles[activeFile][activeSheet].splice(
        index + 1,
        0,
        Utils.arrayOf(rowLength, "")
      );
    } else if (dataIs === "column") {
      FilesManager.openedFiles[activeFile][activeSheet].forEach((row) => {
        row.splice(index + 1, 0, "");
      });
    } else throw Error("Please provide an orientation");

    Utils.createTable({
      fileName: activeFile,
      sheetName: activeSheet,
      data: openedFiles[activeFile][activeSheet],
    });
  }
}
