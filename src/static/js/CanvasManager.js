// 画布管理器类 - 处理画布相关功能
class CanvasManager {
  constructor(canvas, canvasOverlay, state) {
    this.canvas = canvas;
    this.canvasOverlay = canvasOverlay;
    this.state = state;
  }

  // 初始化画布
  initialize() {
    this.initCanvasSize();
    // 窗口大小变化时重新调整画布大小
    window.addEventListener("resize", () => this.initCanvasSize());
  }

  // 设置画布大小
  initCanvasSize() {
    const designerSection = this.canvas.parentElement;
    this.canvas.style.width = designerSection.clientWidth + "px";
    this.canvas.style.height = designerSection.clientHeight + "px";
    this.canvasOverlay.style.width = designerSection.clientWidth + "px";
    this.canvasOverlay.style.height = designerSection.clientHeight + "px";
  }

  // 更新鼠标样式
  updateCursor() {
    this.canvas.classList.remove("move-mode", "drawing-mode");
    if (this.state.currentTool === "move") {
      this.canvas.classList.add("move-mode");
    } else {
      this.canvas.classList.add("drawing-mode");
    }
  }

  // 获取相对于画布的坐标
  getCanvasCoordinates(event) {
    const canvasRect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - canvasRect.left,
      y: event.clientY - canvasRect.top,
    };
  }
}
