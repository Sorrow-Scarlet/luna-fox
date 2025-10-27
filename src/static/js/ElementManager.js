// 元素管理器类 - 处理元素的添加、选择和调整等功能
class ElementManager {
  constructor(canvas, canvasOverlay, state) {
    this.canvas = canvas;
    this.canvasOverlay = canvasOverlay;
    this.state = state;
  }

  // 添加元素到画布
  addElement(elementData) {
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
      element.style.backgroundColor = "#f9b4ffff";
      element.style.border = "3px solid #333";

      // 在内部距离描边10px的位置创建一个相同的矩形
      const innerBorder = document.createElement("div");
      innerBorder.classList.add("drawn-element", "inner-border");
      innerBorder.style.position = "absolute";

      // 使用统一的padding变量，确保计算一致
      const padding = 10;
      // 内部矩形的边框宽度
      const innerBorderWidth = 3;

      // 计算内部矩形的大小，考虑内矩形自身的边框宽度，确保与外部矩形四边都保持10px间距
      const innerWidth = Math.max(
        20,
        elementData.width - padding * 2 - innerBorderWidth * 2
      );
      const innerHeight = Math.max(
        20,
        elementData.height - padding * 2 - innerBorderWidth * 2
      );

      // 精确设置内部矩形的位置和大小
      innerBorder.style.left = padding + "px";
      innerBorder.style.top = padding + "px";
      innerBorder.style.width = innerWidth + "px";
      innerBorder.style.height = innerHeight + "px";
      innerBorder.style.backgroundColor = "white";
      innerBorder.style.border = "3px solid #333";
      innerBorder.style.pointerEvents = "none"; // 避免内部矩形影响点击交互
      element.appendChild(innerBorder);
    } else if (
      elementData.type === "mullion-horizontal" ||
      elementData.type === "mullion-vertical"
    ) {
      // 中梃元素样式 - 10px粗，与外矩形色彩一致
      element.classList.add("mullion-element");
      element.style.backgroundColor = "#f9b4ffff";
      element.style.border = "none";
      element.style.zIndex = "20";

      // 添加拖动调节手柄
      this.addMullionDragHandle(element, elementData.type);
    } else if (elementData.type === "grid") {
      element.classList.add("grid-element");
    } else if (elementData.type === "sash-with-screen") {
      element.classList.add("sash-element", "with-screen");
    } else if (elementData.type === "sash-no-screen") {
      element.classList.add("sash-element", "no-screen");
    }

    // 添加到画布
    this.canvas.insertBefore(element, this.canvasOverlay);

    // 添加点击事件
    element.addEventListener("click", (e) => {
      e.stopPropagation();
      this.selectElement(element);
    });

    // 保存到设计元素数组
    this.state.designElements.push(elementData);

    // 如果是中梃元素，建立与边框的组合关系
    if (
      elementData.type === "mullion-horizontal" ||
      elementData.type === "mullion-vertical"
    ) {
      this.associateMullionWithBorder(element);
    }

