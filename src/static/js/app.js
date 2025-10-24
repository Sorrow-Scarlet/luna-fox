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
  let isDragging = false;
  let isResizing = false;
  let resizeHandle = null;
  let elementOffsetX, elementOffsetY;

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

        // 如果当前有选中的元素，根据工具类型处理调整手柄
        if (selectedElement) {
          if (currentTool === "move") {
            addResizeHandles(selectedElement);
          } else {
            removeResizeHandles();
          }
        }
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
      // 创建矩形环（空心矩形）效果
      element.style.backgroundColor = "transparent";
      element.style.border = "3px solid #333";

      // 在内部距离描边10px的位置创建一个相同的矩形
      const innerBorder = document.createElement("div");
      innerBorder.classList.add("drawn-element", "inner-border");
      innerBorder.style.position = "absolute";
      innerBorder.style.left = "10px";
      innerBorder.style.top = "10px";
      innerBorder.style.width = elementData.width - 20 + "px";
      innerBorder.style.height = elementData.height - 20 + "px";
      innerBorder.style.backgroundColor = "transparent";
      innerBorder.style.border = "3px solid #333";
      innerBorder.style.pointerEvents = "none"; // 避免内部矩形影响点击交互
      element.appendChild(innerBorder);
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
      removeResizeHandles();
    }

    // 选择新元素
    selectedElement = element;
    element.classList.add("selected");

    // 添加调整手柄
    if (currentTool === "move") {
      addResizeHandles(element);
    }
  }

  // 添加调整手柄
  function addResizeHandles(element) {
    if (!element) return;

    // 移除可能存在的旧手柄
    removeResizeHandles();

    // 添加八个调整手柄（四个角和四个边）
    const handles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
    handles.forEach((position) => {
      const handle = document.createElement("div");
      handle.classList.add("resize-handle", position);
      element.appendChild(handle);

      // 添加鼠标按下事件
      handle.addEventListener("mousedown", function (e) {
        e.stopPropagation();
        isResizing = true;
        resizeHandle = position;

        // 准备历史记录
        saveHistory();
      });
    });
  }

  // 移除调整手柄
  function removeResizeHandles() {
    const handles = document.querySelectorAll(".resize-handle");
    handles.forEach((handle) => handle.remove());
  }

  // 鼠标按下事件
  designerCanvas.addEventListener("mousedown", function (e) {
    if (e.target === canvasOverlay || e.target === selectionBox) return;

    // 如果点击的是画布背景，取消选择
    if (e.target === designerCanvas) {
      if (selectedElement) {
        selectedElement.classList.remove("selected");
        removeResizeHandles();
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
    } else if (e.target.classList.contains("drawn-element")) {
      // 点击的是元素
      selectElement(e.target);

      // 如果是移动工具，准备拖拽
      if (currentTool === "move") {
        isDragging = true;
        const elementRect = e.target.getBoundingClientRect();
        const canvasRect = designerCanvas.getBoundingClientRect();

        elementOffsetX = e.clientX - elementRect.left;
        elementOffsetY = e.clientY - elementRect.top;

        // 准备历史记录
        saveHistory();
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
    // 拖拽移动元素
    else if (isDragging && selectedElement) {
      const canvasRect = designerCanvas.getBoundingClientRect();
      const newX = e.clientX - canvasRect.left - elementOffsetX;
      const newY = e.clientY - canvasRect.top - elementOffsetY;

      // 更新元素位置
      selectedElement.style.left = Math.max(0, newX) + "px";
      selectedElement.style.top = Math.max(0, newY) + "px";

      // 更新设计数据
      updateElementData();
    }
    // 调整元素大小
    else if (isResizing && selectedElement) {
      const canvasRect = designerCanvas.getBoundingClientRect();
      const x = e.clientX - canvasRect.left;
      const y = e.clientY - canvasRect.top;

      let elementLeft = parseInt(selectedElement.style.left);
      let elementTop = parseInt(selectedElement.style.top);
      let elementWidth = parseInt(selectedElement.style.width);
      let elementHeight = parseInt(selectedElement.style.height);

      // 根据手柄位置调整尺寸
      switch (resizeHandle) {
        case "nw":
          const newWidthNW = elementLeft + elementWidth - x;
          const newHeightNW = elementTop + elementHeight - y;
          if (newWidthNW > 20 && newHeightNW > 20) {
            elementLeft = x;
            elementTop = y;
            elementWidth = newWidthNW;
            elementHeight = newHeightNW;
          }
          break;
        case "n":
          const newHeightN = elementTop + elementHeight - y;
          if (newHeightN > 20) {
            elementTop = y;
            elementHeight = newHeightN;
          }
          break;
        case "ne":
          const newWidthNE = x - elementLeft;
          const newHeightNE = elementTop + elementHeight - y;
          if (newWidthNE > 20 && newHeightNE > 20) {
            elementWidth = newWidthNE;
            elementTop = y;
            elementHeight = newHeightNE;
          }
          break;
        case "e":
          elementWidth = Math.max(20, x - elementLeft);
          break;
        case "se":
          elementWidth = Math.max(20, x - elementLeft);
          elementHeight = Math.max(20, y - elementTop);
          break;
        case "s":
          elementHeight = Math.max(20, y - elementTop);
          break;
        case "sw":
          const newWidthSW = elementLeft + elementWidth - x;
          if (newWidthSW > 20) {
            elementLeft = x;
            elementWidth = newWidthSW;
            elementHeight = Math.max(20, y - elementTop);
          }
          break;
        case "w":
          const newWidthW = elementLeft + elementWidth - x;
          if (newWidthW > 20) {
            elementLeft = x;
            elementWidth = newWidthW;
          }
          break;
      }

      // 更新元素样式
      selectedElement.style.left = elementLeft + "px";
      selectedElement.style.top = elementTop + "px";
      selectedElement.style.width = elementWidth + "px";
      selectedElement.style.height = elementHeight + "px";

      // 更新设计数据
      updateElementData();
    }
  });

  // 更新元素数据
  function updateElementData() {
    if (!selectedElement) return;

    // 找到对应的设计数据
    const elementIndex = Array.from(designerCanvas.children).findIndex(
      (child) => child === selectedElement
    );

    if (elementIndex !== -1 && elementIndex < designElements.length) {
      designElements[elementIndex].x = parseInt(selectedElement.style.left);
      designElements[elementIndex].y = parseInt(selectedElement.style.top);
      designElements[elementIndex].width = parseInt(
        selectedElement.style.width
      );
      designElements[elementIndex].height = parseInt(
        selectedElement.style.height
      );
    }
  }

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
    // 停止拖拽
    else if (isDragging) {
      isDragging = false;
    }
    // 停止调整大小
    else if (isResizing) {
      isResizing = false;
      resizeHandle = null;
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
