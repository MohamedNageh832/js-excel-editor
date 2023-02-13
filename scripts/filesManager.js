// ====================================== FilesManager =========================================== //

class FilesManager {
  static activeFile = null;
  static activeSheet = null;
  static openedFiles = {};

  static async importFiles({ evt, filesToImport, preview }) {
    const files = evt ? evt.target.files : filesToImport;

    if (files.length < 1) throw Error("Failed to load files");

    await FilesManager.readMultipleFiles(files);

    if (!preview) return;
    const lastFileImported = Array.from(files).at(-1);
    if (FilesManager.activeFile === lastFileImported.name)
      lastFileImported.name = generateUniqueName(lastFileImported.name);

    FilesManager.activeFile = lastFileImported.name;

    FilesManager.previewFile(FilesManager.openedFiles[lastFileImported.name]);
  }

  static readMultipleFiles(files) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      function readFile(index) {
        if (index >= files.length) resolve();

        let file = files[index];
        reader.onload = (e) => {
          try {
            const contents = FilesManager.processExcel(e.target.result);
            FilesManager.openedFiles[file.name] = {};

            Object.assign(FilesManager.openedFiles[file.name], contents);

            readFile(index + 1);
          } catch (err) {
            reject(err);
          }
        };

        reader.readAsBinaryString(file);
      }

      readFile(0);
    });
  }

  static processExcel(data) {
    let workbook = XLSX.read(data, {
      type: "binary",
    });

    let firstSheet = workbook.SheetNames[0];
    let contents = FilesManager.to_json(workbook);

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
