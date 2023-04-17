// ================================= Events ======================================= //

// Contents preview

const previewTable = document.querySelector(".table");
const fileDroppers = document.querySelectorAll(".form__file");
const tabsNav = document.querySelector(".tabs");
const pagesNav = document.querySelector(".pages");

fileDroppers.forEach((el) =>
  el.addEventListener("input", (evt) =>
    FilesManager.importFiles({ evt, preview: true })
  )
);

const contentsPreview = document.querySelector(".contents-preview");

// contentsPreview.addEventListener("dragover", (e) => {
//   if (e.currentTarget) return;
//   Utils.activateFileDropper();
// });

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
// const getTotalBtn = document.querySelector(".get-total-btn");

// getTotalBtn.addEventListener("click", () => {
//   const { openedFiles } = FilesManager;
//   const noFilesOpened = Object.keys(openedFiles).length < 1;

//   if (noFilesOpened) return;
//   FormBuilder.createFindtotalForm();
// });

// Create new file
const createNewFileBtn = document.querySelector(".tabs__create-new");

createNewFileBtn.addEventListener("click", () => {
  Utils.createNewFile();
  contentsPreview.classList.remove("empty");
});

// Save file
const saveBtn = document.querySelector(".save-btn");

saveBtn.addEventListener("click", () => {
  const { openedFiles, activeFile } = FilesManager;

  FilesManager.saveExcelFile(openedFiles[activeFile]);
});

// =========================================== Window events ============================================= //

window.addEventListener("click", Utils.handleWindowClick);
window.addEventListener("contextmenu", Utils.handleWindowClick);
