(()=>{const r=document.documentElement,b=document.querySelector("#themeToggle");r.dataset.theme=localStorage.getItem("lawe-theme")||"light";const p=()=>{const d=r.dataset.theme==="dark";b.textContent=d?"☀":"☾"};b.addEventListener("click",()=>{r.dataset.theme=r.dataset.theme==="dark"?"light":"dark";localStorage.setItem("lawe-theme",r.dataset.theme);p()});p()})();

