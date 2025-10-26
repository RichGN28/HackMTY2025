// Cambia aquí las URLs según tu estructura
const routes = {
    homepage: "homepage.html",
    chatpage: "chatpage.html"
};
// Detecta en qué página estás (ajusta si la ruta difiere)
const currentPage = window.location.pathname.includes("chatpage") ? "chatpage" : "homepage";
const nextPage = currentPage === "homepage" ? routes.chatpage : routes.homepage;
const previousPage = currentPage === "chatpage" ? routes.homepage : routes.chatpage;

let startX = 0, startY = 0, endX = 0, endY = 0;
let isTouch = false, isMouseDown = false;
const swipeOverlay = document.getElementById("swipeOverlay");

// Animación de desvanecimiento o slide
function animateAndNavigate(direction) {
    if (!swipeOverlay) return;
    swipeOverlay.style.background = (currentPage === "homepage") ? "#3b959e" : "#000"; // Ajusta color de fondo según tu pagina
    swipeOverlay.style.opacity = "0";
    swipeOverlay.style.display = "block";
    swipeOverlay.style.transition = "none";
    swipeOverlay.style.transform = `translateX(${direction === "left" ? "100vw" : "-100vw"})`;
    // Forzar reflow
    void swipeOverlay.offsetWidth;
    swipeOverlay.style.transition = "opacity 0.32s cubic-bezier(.68,0,.38,1), transform 0.32s cubic-bezier(.68,0,.38,1)";
    swipeOverlay.style.opacity = "1";
    swipeOverlay.style.transform = "translateX(0)";
    setTimeout(() => {
        window.location.href = (direction === "left") ? nextPage : previousPage;
    }, 320);
}

// SWIPE para finger y mouse
document.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
        isTouch = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }
});
document.addEventListener('touchend', e => {
    if (isTouch && e.changedTouches.length === 1) {
        endX = e.changedTouches[0].clientX;
        endY = e.changedTouches[0].clientY;
        handleSwipe();
        isTouch = false;
    }
});
document.addEventListener('mousedown', e => {
    isMouseDown = true;
    startX = e.clientX;
    startY = e.clientY;
});
document.addEventListener('mouseup', e => {
    if (!isMouseDown) return;
    endX = e.clientX;
    endY = e.clientY;
    handleSwipe();
    isMouseDown = false;
});

function handleSwipe() {
    const dx = endX - startX;
    const dy = Math.abs(endY - startY);
    if (Math.abs(dx) > dy && Math.abs(dx) > 60) {
        if (dx < 0 && currentPage === "homepage") animateAndNavigate("left");
        if (dx > 0 && currentPage === "chatpage") animateAndNavigate("right");
    }
}
