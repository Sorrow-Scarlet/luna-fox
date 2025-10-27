// 画布模块 - 处理画布相关功能
document.addEventListener("DOMContentLoaded", function () {
  // 初始化画布大小
  window.initCanvas = function () {
    initCanvasSize();
    // 窗口大小变化时重新调整画布大小
    window.addEventListener("resize", initCanvasSize);
  };

  // 设置画布大小
  function initCanvasSize() {
    const designerSection = window.designerCanvas.parentElement;
    window.designerCanvas.style.width = designerSection.clientWidth + "px";
    window.designerCanvas.style.height = designerSection.clientHeight + "px";
    window.canvasOverlay.style.width = designerSection.clientWidth + "px";
    window.canvasOverlay.style.height = designerSection.clientHeight + "px";
  }

  // 更新鼠标样式
  window.updateCursor = function () {
    window.designerCanvas.classList.remove("move-mode", "drawing-mode");
    if (window.appState.currentTool === "move") {
      window.designerCanvas.classList.add("move-mode");
    } else {
      window.designerCanvas.classList.add("drawing-mode");
    }
  };

  // 初始化由base.js统一控制，不再需要通知主模块
});
