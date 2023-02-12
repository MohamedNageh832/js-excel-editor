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
      {
        text: dataIs === "row" ? "اضافة صف قبل" : "اضافة عمود قبل",
        action: () => Utils.addBefore({ index, dataIs }),
      },
      {
        text: dataIs === "row" ? "اضافة صف بعد" : "اضافة عمود بعد",
        action: () => Utils.addAfter({ index, dataIs }),
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

    form.className = "modal";
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
