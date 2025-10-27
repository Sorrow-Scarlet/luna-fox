// 事件管理器类 - 处理所有鼠标事件和交互逻辑
class EventManager {
  constructor(
    canvas,
    canvasOverlay,
    selectionBox,
    state,
    elementManager,
    toolManager,
    historyManager
  ) {
    this.canvas = canvas;
    this.canvasOverlay = canvasOverlay;
    this.selectionBox = selectionBox;
    this.state = state;
    this.elementManager = elementManager;
    this.toolManager = toolManager;
    this.historyManager = historyManager;

    // 绑定方法到实例
    this.handleCanvasMouseDown = this.handleCanvasMouseDown.bind(this);
    this.handleCanvasMouseMove = this.handleCanvasMouseMove.bind(this);
    this.handleDocumentMouseUp = this.handleDocumentMouseUp.bind(this);
  }

  // 初始化事件监听
  initialize() {
    // 绑定事件监听器
    this.canvas.addEventListener("mousedown", this.handleCanvasMouseDown);
    this.canvas.addEventListener("mousemove", this.handleCanvasMouseMove);
    document.addEventListener("mouseup", this.handleDocumentMouseUp);
  }

  // 鼠标按下事件
  handleCanvasMouseDown(e) {
    if (e.target === this.canvasOverlay || e.target === this.selectionBox)
      return;

    // 如果点击的是画布背景，取消选择
    if (e.target === this.canvas) {
      this.deselectElement();

      // 如果当前工具不是移动工具，开始绘制
      if (this.state.currentTool !== "move") {
        this.startDrawing(e);
      }
    } else if (e.target.classList.contains("drawn-element")) {
      // 点击的是元素
      e.stopPropagation();
      this.handleElementClick(e);
    }
  }

  // 取消选择元素
  deselectElement() {
    if (this.state.selectedElement) {
      this.state.selectedElement.classList.remove("selected");
      this.elementManager.removeResizeHandles();
      this.state.selectedElement = null;
    }
  }

  // 开始绘制
  startDrawing(e) {
    this.state.isDrawing = true;
    const coords = this.getCanvasCoordinates(e);
    this.state.startX = coords.x;
    this.state.startY = coords.y;

    // 显示选择框
    this.selectionBox.style.display = "block";
    this.selectionBox.style.left = this.state.startX + "px";
    this.selectionBox.style.top = this.state.startY + "px";
    this.selectionBox.style.width = "0px";
    this.selectionBox.style.height = "0px";
  }

  // 处理元素点击
  handleElementClick(e) {
    // 先选择元素
    this.elementManager.selectElement(e.target);

    // 如果是移动工具，准备拖拽
    if (this.state.currentTool === "move") {
      this.startDragging(e);
    }
  }

  // 开始拖拽
  startDragging(e) {
    this.state.isDragging = true;
    const elementRect = e.target.getBoundingClientRect();
    const canvasRect = this.canvas.getBoundingClientRect();

    this.state.elementOffsetX = e.clientX - elementRect.left;
    this.state.elementOffsetY = e.clientY - elementRect.top;

    // 准备历史记录
    this.historyManager.saveHistory();
  }

  // 鼠标移动事件
  handleCanvasMouseMove(e) {
    this.updateCoordinates(e);

    if (this.state.isDrawing) {
      this.updateSelectionBox(e);
    } else if (this.state.isDragging && this.state.selectedElement) {
      this.dragElement(e);
    } else if (this.state.isResizing && this.state.selectedElement) {
      this.resizeElement(e);
    }
  }

  // 更新坐标显示
  updateCoordinates(e) {
    const coords = this.getCanvasCoordinates(e);
    const coordinatesDisplay = document.getElementById("coordinates");
    if (coordinatesDisplay) {
      coordinatesDisplay.textContent = `坐标: (${Math.round(
        coords.x
      )}, ${Math.round(coords.y)})`;
    }
  }

  // 更新选择框
  updateSelectionBox(e) {
    const coords = this.getCanvasCoordinates(e);
    const currentX = coords.x;
    const currentY = coords.y;

    const left = Math.min(this.state.startX, currentX);
    const top = Math.min(this.state.startY, currentY);
    const width = Math.abs(currentX - this.state.startX);
    const height = Math.abs(currentY - this.state.startY);

    this.selectionBox.style.left = left + "px";
    this.selectionBox.style.top = top + "px";
    this.selectionBox.style.width = width + "px";
    this.selectionBox.style.height = height + "px";
  }

