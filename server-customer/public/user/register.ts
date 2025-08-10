import { serverPrefix } from "../../config";

window.addEventListener("DOMContentLoaded",()=>{
    const registerBtn = document.getElementById('registerBtn') as HTMLButtonElement;
    registerBtn.addEventListener('click', async function(event) {
        try {
            const unIn = document.getElementById('username') as HTMLInputElement;
            const pwIn = document.getElementById('password') as HTMLInputElement;
            const regIn = document.getElementById('registrationCode') as HTMLInputElement;
            const username = unIn.value;
            const password = await hashPassword(pwIn.value);
            const registrationCode = regIn.value;

            if (!username || !password || !registrationCode) {
                event.preventDefault();
                alert('所有字段都必须填写！');
                return;
            }

            const response = await fetch(`${serverPrefix.value}/user/register`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    username,
                    password,
                    registrationCode
                })
            });

            const data = await response.json();
            if (data.success) {
                alert('注册成功！');
                window.location.href = `${serverPrefix.value}/login`;
            } else {
                alert('注册失败！' + data.msg);
            }
        } catch (error) {
            if (error instanceof Error) {
                alert('发生错误：' + error.message);
            } else {
                alert('发生错误：' + error);
            }
        }
    });

    // 使用 crypto.subtle 对密码进行 SHA-256 哈希处理
    async function hashPassword(password:string) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(byte => {
            const hex = byte.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }
})