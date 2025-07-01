window.addEventListener('DOMContentLoaded', () => {
  let currentMatchIndex = -1;
  const openFindBtn = document.getElementById('openFindBtn');
  const findModal = document.getElementById('findModal');
  const findText = document.getElementById('findText');
  if (!(openFindBtn instanceof HTMLElement
    && findModal instanceof HTMLElement
    && findText instanceof HTMLElement)) {
    console.error('缺少元素 openFindBtn、findModal、findText');
    return
  };

  const modalHeader = document.querySelector("#findModal .modal-header");
  if (!(modalHeader instanceof HTMLElement)) {
    console.error('缺少元素 modalHeader');
    return
  };
  openFindBtn.addEventListener('click', function () {
    findModal.style.display = "block";
    findText.focus();
    performFindNext();
    makeDraggable(findModal, modalHeader);
  });

  const openFindReplaceBtn = document.getElementById('openFindReplaceBtn');
  const findReplaceModal = document.getElementById('findReplaceModal');
  const findReplaceText = document.getElementById('findReplaceText');
  if (!(openFindReplaceBtn instanceof HTMLElement
    && findReplaceModal instanceof HTMLElement
    && findReplaceText instanceof HTMLElement)) {
    console.error('缺少元素 openFindReplaceBtn、findReplaceModal、findReplaceText');
    return
  };
  openFindReplaceBtn.addEventListener('click', function () {
    findReplaceModal.style.display = "block";
    findReplaceText.focus();
    performFindNext();
    makeDraggable(findModal, modalHeader);
  });

  const closeFindBtn = document.getElementById('closeFindBtn');
  if (!(closeFindBtn instanceof HTMLElement)) {
    console.error('缺少元素 closeFindBtn');
    return
  };
  closeFindBtn.addEventListener('click', closeFind);

  const findNextBtn = document.getElementById('findNextBtn');
  if (!(findNextBtn instanceof HTMLElement)) {
    console.error('缺少元素 findNextBtn');
    return
  };
  findNextBtn.addEventListener('click', performFindNext);

  const findPreviousBtn = document.getElementById('findPreviousBtn');
  if (!(findPreviousBtn instanceof HTMLElement)) {
    console.error('缺少元素 findPreviousBtn');
    return
  };
  findPreviousBtn.addEventListener('click', performFindPrevious);

  const closeFindReplaceBtn = document.getElementById('closeFindReplaceBtn');
  if (!(closeFindReplaceBtn instanceof HTMLElement)) {
    console.error('缺少元素 closeFindReplaceBtn');
    return
  };
  closeFindReplaceBtn.addEventListener('click', closeFindReplace);

  const findNext_ReplaceBtn = document.getElementById('findNext_ReplaceBtn');
  const findPrevious_ReplaceBtn = document.getElementById('findPrevious_ReplaceBtn');
  const replaceBtn = document.getElementById('replaceBtn');
  const replaceAllBtn = document.getElementById('replaceAllBtn');
  if (!(findNext_ReplaceBtn instanceof HTMLElement
    && findPrevious_ReplaceBtn instanceof HTMLElement
    && replaceBtn instanceof HTMLElement
    && replaceAllBtn instanceof HTMLElement)) {
    console.error('缺少元素 findNext_ReplaceBtn、findPrevious_ReplaceBtn、replaceBtn、replaceAllBtn');
    return
  };
  findNext_ReplaceBtn.addEventListener('click', performFindNext);
  findPrevious_ReplaceBtn.addEventListener('click', performFindPrevious);
  replaceBtn.addEventListener('click', performReplace);
  replaceAllBtn.addEventListener('click', performReplaceAll);

  function closeFindReplace() {
    if (!(findReplaceModal instanceof HTMLElement)) {
      console.error('缺少元素 findReplaceModal');
      return
    };
    findReplaceModal.style.display = "none";
    removeHighlights();
  }
  function closeFind() {
    if (!(findModal instanceof HTMLElement)) {
      console.error('缺少元素 findModal');
      return
    };
    findModal.style.display = "none";
    removeHighlights();
  }

  function performFindNext() {
    if (!(findText instanceof HTMLInputElement)) {
      console.error('缺少元素 findText');
      return
    };
    const findTextValue = findText.value;
    if (!findTextValue) return;

    removeHighlights();

    const text = quill.getText();
    const selection = quill.getSelection();
    let start = selection ? selection.index + selection.length : 0;

    const index = text.indexOf(findTextValue, start);
    if (index !== -1) {
      currentMatchIndex = index;
      highlightAndSelect(index, findTextValue.length);
    } else {
      alert('未找到匹配项。');
    }
  }

  function performFindPrevious() {
    if (!(findText instanceof HTMLInputElement)) {
      console.error('缺少元素 findText');
      return
    };
    const findTextValue = findText.value;
    if (!findTextValue) return;

    removeHighlights();

    const text = quill.getText();
    const selection = quill.getSelection();
    let end = selection ? selection.index : text.length;

    const index = text.lastIndexOf(findTextValue, end - 1);
    if (index !== -1) {
      currentMatchIndex = index;
      highlightAndSelect(index, findTextValue.length);
    } else {
      alert('未找到匹配项。');
    }
  }

  const replaceText = document.getElementById('replaceText');
  function performReplace() {
    if (!(findText instanceof HTMLInputElement
      && replaceText instanceof HTMLInputElement)) {
      console.error('缺少元素 findText、replaceText');
      return
    };
    const findTextValue = findText.value;
    const replaceTextValue = replaceText.value;
    if (!findTextValue || !replaceTextValue) return;

    const selection = quill.getSelection();
    if (!selection || selection.length === 0) return;

    quill.deleteText(selection.index, selection.length);
    quill.insertText(selection.index, replaceTextValue, 'user');

    // Move the current match index forward by the difference in length
    const lengthDifference = replaceTextValue.length - findTextValue.length;
    currentMatchIndex += lengthDifference;

    // Perform find next after replacement
    performFindNext();
  }

  function performReplaceAll() {
    if (!(findText instanceof HTMLInputElement
      && replaceText instanceof HTMLInputElement)) {
      console.error('缺少元素 findText、replaceText');
      return
    };
    const findTextValue = findText.value;
    const replaceTextValue = replaceText.value;

    if (!findTextValue) return;

    const delta = quill.getContents();
    const ops = delta.ops;

    let offset = 0;
    for (const element of ops) {
      if (element.insert && typeof element.insert === 'string') {
        const originalLength = element.insert.length;
        element.insert = element.insert.split(findTextValue).join(replaceTextValue);
        const diff = element.insert.length - originalLength;
        offset += diff;
      }
    }

    quill.setContents(delta);

    closeFindReplace();
  }

  function highlightAndSelect(start: number, length: number) {
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

  function makeDraggable(element: HTMLElement, header: HTMLElement) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    header.onmousedown = dragMouseDown;

    function dragMouseDown(e: MouseEvent) {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e: MouseEvent) {
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