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
