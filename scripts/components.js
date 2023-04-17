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

  static input(props) {
    const { type, ...otherProps } = props || {};

    const input = document.createElement("input");

    input.type = type ? type : "text";
    if (type === "text" || !type) input.dir = "auto";

    const propsToAdd = Object.keys(otherProps);

    // if (id) input.id = id;
    // if (value) input.value = value;
    // input.className = className;

    propsToAdd.forEach((prop) => (input[prop] = otherProps[prop]));

    return input;
  }

  static checkbox(label, callback) {
    const checkbox = document.createElement("section");
    const labelEL = document.createElement("label");
    const checkboxInput = Components.input({
      type: "checkbox",
      id: label,
      value: label,
      className: "checkbox__input",
    });

    checkbox.addEventListener("change", callback);

    labelEL.textContent = label;
    labelEL.setAttribute("for", label);

    checkbox.className = "form__checkbox";
    checkbox.append(checkboxInput, labelEL);

    return { checkbox, checkboxInput };
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

      button.parentElement.remove();
      if (openedFilesCount < 1) {
        fileDroppers[1].classList.remove("hidden");
        contentsPreview.classList.add("empty");
        Utils.clearTable();
        return;
      }

      if (prevFile) fileToOpen = prevFile;
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

  static tableCell({ value, className, rowIndex, columnIndex }) {
    const td = document.createElement("td");

    td.className = className ? className : "";
    td.draggable = true;
    td.dataset.rowIndex = rowIndex;
    td.dataset.columnIndex = columnIndex;
    td.textContent = value || "";

    return td;
  }

  static optionsCell({ tr, rowIndex, className }) {
    const td = document.createElement("td");
    td.textContent = rowIndex + 1;
    if (className) td.className = className;
    const inHead = rowIndex === 0;

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
    td.draggable = true;
    td.dataset.rowIndex = rowIndex;

    return td;
  }

  static tableBody(tableElement, data) {
    if (!tableElement)
      throw Error("Cannot append to tableElement = " + tableElement);

    tableElement.textContent = "";

    const tr = Components.tableRow({ className: "table__numbering" });

    [...data[1], ""].forEach((_, i) => {
      const td = Components.tableCell({
        value: i !== 0 ? i : "",
        className: "table__number",
        columnIndex: i,
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

      // ! number cell index exceeds data cells by one (because of ordering cells)
      Utils.addNumberingCellEvents({ td, index: i - 1, orientation: "column" });
    });

    tableElement.appendChild(tr);
    data.forEach((row, i) => {
      const tr = Components.tableRow({ head: i === 0 });

      row.forEach((cell, columnIndex) => {
        const td = Components.tableCell({
          className: "table__cell",
          value: cell,
          rowIndex: i,
          columnIndex,
        });

        Utils.addTableCellEvents({
          td,
          columnIndex,
          rowIndex: i,
        });
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

  static orderingCellContextMenu({ index, dataIs, onRemove }) {
    const menu = document.createElement("ul");
    menu.className = "menu cell__context-menu";

    const options = [
      {
        text: "اضافة اجمالي ملفات",
        icon: "./assets/svg/file-circle-plus.svg",
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
        icon: "./assets/svg/trash-can.svg",
        action: () => FormBuilder.confirmDeleteForm({ index, dataIs }),
      },
      {
        text: dataIs === "row" ? "اضافة صف قبل" : "اضافة عمود قبل",
        icon:
          dataIs === "row"
            ? "./assets/svg/arrow-up.svg"
            : "./assets/svg/arrow-right.svg",
        action: () => Utils.addBefore({ index, dataIs }),
      },
      {
        text: dataIs === "row" ? "اضافة صف بعد" : "اضافة عمود بعد",
        icon:
          dataIs === "row"
            ? "./assets/svg/arrow-down.svg"
            : "./assets/svg/arrow-left.svg",
        action: () => Utils.addAfter({ index, dataIs }),
      },
    ];

    options.forEach((option) => {
      const listItem = document.createElement("li");
      const icon = document.createElement("img");

      icon.className = "context-menu__icon";
      icon.src = option.icon;

      listItem.appendChild(icon);
      listItem.className = "context-menu__option";
      listItem.insertAdjacentText("beforeend", option.text);
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

  static cellContextMenu({ index, onRemove, rowIndex, columnIndex }) {
    const menu = document.createElement("ul");
    menu.className = "menu cell__context-menu";

    const options = [
      {
        text: "ازاحة لليمين",
        action: () => Utils.moveRight({ index, rowIndex, columnIndex }),
      },
      {
        text: "ازاحة لليسار",
        action: () => Utils.moveLeft({ index, rowIndex, columnIndex }),
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
    const formBody = document.createElement("section");
    const formControls = this.formControls(form, overlay);
    const formError = document.createElement("span");
    const values = {};

    form.className = "modal";
    overlay.className = "overlay";
    overlay.addEventListener("click", () => {
      form.remove();
      overlay.remove();
    });
    titleEl.textContent = title;
    formBody.className = "form__body";

    formError.className = "form__error";
    formBody.append(formError);

    form.append(titleEl, formBody, formError, formControls);

    return { form, values, formError, overlay, formBody };
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

  static formGroup() {
    const formGroup = document.createElement("section");
    formGroup.className = "form__group";

    return formGroup;
  }

  static fileDropper() {
    const holder = document.createElement("section");
    const list = Components.list();
    const icon = document.createElement("img");
    const input = Components.input({
      type: "file",
      className: "form__file",
      multiple: true,
    });

    icon.src = "./assets/svg/download_icon.svg";

    icon.className = "drop-here-img";
    holder.className = "file-dropper fs-2";
    holder.append(list, icon, input);

    return holder;
  }

  static list(inputEl, items) {
    const list = document.createElement("ul");
    list.className = "list";

    if (items) {
      items.forEach((item, i) => {
        const listItem = Components.listItem(inputEl, item, i);

        list.appendChild(listItem);
      });
    }

    return list;
  }

  static listItem(inputEl, value) {
    const listItem = document.createElement("li");
    const closeIcon = document.createElement("img");
    const deleteBtn = Components.button({
      className: "flex flex--center list__delete",
    });
    const span = document.createElement("span");

    closeIcon.className = "svg";
    closeIcon.src = "./assets/svg/close_icon.svg";
    deleteBtn.appendChild(closeIcon);

    deleteBtn.addEventListener("click", () => {
      const dt = new DataTransfer();

      for (let file of inputEl.files) {
        if (file.name !== value) dt.items.add(file);
      }

      if (dt.files.length < 1)
        inputEl.parentElement.classList.remove("has-files");

      inputEl.files = dt.files;
      listItem.remove();
    });

    span.textContent = value;

    listItem.className = "list__item";
    listItem.append(deleteBtn, span);
    return listItem;
  }

  static label(value) {
    const labelEl = document.createElement("label");
    labelEl.className = "form__label";
    labelEl.textContent = value;

    return labelEl;
  }

  static select({ label, data }) {
    const holder = document.createElement("section");
    const labelEl = Components.label(label);
    const selectBox = document.createElement("select");

    selectBox.className = "form__select";

    data.forEach((val) => {
      const option = document.createElement("option");

      option.value = val;
      option.textContent = val;

      selectBox.appendChild(option);
    });

    holder.append(labelEl, selectBox);

    return holder;
  }
}
