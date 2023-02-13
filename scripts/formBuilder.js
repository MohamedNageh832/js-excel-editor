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

    const fileDropper = Components.fileDropper();

    fileDropper.addEventListener("change", (e) => {
      const { files } = e.target;

      const fileNames = Array.from(files).map((file) => file.name);

      if (fileNames.length > 0) fileDropper.classList.add("has-files");
      else fileDropper.classList.remove("has-files");

      const list = fileDropper.querySelector(".list");

      fileNames.forEach((file) => {
        const listItem = Components.listItem(e.target, file);
        list.appendChild(listItem);
      });

      fileDropper.prepend(list);

      values.filesToMerge = files;
    });

    form.insertBefore(fileDropper, formControls);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await FilesManager.importFiles({ filesToImport: values.filesToMerge });

      const fileNames = Array.from(values.filesToMerge).map(
        (file) => file.name
      );

      const columns = Utils.checkAvailableColumns(fileNames, [0]);
      const newData = Utils.mergeSimilarColumns(fileNames, columns);

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
      } else if (insertInto === "column") {
        console.log("this feature isn't implemented yet!");
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