    return element;
  }

  // 选择元素
  selectElement(element) {
    // 取消之前的选择
    if (this.state.selectedElement) {
      this.state.selectedElement.classList.remove("selected");
      this.removeResizeHandles();
    }

    // 选择新元素
    this.state.selectedElement = element;
    element.classList.add("selected");

    // 添加调整手柄
    if (this.state.currentTool === "move") {
      // 确保先移除所有现有手柄
      this.removeResizeHandles();
      this.addResizeHandles(element);
    }
  }

  // 添加调整手柄
  addResizeHandles(element) {
    if (!element) return;

    // 如果是中梃元素，不添加调整手柄（中梃只能移动，不能缩放）
    if (element.classList.contains("mullion-element")) {
      return;
    }

    // 移除可能存在的旧手柄
    this.removeResizeHandles();

    // 添加八个调整手柄（四个角和四个边）
    const handles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
    handles.forEach((position) => {
      const handle = document.createElement("div");
      handle.classList.add("resize-handle", position);
      element.appendChild(handle);

      // 添加鼠标按下事件
      handle.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        this.state.isResizing = true;
        this.state.resizeHandle = position;
      });
    });
  }

  // 移除调整手柄
  removeResizeHandles() {
    const handles = document.querySelectorAll(".resize-handle");
    handles.forEach((handle) => handle.remove());
  }

  // 获取元素对应的设计数据
  getElementData(element) {
    // 尝试通过元素的唯一标识查找数据
    const elements = Array.from(this.canvas.children).filter(
      (child) => child !== this.canvasOverlay
    );

    const index = elements.indexOf(element);

    if (index !== -1 && index < this.state.designElements.length) {
      return this.state.designElements[index];
    }

    return null;
  }

  // 更新元素数据
  updateElementData(element = null) {
    const targetElement = element || this.state.selectedElement;

    if (!targetElement) return;

    // 获取对应的设计数据
    const elementData = this.getElementData(targetElement);

    if (elementData) {
      // 更新数据，使用Math.floor确保整数
      elementData.x = Math.floor(parseInt(targetElement.style.left) || 0);
      elementData.y = Math.floor(parseInt(targetElement.style.top) || 0);
      elementData.width = Math.floor(parseInt(targetElement.style.width) || 0);
      elementData.height = Math.floor(
        parseInt(targetElement.style.height) || 0
      );
    }

    // 更新内部矩形的大小和位置，确保始终与外矩形四边保持10px的间距
    const innerBorder =
      this.state.selectedElement?.querySelector(".inner-border");
    if (innerBorder) {
      // 获取外部矩形的实际大小（不含边框）
      const outerWidth = parseInt(this.state.selectedElement.style.width);
      const outerHeight = parseInt(this.state.selectedElement.style.height);

      // 计算内部矩形的大小，确保内矩形始终小于外矩形，且最小为10px × 10px
      const padding = 10;
      const innerBorderWidth = 3;

      // 计算内部矩形的大小，考虑内矩形自身的边框宽度
      const innerWidth = Math.max(
        10, // 最小宽度10px
        Math.min(
          outerWidth - padding * 2 - innerBorderWidth * 2 - 1, // 确保小于外矩形
          outerWidth - padding * 2 - innerBorderWidth * 2
        )
      );
      const innerHeight = Math.max(
        10, // 最小高度10px
        Math.min(
          outerHeight - padding * 2 - innerBorderWidth * 2 - 1, // 确保小于外矩形
          outerHeight - padding * 2 - innerBorderWidth * 2
        )
      );

      // 精确设置内部矩形的位置和大小
      innerBorder.style.left = padding + "px";
      innerBorder.style.top = padding + "px";
      innerBorder.style.width = innerWidth + "px";
      innerBorder.style.height = innerHeight + "px";
    }
  }

  // 添加中梃拖动调节手柄
  addMullionDragHandle(element, mullionType) {
    const dragHandle = document.createElement("div");
    dragHandle.classList.add("mullion-drag-handle");

    if (mullionType === "mullion-horizontal") {
      dragHandle.style.width = "20px";
      dragHandle.style.height = "10px";
      dragHandle.style.left = "50%";
      dragHandle.style.top = "-5px";
      dragHandle.style.transform = "translateX(-50%)";
      dragHandle.style.cursor = "ns-resize";
    } else {
      dragHandle.style.width = "10px";
      dragHandle.style.height = "20px";
      dragHandle.style.left = "-5px";
      dragHandle.style.top = "50%";
      dragHandle.style.transform = "translateY(-50%)";
      dragHandle.style.cursor = "ew-resize";
    }

    dragHandle.style.position = "absolute";
    dragHandle.style.backgroundColor = "#ff6b6b";
    dragHandle.style.borderRadius = "2px";
    dragHandle.style.zIndex = "30";

    // 添加鼠标事件
    dragHandle.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      this.state.isMullionDragging = true;
      this.state.activeMullion = element;
      this.state.mullionType = mullionType;
    });

    element.appendChild(dragHandle);
  }

  // 清除所有元素
  clearAllElements() {
    // 安全地清除元素
    if (!this.canvas || !this.canvasOverlay) return;

    // 获取除了canvasOverlay之外的所有元素
    const elements = Array.from(this.canvas.children).filter(
      (child) => child !== this.canvasOverlay
    );

    // 逐个移除元素
    elements.forEach((element) => {
      if (element.parentNode === this.canvas) {
        this.canvas.removeChild(element);
      }
    });

    // 重置状态
    this.state.designElements = [];
    this.state.selectedElement = null;
    this.state.isDrawing = false;
    this.state.isDragging = false;
    this.state.isResizing = false;
    this.state.isMullionDrawing = false;
    this.state.isMullionDragging = false;
    this.state.activeMullion = null;

    // 清除组合关系
    this.state.mullionGroups.clear();
  }

  // 建立中梃与边框的组合关系
  associateMullionWithBorder(mullionElement) {
    const borderElement = this.findParentBorder(mullionElement);
    if (!borderElement) return;

    // 获取或创建边框对应的中梃数组
    if (!this.state.mullionGroups.has(borderElement)) {
      this.state.mullionGroups.set(borderElement, []);
    }

    const mullions = this.state.mullionGroups.get(borderElement);
    if (!mullions.includes(mullionElement)) {
      mullions.push(mullionElement);
    }
  }

  // 查找中梃对应的父边框元素
  findParentBorder(mullionElement) {
    const elements = Array.from(this.canvas.children).filter(
      (child) => child !== this.canvasOverlay
    );

    // 查找边框元素（包含inner-border的元素）
    return elements.find((element) => {
      return (
        element.querySelector(".inner-border") &&
        this.isMullionInsideBorder(mullionElement, element)
      );
    });
  }

  // 判断中梃是否在边框内
  isMullionInsideBorder(mullionElement, borderElement) {
    const mullionRect = mullionElement.getBoundingClientRect();
    const borderRect = borderElement.getBoundingClientRect();

    return (
      mullionRect.left >= borderRect.left &&
      mullionRect.right <= borderRect.right &&
      mullionRect.top >= borderRect.top &&
      mullionRect.bottom <= borderRect.bottom
    );
  }

  // 更新与边框组合的中梃位置
  updateAssociatedMullions(borderElement, deltaX, deltaY, scaleX, scaleY) {
    if (!this.state.mullionGroups.has(borderElement)) return;

    const mullions = this.state.mullionGroups.get(borderElement);
    mullions.forEach((mullion) => {
      // 获取边框的当前位置和尺寸
      const borderLeft = parseInt(borderElement.style.left) || 0;
      const borderTop = parseInt(borderElement.style.top) || 0;
      const borderWidth = parseInt(borderElement.style.width) || 0;
      const borderHeight = parseInt(borderElement.style.height) || 0;

      // 计算内矩形尺寸（与边框内矩形保持一致）
      const padding = 10;
      const innerBorderWidth = 3;
      const innerWidth = Math.max(
        10,
        Math.min(
          borderWidth - padding * 2 - innerBorderWidth * 2 - 1,
          borderWidth - padding * 2 - innerBorderWidth * 2
        )
      );
      const innerHeight = Math.max(
        10,
        Math.min(
          borderHeight - padding * 2 - innerBorderWidth * 2 - 1,
          borderHeight - padding * 2 - innerBorderWidth * 2
        )
      );

      // 获取中梃的当前位置（用于计算分割比例）
      const currentLeft = parseInt(mullion.style.left) || 0;
      const currentTop = parseInt(mullion.style.top) || 0;

      // 计算中梃相对于内矩形的分割比例
      const elementData = this.getElementData(mullion);
      if (elementData && elementData.type === "mullion-horizontal") {
        // 水平中梃：垂直分割，计算Y轴比例
        const relativeY = (currentTop - borderTop - padding) / borderHeight;
        const ratio = Math.max(0.1, Math.min(0.9, relativeY));

        // 重新计算中梃位置和尺寸：跨越内矩形宽度，厚度10px
        mullion.style.left = borderLeft + padding + "px";
        mullion.style.top =
          borderTop + padding + innerHeight * ratio - 5 + "px"; // 居中位置
        mullion.style.width = innerWidth + "px";
        mullion.style.height = "10px";
      } else if (elementData && elementData.type === "mullion-vertical") {
        // 垂直中梃：水平分割，计算X轴比例
        const relativeX = (currentLeft - borderLeft - padding) / borderWidth;
        const ratio = Math.max(0.1, Math.min(0.9, relativeX));

        // 重新计算中梃位置和尺寸：跨越内矩形高度，厚度10px
        mullion.style.left =
          borderLeft + padding + innerWidth * ratio - 5 + "px"; // 居中位置
        mullion.style.top = borderTop + padding + "px";
        mullion.style.width = "10px";
        mullion.style.height = innerHeight + "px";
      }

      // 更新设计数据
      this.updateElementData(mullion);
    });
  }
}
