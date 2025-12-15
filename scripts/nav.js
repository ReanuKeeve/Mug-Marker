document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("header");
  const btn = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");

  if (!header || !btn || !nav) return;

  function setOpen(open) {
    header.classList.toggle("nav-open", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  btn.addEventListener("click", () => {
    const open = !header.classList.contains("nav-open");
    setOpen(open);
  });

  // Close on ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });

  // Close after clicking a link
  nav.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a) setOpen(false);
  });

  // Close if clicking outside header/nav
  document.addEventListener("click", (e) => {
    if (!header.contains(e.target)) setOpen(false);
  });

  // Start closed
  setOpen(false);
});