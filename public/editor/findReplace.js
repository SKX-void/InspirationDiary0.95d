window.addEventListener('DOMContentLoaded', () => {
    let currentMatchIndex = -1;
            document.getElementById('openFindBtn').addEventListener('click', function () {
                 document.getElementById("findModal").style.display = "block";
    document.getElementById('findText').focus();
    performFindNext();
    makeDraggable(document.getElementById("findModal"), document.querySelector("#findModal .modal-header"));
  });

  document.getElementById('openFindReplaceBtn').addEventListener('click', function () {
    document.getElementById("findReplaceModal").style.display = "block";
    document.getElementById('findText').focus();
    performFindNext();
    makeDraggable(document.getElementById("findReplaceModal"), document.querySelector("#findReplaceModal .modal-header"));
  });
  

document.getElementById('closeFindBtn').addEventListener('click', closeFind);
document.getElementById('findNextBtn').addEventListener('click', performFindNext);
document.getElementById('findPreviousBtn').addEventListener('click', performFindPrevious);

document.getElementById('closeFindReplaceBtn').addEventListener('click', closeFindReplace);
document.getElementById('findNext_ReplaceBtn').addEventListener('click', performFindNext);
document.getElementById('findPrevious_ReplaceBtn').addEventListener('click', performFindPrevious);
document.getElementById('replaceBtn').addEventListener('click', performReplace);
document.getElementById('replaceAllBtn').addEventListener('click', performReplaceAll);

  function closeFindReplace() {
    document.getElementById("findReplaceModal").style.display = "none";
    removeHighlights();
  }
  function closeFind() {
    document.getElementById("findModal").style.display = "none";
    removeHighlights();
  }

  function performFindNext() {
    const findText = document.getElementById('findText').value;
    if (!findText) return;

    removeHighlights();

    const text = quill.getText();
    const selection = quill.getSelection();
    let start = selection ? selection.index + selection.length : 0;

    const index = text.indexOf(findText, start);
    if (index !== -1) {
      currentMatchIndex = index;
      highlightAndSelect(index, findText.length);
    } else {
      alert('未找到匹配项。');
    }
  }

  function performFindPrevious() {
    const findText = document.getElementById('findText').value;
    if (!findText) return;

    removeHighlights();

    const text = quill.getText();
    const selection = quill.getSelection();
    let end = selection ? selection.index : text.length;

    const index = text.lastIndexOf(findText, end - 1);
    if (index !== -1) {
      currentMatchIndex = index;
      highlightAndSelect(index, findText.length);
    } else {
      alert('未找到匹配项。');
    }
  }

  function performReplace() {
    const findText = document.getElementById('findText').value;
    const replaceText = document.getElementById('replaceText').value;
    if (!findText || !replaceText) return;

    const selection = quill.getSelection();
    if (!selection || selection.length === 0) return;

    quill.deleteText(selection.index, selection.length, 'user');
    quill.insertText(selection.index, replaceText, 'user');

    // Move the current match index forward by the difference in length
    const lengthDifference = replaceText.length - findText.length;
    currentMatchIndex += lengthDifference;

    // Perform find next after replacement
    performFindNext();
  }

  function performReplaceAll() {
    const findText = document.getElementById('findText').value;
    const replaceText = document.getElementById('replaceText').value;

    if (!findText) return;

    const delta = quill.getContents();
    const ops = delta.ops;

    let offset = 0;
    for (const element of ops) {
      if (element.insert && typeof element.insert === 'string') {
        const originalLength = element.insert.length;
        element.insert = element.insert.split(findText).join(replaceText);
        const diff = element.insert.length - originalLength;
        offset += diff;
      }
    }

    quill.setContents(delta);

    closeFindReplace();
  }

  function highlightAndSelect(start, length) {
    quill.formatText(start, length, 'background', 'yellow');
    quill.setSelection(start, length);
  }

  function removeHighlights() {
    const delta = quill.getContents();
    const ops = delta.ops;

    for (let i = 0; i < ops.length; i++) {
      if (ops[i].insert && typeof ops[i].insert === 'string') {
        quill.removeFormat(i, ops[i].insert.length, 'background');
      }
    }
  }

  function makeDraggable(element, header) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    header.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      element.style.top = (element.offsetTop - pos2) + "px";
      element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }
});