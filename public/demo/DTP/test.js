function getTextCutIndex(text, maxLength, cutList) {
    for (let cutString of cutList) {
        let index = text.lastIndexOf(cutString, maxLength);
        if (index !== -1) return index + cutString.length;
    }
    return maxLength;
}
// 获取剩余的Delta内容
function getRemainingDelta(delta, textIndex) {
    let resultDelta = [];
    let currentLength = 0;
    for (let op of delta.ops) {
        if (currentLength >= textIndex) {
            resultDelta.push(op);
            continue;
        }
        if (typeof op.insert === 'string') {
            let remainingLength = textIndex - currentLength;
            if (remainingLength < op.insert.length) {
                resultDelta.push({ insert: op.insert.slice(remainingLength), attributes: op.attributes });
            }
            currentLength += op.insert.length;
        }
    }
    return { ops: resultDelta };
}
// 根据纯文本的截断位置，分割Delta内容
function getDeltaContentUpToIndex(delta, textIndex) {
    let resultDelta = [];
    let currentLength = 0;
    for (let op of delta.ops) {
        if (currentLength >= textIndex) break;
        if (typeof op.insert === 'string') {
            let remainingLength = textIndex - currentLength;
            let insertText = op.insert.slice(0, remainingLength);
            resultDelta.push({ insert: insertText, attributes: op.attributes });
            currentLength += insertText.length;
            continue;
        }
        resultDelta.push(op);
    }
    return {ops: resultDelta};
}

async function autoCutPage() {
    const ACIElement = document.getElementById("auto-cut-input");
    if(!(ACIElement instanceof HTMLInputElement))return;
    const maxPageNumber = ACIElement.value; // 每页最大字符数
    const cutStringList = ["\n","。"]; // 分割字符串列表
    // 获取Quill编辑器的纯文本内容和Delta内容
    let totalDelta = quill.getContents();
    let totalText = quill.getText();
    // 分页逻辑
    while (totalText.length > maxPageNumber) {
        let cutIndex = getTextCutIndex(totalText, maxPageNumber, cutStringList);
        // 根据纯文本的截断位置，分割Delta内容
        let leftDelta = getDeltaContentUpToIndex(totalDelta, cutIndex);
        let rightDelta = getRemainingDelta(totalDelta, cutIndex);
        // 保存当前页面内容
        quill.setContents(leftDelta);
        // 在当前页面后插入新的页面
        await insertPageAtEndOf(); // 确保异步操作完成
        // 打开新的页面，此时Quill的内容就是新页面的空编辑框
        quill.setContents(rightDelta);
        totalText = quill.getText();
        totalDelta = quill.getContents();
    }
    // 更新页面
    await updatePage();
}