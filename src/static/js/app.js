document.addEventListener("DOMContentLoaded", function () {
  // 获取DOM元素
  const designerCanvas = document.getElementById("designerCanvas");
  const canvasOverlay = document.getElementById("canvasOverlay");
  const selectionBox = document.getElementById("selectionBox");
  const undoBtn = document.getElementById("undoBtn");
  const redoBtn = document.getElementById("redoBtn");
  const clearBtn = document.getElementById("clearBtn");
  const coordinatesDisplay = document.getElementById("coordinates");
  const toolBtns = document.querySelectorAll(".tool-btn");

  // 应用状态
  let currentTool = "move";
  let currentMaterial = "aluminum";
  let isDrawing = false;
  let startX, startY;
  let selectedElement = null;
  let designElements = [];
  let history = [];
  let historyIndex = -1;

  // 初始化画布大小
  function initCanvasSize() {
    const designerSection = designerCanvas.parentElement;
    designerCanvas.style.width = designerSection.clientWidth + "px";
    designerCanvas.style.height = designerSection.clientHeight + "px";
    canvasOverlay.style.width = designerSection.clientWidth + "px";
    canvasOverlay.style.height = designerSection.clientHeight + "px";
  }

  // 工具选择处理
  toolBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      // 移除所有工具按钮的active状态
      document.querySelectorAll(".tool-btn[data-tool]").forEach((b) => {
        b.classList.remove("active");
      });
      document.querySelectorAll(".tool-btn[data-material]").forEach((b) => {
        b.classList.remove("active");
      });

      // 设置当前工具
      if (this.dataset.tool) {
        currentTool = this.dataset.tool;
        this.classList.add("active");
        updateCursor();
      } else if (this.dataset.material) {
        currentMaterial = this.dataset.material;
        this.classList.add("active");
      }
    });
  });

  // 更新鼠标样式
  function updateCursor() {
    designerCanvas.classList.remove("move-mode", "drawing-mode");
    if (currentTool === "move") {
      designerCanvas.classList.add("move-mode");
    } else {
      designerCanvas.classList.add("drawing-mode");
    }
  }

  // 记录历史
  function saveHistory() {
    // 移除当前状态之后的历史记录
    if (historyIndex < history.length - 1) {
      history = history.slice(0, historyIndex + 1);
    }
    // 保存当前状态的副本
    const currentState = JSON.parse(JSON.stringify(designElements));
    history.push(currentState);
    historyIndex = history.length - 1;
  }

  // 撤销操作
  function undo() {
    if (historyIndex > 0) {
      historyIndex--;
      restoreFromHistory();
    }
  }

  // 重做操作
  function redo() {
    if (historyIndex < history.length - 1) {
      historyIndex++;
      restoreFromHistory();
    }
  }

  // 从历史记录恢复
  function restoreFromHistory() {
    clearDesign();
    const savedState = history[historyIndex];
    savedState.forEach((element) => {
      addElement(element);
    });
  }

  // 清除设计
  function clearDesign() {
    while (designerCanvas.firstChild) {
      if (
        designerCanvas.firstChild.classList &&
        designerCanvas.firstChild.classList.contains("canvas-overlay")
      ) {
        // 保留覆盖层
        break;
      }
      designerCanvas.removeChild(designerCanvas.firstChild);
    }
    designElements = [];
    selectedElement = null;
    isSaved = false;
    updateStatusIndicator();
  }

  // 添加元素到画布
  function addElement(elementData) {
    const element = document.createElement("div");
    element.classList.add("drawn-element");
    element.style.left = elementData.x + "px";
    element.style.top = elementData.y + "px";
    element.style.width = elementData.width + "px";
    element.style.height = elementData.height + "px";
    element.dataset.type = elementData.type;

    // 根据元素类型添加特定样式
    if (elementData.type === "border") {
      element.classList.add("border-element");
    } else if (elementData.type === "mullion") {
      element.classList.add("mullion-element");
    } else if (elementData.type === "grid") {
      element.classList.add("grid-element");
    } else if (elementData.type === "sash-with-screen") {
      element.classList.add("sash-element", "with-screen");
    } else if (elementData.type === "sash-no-screen") {
      element.classList.add("sash-element", "no-screen");
    }

    // 根据材料设置样式
    if (elementData.material) {
      element.classList.add("material-" + elementData.material);
    }

    // 添加到画布
    designerCanvas.insertBefore(element, canvasOverlay);

    // 添加点击事件
    element.addEventListener("click", function (e) {
      e.stopPropagation();
      selectElement(element);
    });

    // 保存到设计元素数组
    designElements.push(elementData);

    return element;
  }

  // 选择元素
  function selectElement(element) {
    // 取消之前的选择
    if (selectedElement) {
      selectedElement.classList.remove("selected");
    }

    // 选择新元素
    selectedElement = element;
    element.classList.add("selected");
  }

  // 鼠标按下事件
  designerCanvas.addEventListener("mousedown", function (e) {
    if (e.target === canvasOverlay || e.target === selectionBox) return;

    // 如果点击的是画布背景，取消选择
    if (e.target === designerCanvas) {
      if (selectedElement) {
        selectedElement.classList.remove("selected");
        selectedElement = null;
      }

      // 如果当前工具不是移动工具，开始绘制
      if (currentTool !== "move") {
        isDrawing = true;
        startX = e.clientX - designerCanvas.getBoundingClientRect().left;
        startY = e.clientY - designerCanvas.getBoundingClientRect().top;

        // 显示选择框
        selectionBox.style.display = "block";
        selectionBox.style.left = startX + "px";
        selectionBox.style.top = startY + "px";
        selectionBox.style.width = "0px";
        selectionBox.style.height = "0px";
      }
    }
  });

  // 鼠标移动事件
  designerCanvas.addEventListener("mousemove", function (e) {
    // 更新坐标显示
    const x = Math.round(
      e.clientX - designerCanvas.getBoundingClientRect().left
    );
    const y = Math.round(
      e.clientY - designerCanvas.getBoundingClientRect().top
    );
    coordinatesDisplay.textContent = `坐标: (${x}, ${y})`;

    // 绘制过程中更新选择框
    if (isDrawing) {
      const currentX = e.clientX - designerCanvas.getBoundingClientRect().left;
      const currentY = e.clientY - designerCanvas.getBoundingClientRect().top;

      const left = Math.min(startX, currentX);
      const top = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      selectionBox.style.left = left + "px";
      selectionBox.style.top = top + "px";
      selectionBox.style.width = width + "px";
      selectionBox.style.height = height + "px";
    }
  });

  // 鼠标松开事件
  document.addEventListener("mouseup", function (e) {
    if (isDrawing) {
      isDrawing = false;

      // 隐藏选择框
      selectionBox.style.display = "none";

      // 获取选择框的尺寸
      const left = parseInt(selectionBox.style.left);
      const top = parseInt(selectionBox.style.top);
      const width = parseInt(selectionBox.style.width);
      const height = parseInt(selectionBox.style.height);

      // 只有当尺寸足够大时才添加元素
      if (width > 10 && height > 10) {
        // 保存历史记录
        saveHistory();

        // 创建新元素
        const newElement = {
          type: currentTool,
          x: left,
          y: top,
          width: width,
          height: height,
          material: currentMaterial,
        };

        // 添加到画布
        addElement(newElement);
      }
    }
  });

  // 窗口大小变化时重新调整画布大小
  window.addEventListener("resize", initCanvasSize);

  // 绑定按钮事件
  undoBtn.addEventListener("click", undo);
  redoBtn.addEventListener("click", redo);
  clearBtn.addEventListener("click", function () {
    if (confirm("确定要清除所有设计吗？")) {
      saveHistory();
      clearDesign();
    }
  });

  // 初始化
  initCanvasSize();
  updateCursor();
});
