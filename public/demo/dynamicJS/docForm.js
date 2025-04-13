async function insertDocForm() {
    document.getElementById("divForm").innerHTML = `
            <div id="overlay"></div>
            <div class="dynamicForm">
                <div><label for="new-doc-name">文档名：</label><input type="text" id="new-doc-name"></div>
                <div class="btnRow">
                    <button class="btnYesNo" onclick="insertDoc();deleteForm('divForm');">确定</button>
                    <button class="btnYesNo" onclick="deleteForm('divForm')">取消</button
                </div>
            </div>`;
}
async function updateDocForm() {
    const docId = document.getElementById("document-select").value;
    if (!docId) {alert("未选择文档0.0"); return;}
    const docName = document.getElementById("document-select").options[document.getElementById("document-select").selectedIndex].text;
    document.getElementById("divForm").innerHTML = `
            <div id="overlay"></div>
            <div class="dynamicForm">
                <div><label for="rename-doc-id">文档ID：</label><input type="text" id="rename-doc-id" value="${docId}" readonly></div>
                <div><label for="rename-doc-name">重命名：</label><input type="text" id="rename-doc-name" value="${docName}"></div>
                <div class="btnRow">
                    <button class="btnYesNo" onclick="updateDoc();deleteForm('divForm')">确定</button>
                    <button class="btnYesNo" onclick="deleteForm('divForm')">取消</button
                </div>
            </div>`;
}
async function deleteDocForm() {
    const docId = document.getElementById("document-select").value;
    if (!docId) {alert("未选择文档0.0"); return;}
    const docName = document.getElementById("document-select").options[document.getElementById("document-select").selectedIndex].text;
    document.getElementById("divForm").innerHTML = `
            <div id="overlay"></div>
            <div class="dynamicForm">
                <div><label for="delete-doc-id">确定删除文档： [${docId}]${docName} ？</label>
                <div class="btnRow">
                    <button class="btnYesNo" onclick="deleteDoc();deleteForm('divForm')">确定</button>
                    <button class="btnYesNo" onclick="deleteForm('divForm')">取消</button
                </div>
            </div>`;
}