// ========================================== FormBuilder ============================================== //

class FormBuilder {
  static wrapper = document.querySelector(".wrapper");

  static createFindtotalForm({ insert, insertInto, index }) {
    const { form, formBody, overlay, values } = Components.form("حدد الملفات");
    const { openedFiles } = FilesManager;
    const fileNames = Object.keys(openedFiles);

    const checkboxesLabel = Components.label("اختر من الملفات المفتوحة");

    // Was added to prevent blurry text on overflow scroll
    const formGroup = document.createElement("section");
    formGroup.className = "form__group";
    formGroup.appendChild(checkboxesLabel);

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

      formGroup.appendChild(checkbox);
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

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await FilesManager.importFiles({ filesToImport: values.filesToMerge });

      const fileNames = Array.from(values.filesToMerge).map(
        (file) => file.name
      );

      const columns = Utils.checkAvailableColumns(fileNames, [0]);
      FormBuilder.chooseColumnsToMergeForm({ data: columns });
    });

    formBody.append(formGroup, fileDropper);
    FormBuilder.wrapper.append(overlay, form);
  }

  static chooseColumnsToMergeForm({ data }) {
    const { form, formBody, overlay, values } =
      Components.form("ادراج اجمالي ملفات");

    const SelectBoxData = ["العناوين", "حساب اجمالي الخلايا"];
    const select = Components.select({
      label: "نوع البيانات المدرجة",
      data: SelectBoxData,
    });

    values.columnsSelected = [];

    const formGroup = Components.formGroup();
    const checkboxesHolder = document.createElement("section");
    checkboxesHolder.className = "form__group--wrap";

    const checkboxesLabel = Components.label(
      "حدد الاعمدة المراد حساب الاجمالي لها"
    );

    // Was added to prevent blurry text on overflow scroll
    const formGroupWrapper = document.createElement("section");
    formGroupWrapper.className = "form__group--wrapper";

    data.forEach((column) => {
      const checkbox = Components.checkbox(column, (e) => {
        const { checked, value } = e.target;
        const { columnsSelected } = values;

        if (checked) {
          if (columnsSelected.includes(value)) return;
          let adjuestedIndex = columnsSelected.length;
          const index = data.indexOf(value);

          for (let i = 0; i < columnsSelected.length; i++) {
            const column = columnsSelected[i];
            const columnIndex = data.indexOf(column);

            if (index < columnIndex) {
              adjuestedIndex = i;
              break;
            }
          }

          columnsSelected.splice(adjuestedIndex, 0, value);
          // checkbox.remove();
        } else if (!checked) {
          if (!columnsSelected.includes(value)) return;
          const index = columnsSelected.indexOf(value);

          columnsSelected.splice(index, 1);
        }

        console.log(values);
      });

      checkbox.classList.add("form__checkbox--inline");
      checkboxesHolder.appendChild(checkbox);
    });

    formGroupWrapper.appendChild(checkboxesHolder);
    formGroup.append(checkboxesLabel, formGroupWrapper);
    formBody.append(formGroup, select);

    FormBuilder.wrapper.append(overlay, form);
  }

  /*const newData = Utils.mergeSimilarColumns(fileNames, columns);

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
      } */

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

    FormBuilder.wrapper.append(overlay, form);
  }
}