  // 拖拽元素
  dragElement(e) {
    const canvasRect = this.canvas.getBoundingClientRect();
    const newX = e.clientX - canvasRect.left - this.state.elementOffsetX;
    const newY = e.clientY - canvasRect.top - this.state.elementOffsetY;

    // 更新元素位置（限制在画布内）
    const boundedX = Math.max(
      0,
      Math.min(
        newX,
        canvasRect.width - parseInt(this.state.selectedElement.style.width)
      )
    );
    const boundedY = Math.max(
      0,
      Math.min(
        newY,
        canvasRect.height - parseInt(this.state.selectedElement.style.height)
      )
    );

    this.state.selectedElement.style.left = boundedX + "px";
    this.state.selectedElement.style.top = boundedY + "px";

    // 更新设计数据
    this.elementManager.updateElementData(this.state.selectedElement);
  }

  // 调整元素大小
  resizeElement(e) {
    const canvasRect = this.canvas.getBoundingClientRect();
    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;

    let elementLeft = parseInt(this.state.selectedElement.style.left) || 0;
    let elementTop = parseInt(this.state.selectedElement.style.top) || 0;
    let elementWidth = parseInt(this.state.selectedElement.style.width) || 0;
    let elementHeight = parseInt(this.state.selectedElement.style.height) || 0;
    const minSize = 20; // 最小尺寸阈值

    // 根据手柄位置调整尺寸
    switch (this.state.resizeHandle) {
      case "nw":
        const newWidthNW = elementLeft + elementWidth - x;
        const newHeightNW = elementTop + elementHeight - y;
        if (newWidthNW > minSize && newHeightNW > minSize && x >= 0 && y >= 0) {
          elementLeft = x;
          elementTop = y;
          elementWidth = newWidthNW;
          elementHeight = newHeightNW;
        }
        break;
      case "n":
        const newHeightN = elementTop + elementHeight - y;
        if (newHeightN > minSize && y >= 0) {
          elementTop = y;
          elementHeight = newHeightN;
        }
        break;
      case "ne":
        const newWidthNE = x - elementLeft;
        const newHeightNE = elementTop + elementHeight - y;
        if (
          newWidthNE > minSize &&
          newHeightNE > minSize &&
          x <= canvasRect.width &&
          y >= 0
        ) {
          elementWidth = newWidthNE;
          elementTop = y;
          elementHeight = newHeightNE;
        }
        break;
      case "e":
        if (x > elementLeft + minSize && x <= canvasRect.width) {
          elementWidth = x - elementLeft;
        }
        break;
      case "se":
        if (
          x > elementLeft + minSize &&
          x <= canvasRect.width &&
          y > elementTop + minSize &&
          y <= canvasRect.height
        ) {
          elementWidth = x - elementLeft;
          elementHeight = y - elementTop;
        }
        break;
      case "s":
        if (y > elementTop + minSize && y <= canvasRect.height) {
          elementHeight = y - elementTop;
        }
        break;
      case "sw":
        const newWidthSW = elementLeft + elementWidth - x;
        const newHeightSW = y - elementTop;
        if (
          newWidthSW > minSize &&
          newHeightSW > minSize &&
          x >= 0 &&
          y <= canvasRect.height
        ) {
          elementLeft = x;
          elementWidth = newWidthSW;
          elementHeight = newHeightSW;
        }
        break;
      case "w":
        const newWidthW = elementLeft + elementWidth - x;
        if (newWidthW > minSize && x >= 0) {
          elementLeft = x;
          elementWidth = newWidthW;
        }
        break;
    }

    // 应用新的尺寸和位置
    this.state.selectedElement.style.left = elementLeft + "px";
    this.state.selectedElement.style.top = elementTop + "px";
    this.state.selectedElement.style.width = elementWidth + "px";
    this.state.selectedElement.style.height = elementHeight + "px";

    // 更新设计数据
    this.elementManager.updateElementData(this.state.selectedElement);
  }

  // 鼠标释放事件
  handleDocumentMouseUp(e) {
    if (this.state.isDrawing) {
      this.finishDrawing(e);
    } else if (this.state.isDragging) {
      this.state.isDragging = false;
    } else if (this.state.isResizing) {
      this.state.isResizing = false;
      this.state.resizeHandle = null;
    }
  }

  // 完成绘制
  finishDrawing(e) {
    this.state.isDrawing = false;

    // 隐藏选择框
    this.selectionBox.style.display = "none";

    // 获取最终尺寸
    const coords = this.getCanvasCoordinates(e);
    const endX = coords.x;
    const endY = coords.y;

    const left = Math.min(this.state.startX, endX);
    const top = Math.min(this.state.startY, endY);
    const width = Math.abs(endX - this.state.startX);
    const height = Math.abs(endY - this.state.startY);

    // 确保最小尺寸
    if (width < 20 || height < 20) return;

    // 根据当前工具创建相应元素
    const elementData = {
      x: left,
      y: top,
      width: width,
      height: height,
      type: this.state.currentTool,
    };

    // 保存历史记录
    this.historyManager.saveHistory();

    // 添加元素
    this.elementManager.addElement(elementData);
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
