import { serverPrefix } from "../../config";

window.addEventListener('DOMContentLoaded', function () {
  const loginBtn = document.getElementById('loginBtn');
  if (!(loginBtn instanceof HTMLButtonElement)) {
    console.warn('登录按钮不存在');
    return};
  loginBtn.addEventListener('click', login);
  async function login() {
    const unIn = document.getElementById('username') as HTMLInputElement;
    const pwIn = document.getElementById('password') as HTMLInputElement;
    const username = unIn.value;
    try {
      const password = await hashPassword(pwIn.value);
      const response = await fetch(`${serverPrefix.value}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password
        })
      });
      if (response.redirected) {
        // 如果服务器返回了重定向响应
        window.location.href = response.url; // 跳转到新的 URL
        return;
      }
      const data = await response.json();
      if (data.success) {
        window.location.href = `${serverPrefix.value}/docIndex`;
      } else {
        alert('登录失败！' + data.msg);
      }
    } catch (error) {
      if (error instanceof Error) {
        alert('发生错误' + error.message);
      } else {
        alert('发生错误' + error);
      }
    }
  }
  // 使用 crypto.subtle 对密码进行 SHA-256 哈希处理
  async function hashPassword(password: string) {
    // 将字符串转换为 Uint8Array（字节数组）
    const encoder = new TextEncoder();
    const data = encoder.encode(password);

    // 使用 crypto.subtle.digest 生成 SHA-256 哈希
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    // 将哈希值转换为十六进制字符串
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => {
      const hex = byte.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }
});