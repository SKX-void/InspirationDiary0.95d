async function insertChapterForm() {
    const docElement = document.getElementById("document-select");
    if(!(docElement instanceof HTMLSelectElement)) return;
    const docName = docElement.value;
    if (!docName) {alert("未选择文档0.0"); return;}
    document.getElementById("divForm").innerHTML = `
            <div id="overlay"></div>
            <div class="dynamicForm">
                <div><label for="new-title-name">标题名：</label><input type="text" id="new-title-name"></div>
                <div class="btnRow">
                    <button class="btnYesNo" onclick="insChapter();deleteForm('divForm');">确定</button>
                    <button class="btnYesNo" onclick="deleteForm('divForm')">取消</button
                </div>
            </div>`;
}
async function updateChapterForm() {
    const docElement = document.getElementById("document-select");
    if(!(docElement instanceof HTMLSelectElement)) return;
    const docName = docElement.value;
    if (!docName) {alert("未选择文档0.0"); return;}
    const chapterElement = document.getElementById("chapter-select");
    if(!(chapterElement instanceof HTMLSelectElement)) return;
    const chapterId = chapterElement.value;
    const title = chapterElement.options[chapterElement.selectedIndex].text;
    const sortKey = chapterElement.options[chapterElement.selectedIndex].getAttribute('data-sort-key');
    document.getElementById("divForm").innerHTML = `
            <div id="overlay"></div>
            <div class="dynamicForm">
                <div><label for="belong-doc-id">所属文档：</label><input type="text" id="belong-doc-id" value="${docName}" readonly></div>
                <div><label for="rename-title-id">标题ID：</label><input type="text" id="rename-title-id" value="${chapterId}" readonly></div>
                <div><label for="rename-title-name">重命名：</label><input type="text" id="rename-title-name" value="${title}"></div>
                <div><label for="sort-key">排序(未实现)：</label><input type="number" id="sort-key" value="${sortKey}" readonly></div>
                <div class="btnRow">
                    <button class="btnYesNo" onclick="upChapter();deleteForm('divForm')">确定</button>
                    <button class="btnYesNo" onclick="deleteForm('divForm')">取消</button
                </div>
            </div>`;
}
async function deleteChapterForm() {
    const docElement = document.getElementById("document-select");
    const chapterElement = document.getElementById("chapter-select");
    if(!(docElement instanceof HTMLSelectElement) ||!(chapterElement instanceof HTMLSelectElement)) return;
    const docName = docElement.value;
    if (!docName) {alert("未选择文档0.0"); return;}
    const chapterId = chapterElement.value;
    if (!chapterId) {alert("未选择标题0.0"); return;}
    const title = chapterElement.options[chapterElement.selectedIndex].text;
    document.getElementById("divForm").innerHTML = `
            <div id="overlay"></div>
            <div class="dynamicForm">
                <div><label for="delete-doc-id">确定删除标题： [${chapterId}]${title} ？</label>
                <div class="btnRow">
                    <button class="btnYesNo" onclick="delChapter();deleteForm('divForm')">确定</button>
                    <button class="btnYesNo" onclick="deleteForm('divForm')">取消</button
                </div>
            </div>`;
}