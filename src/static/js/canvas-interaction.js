// 画布交互逻辑
class CanvasInteraction {
  constructor() {
    this.canvas = document.getElementById("designerCanvas");
    this.overlay = document.getElementById("canvasOverlay");
    this.selectionBox = document.getElementById("selectionBox");

    this.isDrawing = false;
    this.startX = 0;
    this.startY = 0;
    this.currentTool = "move";

    this.elements = [];
    this.selectedElement = null;
    this.history = [];
    this.historyStep = -1;

    this.init();
  }

  init() {
    // 绑定鼠标事件
    this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this));
    this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
    this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this));
    this.canvas.addEventListener(
      "mouseleave",
      this.handleMouseLeave.bind(this)
    );

    // 绑定工具按钮事件
    document.querySelectorAll(".tool-btn").forEach((btn) => {
      btn.addEventListener("click", this.handleToolChange.bind(this));
    });

    // 绑定底栏按钮事件
    document
      .getElementById("undoBtn")
      .addEventListener("click", this.undo.bind(this));
    document
      .getElementById("redoBtn")
      .addEventListener("click", this.redo.bind(this));
    document
      .getElementById("clearBtn")
      .addEventListener("click", this.clear.bind(this));

    // 设置初始工具
    this.setTool("move");
  }

  handleToolChange(e) {
    const tool = e.currentTarget.dataset.tool;
    this.setTool(tool);
  }

  setTool(tool) {
    this.currentTool = tool;

    // 更新工具按钮状态
    document.querySelectorAll(".tool-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    document.querySelector(`[data-tool="${tool}"]`).classList.add("active");

    // 更新鼠标样式
    this.canvas.classList.remove("move-mode", "drawing-mode");
    if (tool === "move") {
      this.canvas.classList.add("move-mode");
    } else {
      this.canvas.classList.add("drawing-mode");
    }
  }

  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.startX = e.clientX - rect.left;
    this.startY = e.clientY - rect.top;

    if (this.currentTool === "move") {
      // 移动工具：检查是否点击了已有元素
      this.checkElementClick(this.startX, this.startY);
    } else {
      // 绘制工具：开始绘制
      this.isDrawing = true;
      this.showSelectionBox(this.startX, this.startY, 0, 0);
    }
  }

  handleMouseMove(e) {
    if (!this.isDrawing) return;

    const rect = this.canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const width = currentX - this.startX;
    const height = currentY - this.startY;

    // 更新选择框位置和大小
    this.updateSelectionBox(this.startX, this.startY, width, height);
  }

  handleMouseUp(e) {
    if (!this.isDrawing) return;

    this.isDrawing = false;

    const rect = this.canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    const width = Math.abs(endX - this.startX);
    const height = Math.abs(endY - this.startY);

    // 只有当拖动范围大于最小值时才创建元素
    if (width > 10 && height > 10) {
      this.createElement(
        Math.min(this.startX, endX),
        Math.min(this.startY, endY),
        width,
        height
      );
    }

    // 隐藏选择框
    this.hideSelectionBox();
  }

  handleMouseLeave(e) {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.hideSelectionBox();
    }
  }

  showSelectionBox(x, y, width, height) {
    this.selectionBox.style.display = "block";
    this.updateSelectionBox(x, y, width, height);
  }

  updateSelectionBox(x, y, width, height) {
    // 处理负宽高的情况
    const left = width < 0 ? x + width : x;
    const top = height < 0 ? y + height : y;
    const finalWidth = Math.abs(width);
    const finalHeight = Math.abs(height);

    this.selectionBox.style.left = `${left}px`;
    this.selectionBox.style.top = `${top}px`;
    this.selectionBox.style.width = `${finalWidth}px`;
    this.selectionBox.style.height = `${finalHeight}px`;
  }

  hideSelectionBox() {
    this.selectionBox.style.display = "none";
  }

  createElement(x, y, width, height) {
    const element = document.createElement("div");
    element.className = "drawn-element";
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.dataset.tool = this.currentTool;

    // 添加调整大小的控制点
    this.addResizeHandles(element);

    // 添加到画布
    this.canvas.appendChild(element);
    this.elements.push(element);

    // 保存到历史记录
    this.saveHistory();

    // 绑定元素事件
    element.addEventListener("click", (e) => {
      e.stopPropagation();
      this.selectElement(element);
    });
  }

  addResizeHandles(element) {
    const handles = ["nw", "ne", "sw", "se"];
    handles.forEach((position) => {
      const handle = document.createElement("div");
      handle.className = `resize-handle ${position}`;
      element.appendChild(handle);
    });
  }

  selectElement(element) {
    // 取消之前的选择
    if (this.selectedElement) {
      this.selectedElement.classList.remove("selected");
    }

    // 选择新元素
    this.selectedElement = element;
    element.classList.add("selected");
  }

  checkElementClick(x, y) {
    // 从后往前遍历，优先选择上层元素
    for (let i = this.elements.length - 1; i >= 0; i--) {
      const element = this.elements[i];
      const rect = element.getBoundingClientRect();
      const canvasRect = this.canvas.getBoundingClientRect();

      const elementX = rect.left - canvasRect.left;
      const elementY = rect.top - canvasRect.top;
      const elementWidth = rect.width;
      const elementHeight = rect.height;

      if (
        x >= elementX &&
        x <= elementX + elementWidth &&
        y >= elementY &&
        y <= elementY + elementHeight
      ) {
        this.selectElement(element);
        return;
      }
    }

    // 没有点击到任何元素，取消选择
    if (this.selectedElement) {
      this.selectedElement.classList.remove("selected");
      this.selectedElement = null;
    }
  }

  saveHistory() {
    this.historyStep++;
    this.history = this.history.slice(0, this.historyStep);

    const state = this.canvas.innerHTML;
    this.history.push(state);

    // 限制历史记录数量
    if (this.history.length > 50) {
      this.history.shift();
      this.historyStep--;
    }
  }

  undo() {
    if (this.historyStep > 0) {
      this.historyStep--;
      this.restoreState(this.history[this.historyStep]);
    }
  }

  redo() {
    if (this.historyStep < this.history.length - 1) {
      this.historyStep++;
      this.restoreState(this.history[this.historyStep]);
    }
  }

  restoreState(state) {
    this.canvas.innerHTML = state;
    this.elements = Array.from(this.canvas.querySelectorAll(".drawn-element"));
    this.selectedElement = null;

    // 重新绑定元素事件
    this.elements.forEach((element) => {
      element.addEventListener("click", (e) => {
        e.stopPropagation();
        this.selectElement(element);
      });
    });
  }

  clear() {
    if (this.elements.length === 0) return;

    if (confirm("确定要清除所有绘制的内容吗？")) {
      this.elements.forEach((element) => {
        element.remove();
      });
      this.elements = [];
      this.selectedElement = null;
      this.saveHistory();
    }
  }
}

// 初始化画布交互
document.addEventListener("DOMContentLoaded", () => {
  new CanvasInteraction();
});
