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
