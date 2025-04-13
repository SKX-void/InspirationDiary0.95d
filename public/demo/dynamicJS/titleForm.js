async function insertTitleForm() {
    const docId = document.getElementById("document-select").value;
    if (!docId) {alert("未选择文档0.0"); return;}
    document.getElementById("divForm").innerHTML = `
            <div id="overlay"></div>
            <div class="dynamicForm">
                <div><label for="new-title-name">标题名：</label><input type="text" id="new-title-name"></div>
                <div class="btnRow">
                    <button class="btnYesNo" onclick="insertTitle();deleteForm('divForm');">确定</button>
                    <button class="btnYesNo" onclick="deleteForm('divForm')">取消</button
                </div>
            </div>`;
}
async function updateTitleForm() {
    const docId = document.getElementById("document-select").value;
    if (!docId) {alert("未选择文档0.0"); return;}
    const docName = document.getElementById("document-select").options[document.getElementById("document-select").selectedIndex].text;
    const titleId = document.getElementById("title-select").value;
    const titleName = document.getElementById("title-select").options[document.getElementById("title-select").selectedIndex].text;
    const sortKey = document.getElementById("title-select").options[document.getElementById("title-select").selectedIndex].getAttribute('data-sort-key');
    document.getElementById("divForm").innerHTML = `
            <div id="overlay"></div>
            <div class="dynamicForm">
                <div><label for="belong-doc-id">所属文档：</label><input type="text" id="belong-doc-id" value="[${docId}]${docName}" readonly></div>
                <div><label for="rename-title-id">标题ID：</label><input type="text" id="rename-title-id" value="${titleId}" readonly></div>
                <div><label for="rename-title-name">重命名：</label><input type="text" id="rename-title-name" value="${titleName}"></div>
                <div><label for="sort-key">排序(未实现)：</label><input type="number" id="sort-key" value="${sortKey}" readonly></div>
                <div class="btnRow">
                    <button class="btnYesNo" onclick="updateTitle();deleteForm('divForm')">确定</button>
                    <button class="btnYesNo" onclick="deleteForm('divForm')">取消</button
                </div>
            </div>`;
}
async function deleteTitleForm() {
    const docId = document.getElementById("document-select").value;
    if (!docId) {alert("未选择文档0.0"); return;}
    const titleId = document.getElementById("title-select").value;
    if (!titleId) {alert("未选择标题0.0"); return;}
    const titleName = document.getElementById("title-select").options[document.getElementById("title-select").selectedIndex].text;
    document.getElementById("divForm").innerHTML = `
            <div id="overlay"></div>
            <div class="dynamicForm">
                <div><label for="delete-doc-id">确定删除标题： [${titleId}]${titleName} ？</label>
                <div class="btnRow">
                    <button class="btnYesNo" onclick="deleteTitle();deleteForm('divForm')">确定</button>
                    <button class="btnYesNo" onclick="deleteForm('divForm')">取消</button
                </div>
            </div>`;
}