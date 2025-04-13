async function insertDoc() {
    const docNameInput = document.getElementById('new-doc-name');
    const docName = docNameInput.value.trim();
    if (!docName) return;
    try {
        const response = await fetch('/doc', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ doc_name: docName })
        });
        const res = await response;
        if(!res.ok)alert("发生错误："+res.message);
        docNameInput.value = '';
        await selectDocList();
    } catch (error) {
        console.error('Error adding document:', error);
    }
}

async function deleteDoc() {
    const selectedDoc = document.getElementById('document-select');
    const selectedDocId = selectedDoc.value;
    if (!selectedDocId) return;
    try {
        const response = await fetch(`/doc`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ doc_id: selectedDocId })
        });
        const result = await response;
        if(!result.ok)alert("发生错误："+result.message);
        selectedDoc.value = '';
        quill.root.innerHTML = '';
        await selectDocList();
    } catch (error) {
        console.error('Error deleting document:', error);
    }
}
async function updateDoc() {
    const selectedDoc = document.getElementById('document-select');
    const selectedDocId = selectedDoc.value;
    if (!selectedDocId) return;
    const newNameInput =document.getElementById('rename-doc-name').value;
    const newDocId = document.getElementById('rename-doc-id').value;
    try {
        const response = await fetch(`/doc`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ old_doc_id: selectedDocId,new_doc_id: newDocId,doc_name: newNameInput })
        });
        const updatedDoc = await response;
        if(!updatedDoc.ok)alert("发生错误："+updatedDoc.message);
    } catch (error) {
        console.error('Error updating document:', error);
    }
}

async function selectDocList() {
    try {
        const response = await fetch('/doc');
        if (!response.ok) alert('发生错误：' + response.message);
        const documents = await response.json();
        const selectElement = document.getElementById('document-select');
        selectElement.innerHTML = '<option value="">-- 未选择 --</option>';
        documents.forEach(doc => {
            const option = document.createElement('option');
            option.value = doc.doc_id;
            option.textContent = doc.doc_name;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching documents:', error);
    }
}
window.onload = selectDocList;